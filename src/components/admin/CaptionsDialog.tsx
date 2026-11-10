import { useEffect, useState } from "react";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { signPaths } from "@/lib/events";
import { CaptionProgress, generateCaptions } from "@/lib/captions";

interface PhotoRow {
  id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
}

interface CaptionsDialogProps {
  eventId: string | null;
  eventTitle: string;
  onOpenChange: (open: boolean) => void;
}

const CaptionsDialog = ({ eventId, eventTitle, onOpenChange }: CaptionsDialogProps) => {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<CaptionProgress | null>(null);
  const [message, setMessage] = useState("");

  const load = async (id: string) => {
    const { data } = await supabase
      .from("event_files")
      .select("id, storage_path, file_name, caption")
      .eq("event_id", id)
      .like("mime_type", "image/%")
      .order("sort_order");
    const rows = (data ?? []) as PhotoRow[];
    setPhotos(rows);
    setDrafts(Object.fromEntries(rows.map((r) => [r.id, r.caption ?? ""])));
    setThumbs(await signPaths(rows.map((r) => r.storage_path)));
    setLoading(false);
  };

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setMessage("");
    setProgress(null);
    load(eventId);
  }, [eventId]);

  const run = async (mode: "missing" | "all") => {
    if (!eventId) return;
    setMessage("");
    setProgress({ done: 0, failed: 0, total: mode === "all" ? photos.length : photos.filter((p) => !p.caption).length });
    const result = await generateCaptions(eventId, mode, setProgress);
    setProgress(null);
    await load(eventId);
    if (result.stoppedMessage) setMessage(result.stoppedMessage);
    else if (result.failed) setMessage(`${result.failed} photo${result.failed > 1 ? "s" : ""} couldn't be captioned: ${result.failures[0].reason}`);
    if (result.done) toast.success(`Wrote ${result.done} caption${result.done > 1 ? "s" : ""}.`);
    else if (!result.stoppedMessage && !result.failed) toast("Every photo already has a caption.");
  };

  const save = async (photo: PhotoRow) => {
    const value = (drafts[photo.id] ?? "").trim().slice(0, 300);
    if (value === (photo.caption ?? "")) return;
    const { error } = await supabase
      .from("event_files")
      .update({ caption: value || null })
      .eq("id", photo.id);
    if (error) {
      toast.error("Couldn't save that caption.");
      return;
    }
    setPhotos((list) => list.map((p) => (p.id === photo.id ? { ...p, caption: value || null } : p)));
    setSavedId(photo.id);
    setTimeout(() => setSavedId((s) => (s === photo.id ? null : s)), 1500);
  };

  const missing = photos.filter((p) => !p.caption).length;
  const running = progress !== null;

  return (
    <Dialog open={!!eventId} onOpenChange={(v) => !running && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden rounded-3xl p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="space-y-2 border-b border-border p-6">
            <DialogTitle>Photo captions · {eventTitle}</DialogTitle>
            <DialogDescription>
              Short descriptions help people using screen readers and show under each photo when it's opened. Lovable AI can write them for you — review and edit anything.
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button className="rounded-full" onClick={() => run("missing")} disabled={running || loading || missing === 0}>
                <Sparkles size={16} />
                {missing ? `Write ${missing} missing caption${missing > 1 ? "s" : ""}` : "All photos captioned"}
              </Button>
              <Button variant="secondary" className="rounded-full" onClick={() => run("all")} disabled={running || loading || photos.length === 0}>
                <RefreshCw size={16} /> Rewrite all
              </Button>
            </div>
            {running && (
              <div className="space-y-1 pt-2">
                <Progress value={progress.total ? ((progress.done + progress.failed) / progress.total) * 100 : 5} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  Writing captions… {progress.done} of {progress.total || "?"} done. Keep this open.
                </p>
              </div>
            )}
            {message && <p className="pt-1 text-sm text-destructive">{message}</p>}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">This event has no photos.</p>
            ) : (
              <ul className="space-y-3">
                {photos.map((photo) => (
                  <li key={photo.id} className="flex gap-4 rounded-2xl bg-muted/50 p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {thumbs[photo.storage_path] && (
                        <img src={thumbs[photo.storage_path]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">{photo.file_name}</p>
                        {savedId === photo.id && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary">
                            <Check size={12} /> Saved
                          </span>
                        )}
                      </div>
                      <Textarea
                        aria-label={`Caption for ${photo.file_name}`}
                        value={drafts[photo.id] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [photo.id]: e.target.value }))}
                        onBlur={() => save(photo)}
                        maxLength={300}
                        rows={2}
                        disabled={running}
                        placeholder="No caption yet"
                        className="resize-none rounded-xl bg-background text-sm"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaptionsDialog;
