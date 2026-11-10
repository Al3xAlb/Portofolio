import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { createResponsesCall } from "../_shared/responses.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const BATCH_SIZE = 6; // photos per request; the browser keeps calling until none remain
const CONCURRENCY = 3;
const MAX_CAPTION = 300;

const BodySchema = z.object({
  event_id: z.string().uuid(),
  mode: z.enum(["missing", "all"]).default("missing"),
  // "all" mode: rewrite photos whose caption is older than this moment (the start of the run)
  since: z.string().datetime().optional(),
  skip_ids: z.array(z.string().uuid()).max(1000).default([]),
});

const INSTRUCTIONS = `You write alt text for photos in a designer's portfolio gallery.
Write ONE concise, accessible caption for the photo:
- One sentence, ideally under 125 characters, never more than 200.
- Describe the main subject, what is happening, and the setting; mention notable colours or mood only if they matter.
- Do not start with "Image of", "Photo of" or "Picture of".
- Do not guess people's names, identity, age, ethnicity or emotions you cannot see; describe them neutrally (e.g. "a person in a red coat").
- Transcribe short visible text (like a sign or logo) only if it is clearly legible and important.
- Plain language, no hashtags, no emojis, no quotation marks.
Reply with the caption only.`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type GatewayFailure = { status: number | null; message: string };

function describeError(err: unknown): GatewayFailure {
  // deno-lint-ignore no-explicit-any
  const e = err as any;
  const status: number | null = e?.statusCode ?? e?.cause?.statusCode ?? e?.lastError?.statusCode ?? null;
  let message: string = e?.message ?? "Unknown error";
  const body = e?.responseBody ?? e?.cause?.responseBody ?? e?.lastError?.responseBody;
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      message = parsed?.message ?? parsed?.error?.message ?? message;
    } catch {
      /* keep message */
    }
  }
  return { status, message };
}

function cleanCaption(text: string): string {
  let c = text.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").replace(/\s+/g, " ").trim();
  c = c.replace(/^(an?\s+)?(image|photo|picture|photograph)\s+of\s+/i, "");
  if (c) c = c[0].toUpperCase() + c.slice(1);
  if (c.length > MAX_CAPTION) c = c.slice(0, MAX_CAPTION - 1).trimEnd() + "…";
  return c;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "AI captions aren't set up yet." }, 500);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Admins only
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Please sign in." }, 401);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Please sign in." }, 401);
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return json({ error: "Only the site owner can write captions." }, 403);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: "Invalid request" }, 400);
  const { event_id, mode, since, skip_ids } = parsed.data;

  const { data: event } = await supabase.from("events").select("id, title").eq("id", event_id).maybeSingle();
  if (!event) return json({ error: "Event not found." }, 404);

  const eligibleQuery = () => {
    let q = supabase
      .from("event_files")
      .select("id, storage_path, file_name, mime_type")
      .eq("event_id", event_id)
      .like("mime_type", "image/%")
      .order("sort_order");
    if (mode === "missing") q = q.is("caption", null);
    else if (since) q = q.or(`caption_generated_at.is.null,caption_generated_at.lt.${since}`);
    return q;
  };

  const { data: eligible, error: listError } = await eligibleQuery();
  if (listError) return json({ error: "Couldn't load the photos." }, 500);
  const skip = new Set(skip_ids);
  const todo = (eligible ?? []).filter((f) => !skip.has(f.id));
  const batch = todo.slice(0, BATCH_SIZE);

  let processed = 0;
  const failed: { id: string; file_name: string; reason: string }[] = [];
  let stopped: GatewayFailure | null = null;

  const queue = [...batch];
  const worker = async () => {
    while (queue.length && !stopped) {
      const file = queue.shift()!;
      const { data: signed } = await supabase.storage.from("event-files").createSignedUrl(file.storage_path, 600);
      if (!signed?.signedUrl) {
        failed.push({ id: file.id, file_name: file.file_name, reason: "The photo file couldn't be opened." });
        continue;
      }
      try {
        const call = createResponsesCall(
          req,
          { baseURL: GATEWAY_URL, apiKey, model: MODEL, reasoningEffort: "low" },
          [
            {
              role: "user",
              content: [
                { type: "text", text: `Gallery: "${event.title}". Write the alt text for this photo.` },
                { type: "file", data: new URL(signed.signedUrl), mediaType: file.mime_type },
              ],
            },
          ],
          INSTRUCTIONS,
        );
        const caption = cleanCaption(await call.result.text);
        if (!caption) {
          failed.push({ id: file.id, file_name: file.file_name, reason: "The AI didn't return a caption for this photo." });
          continue;
        }
        const { error: saveError } = await supabase
          .from("event_files")
          .update({ caption, caption_generated_at: new Date().toISOString() })
          .eq("id", file.id);
        if (saveError) failed.push({ id: file.id, file_name: file.file_name, reason: "The caption couldn't be saved." });
        else processed++;
      } catch (err) {
        const info = describeError(err);
        // Credits, workspace limits/permissions and rate limits apply to every photo: stop the whole run.
        if (info.status === 402 || info.status === 403 || info.status === 429 || info.status === 401) {
          stopped = info;
          queue.unshift(file);
          break;
        }
        console.error("caption failed", file.id, info.status, info.message);
        failed.push({
          id: file.id,
          file_name: file.file_name,
          reason: info.status && info.status >= 500 ? "The AI service had a hiccup — try again later." : "This photo couldn't be captioned.",
        });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (stopped) {
    const s = stopped as GatewayFailure;
    const message =
      s.status === 402
        ? `Out of AI credits. ${s.message}`
        : s.status === 429
          ? "The AI is busy right now. Please wait a minute and try again."
          : s.status === 401
            ? "AI captions aren't set up correctly."
            : s.message;
    return json({ processed, failed, remaining: Math.max(todo.length - processed - failed.length, 0), stopped: { status: s.status, message } });
  }

  return json({ processed, failed, remaining: Math.max(todo.length - processed - failed.length, 0) });
});
