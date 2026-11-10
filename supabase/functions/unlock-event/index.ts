import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  key: z.string().trim().min(8).max(64),
});

const URL_TTL_SECONDS = 60 * 60 * 2; // 2 hours

// Keys are stored as XXXX-XXXX-XXXX; accept any casing/spacing/dashes from visitors.
function normalizeKey(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.match(/.{1,4}/g)?.join("-") ?? clean;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return json({ error: "That key doesn't look right." }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const key = normalizeKey(parsed.data.key);
  const { data: keyRow, error: keyError } = await supabase
    .from("event_access_keys")
    .select("event_id")
    .eq("access_key", key)
    .maybeSingle();

  if (keyError) return json({ error: "Something went wrong. Please try again." }, 500);
  if (!keyRow) return json({ error: "That key wasn't recognised." }, 404);

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, description, event_date, is_private, cover_path, created_at")
    .eq("id", keyRow.event_id)
    .maybeSingle();
  if (eventError || !event) return json({ error: "That key wasn't recognised." }, 404);

  const { data: files, error: filesError } = await supabase
    .from("event_files")
    .select("id, storage_path, file_name, mime_type, size_bytes, sort_order")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true });
  if (filesError) return json({ error: "Something went wrong. Please try again." }, 500);

  const bucket = supabase.storage.from("event-files");
  const withUrls = await Promise.all(
    (files ?? []).map(async (f) => {
      const [view, download] = await Promise.all([
        bucket.createSignedUrl(f.storage_path, URL_TTL_SECONDS),
        bucket.createSignedUrl(f.storage_path, URL_TTL_SECONDS, { download: f.file_name }),
      ]);
      return {
        id: f.id,
        file_name: f.file_name,
        mime_type: f.mime_type,
        size_bytes: f.size_bytes,
        url: view.data?.signedUrl ?? null,
        download_url: download.data?.signedUrl ?? null,
      };
    }),
  );

  return json({ event, files: withUrls });
});
