import { supabase } from "@/integrations/supabase/client";

export interface CaptionProgress {
  done: number;
  failed: number;
  total: number;
}

export interface CaptionRunResult extends CaptionProgress {
  failures: { id: string; file_name: string; reason: string }[];
  stoppedMessage?: string;
}

async function readFunctionError(error: unknown): Promise<string> {
  try {
    const body = await (error as { context?: Response })?.context?.json();
    if (body?.error) return body.error;
  } catch {
    /* ignore */
  }
  return "Couldn't reach the caption writer. Please try again.";
}

/**
 * Asks Lovable AI to caption an event's photos, a few at a time, until none are left.
 * mode "missing" only fills empty captions; "all" rewrites every photo.
 */
export async function generateCaptions(
  eventId: string,
  mode: "missing" | "all",
  onProgress?: (p: CaptionProgress) => void,
): Promise<CaptionRunResult> {
  const since = new Date().toISOString();
  const failures: CaptionRunResult["failures"] = [];
  let done = 0;
  let total = 0;

  for (let round = 0; round < 500; round++) {
    const { data, error } = await supabase.functions.invoke("generate-captions", {
      body: { event_id: eventId, mode, since, skip_ids: failures.map((f) => f.id) },
    });
    if (error) {
      return { done, failed: failures.length, total, failures, stoppedMessage: await readFunctionError(error) };
    }
    done += data.processed ?? 0;
    failures.push(...(data.failed ?? []));
    total = done + failures.length + (data.remaining ?? 0);
    onProgress?.({ done, failed: failures.length, total });

    if (data.stopped) {
      return { done, failed: failures.length, total, failures, stoppedMessage: data.stopped.message };
    }
    if (!data.remaining || ((data.processed ?? 0) === 0 && (data.failed ?? []).length === 0)) break;
  }
  return { done, failed: failures.length, total, failures };
}
