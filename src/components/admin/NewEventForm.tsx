import { useRef, useState } from "react";
import { z } from "zod";
import { FolderUp, ImagePlus, Lock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ACCEPTED_TYPES, EVENT_BUCKET, MAX_FILE_BYTES, formatBytes, generateAccessKey, isImage } from "@/lib/events";

const schema = z.object({
  title: z.string().trim().min(1, "Give the event a title").max(200, "Title must be under 200 characters"),
  description: z.string().trim().max(2000, "Description must be under 2000 characters"),
  event_date: z.string(),
});

interface NewEventFormProps {
  onCreated: (result: { title: string; accessKey: string | null }) => void;
}

const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);

const NewEventForm = ({ onCreated }: NewEventFormProps) => {
  const folderInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const all = Array.from(list);
    const ok = all.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_BYTES);
    setSkipped((s) => s + (all.length - ok.length));
    const folder = all[0]?.webkitRelativePath?.split("/")[0];
    if (folder && !title) setTitle(folder);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...ok.filter((f) => !seen.has(`${f.name}-${f.size}`))].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
    });
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setIsPrivate(false);
    setFiles([]);
    setSkipped(0);
    setProgress(null);
    if (folderInput.current) folderInput.current.value = "";
    if (filesInput.current) filesInput.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = schema.safeParse({ title, description, event_date: eventDate });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (files.length === 0) {
      setError("Choose a folder or some files to upload.");
      return;
    }

    setProgress(0);
    const { data: event, error: evErr } = await supabase
      .from("events")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || null,
        event_date: parsed.data.event_date || null,
        is_private: isPrivate,
      })
      .select()
      .single();
    if (evErr || !event) {
      setProgress(null);
      setError("Couldn't create the event. Please try again.");
      return;
    }

    const rows: { event_id: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number; sort_order: number }[] = [];
    let done = 0;
    let failed = 0;
    const queue = files.map((file, index) => ({ file, index }));
    const worker = async () => {
      while (queue.length) {
        const { file, index } = queue.shift()!;
        const path = `${event.id}/${crypto.randomUUID()}-${sanitize(file.name)}`;
        const { error: upErr } = await supabase.storage.from(EVENT_BUCKET).upload(path, file, { contentType: file.type });
        if (upErr) failed++;
        else
          rows.push({ event_id: event.id, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size, sort_order: index });
        done++;
        setProgress(Math.round((done / files.length) * 100));
      }
    };
    await Promise.all([worker(), worker(), worker()]);

    rows.sort((a, b) => a.sort_order - b.sort_order);
    if (rows.length) await supabase.from("event_files").insert(rows);
    const cover = rows.find((r) => isImage(r.mime_type));
    if (cover) await supabase.from("events").update({ cover_path: cover.storage_path }).eq("id", event.id);

    let accessKey: string | null = null;
    if (isPrivate) {
      accessKey = generateAccessKey();
      const { error: keyErr } = await supabase.from("event_access_keys").insert({ event_id: event.id, access_key: accessKey });
      if (keyErr) {
        accessKey = null;
        toast.error("The event was saved but its key couldn't be created. Use \"New key\" in the list.");
      }
    }

    if (failed) toast.error(`${failed} file${failed > 1 ? "s" : ""} couldn't be uploaded.`);
    onCreated({ title: parsed.data.title, accessKey });
    reset();
  };

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const uploading = progress !== null;

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl bg-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold">New event</h2>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="event-title">Title</Label>
          <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="h-11 rounded-xl bg-background" placeholder="e.g. Botanical Essence launch" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-date">Date</Label>
          <Input id="event-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-11 rounded-xl bg-background" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-description">Description (optional)</Label>
        <Textarea id="event-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} className="resize-none rounded-xl bg-background" />
      </div>

      <div className="space-y-3">
        <Label>Photos & documents</Label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="rounded-full" onClick={() => folderInput.current?.click()} disabled={uploading}>
            <FolderUp size={16} /> Choose folder
          </Button>
          <Button type="button" variant="secondary" className="rounded-full" onClick={() => filesInput.current?.click()} disabled={uploading}>
            <ImagePlus size={16} /> Choose files
          </Button>
          <input
            ref={folderInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          />
          <input ref={filesInput} type="file" multiple accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>
        {files.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm">
            <span>
              {files.length} file{files.length > 1 ? "s" : ""} · {formatBytes(totalSize)}
            </span>
            {!uploading && (
              <button type="button" onClick={() => { setFiles([]); setSkipped(0); }} className="text-muted-foreground hover:text-foreground" aria-label="Clear files">
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {skipped > 0 && (
          <p className="text-xs text-muted-foreground">
            {skipped} file{skipped > 1 ? "s were" : " was"} skipped (only photos and PDFs up to 50 MB are allowed).
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-background p-4">
        <Checkbox checked={isPrivate} onCheckedChange={(v) => setIsPrivate(v === true)} className="mt-0.5" disabled={uploading} />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Lock size={14} /> Make this event private
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            It won't be listed publicly. A key is generated that you can send to your client so they can view and download everything.
          </span>
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">Uploading… {progress}% — keep this page open.</p>
        </div>
      )}

      <Button type="submit" className="h-12 rounded-full px-8" disabled={uploading}>
        {uploading ? "Uploading…" : "Upload & create event"}
      </Button>
    </form>
  );
};

export default NewEventForm;
