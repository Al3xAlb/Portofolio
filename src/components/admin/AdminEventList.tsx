import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Lock, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AccessKeyDisplay from "./AccessKeyDisplay";
import CaptionsDialog from "./CaptionsDialog";
import { EVENT_BUCKET, EventRow, formatEventDate, generateAccessKey, signPaths } from "@/lib/events";

type AdminEvent = EventRow & {
  event_files: { count: number }[];
  event_access_keys: { access_key: string } | null;
};

const AdminEventList = ({ refreshToken }: { refreshToken: number }) => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [captionEvent, setCaptionEvent] = useState<AdminEvent | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, event_files(count), event_access_keys(access_key)")
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as AdminEvent[];
    setEvents(rows);
    setCovers(await signPaths(rows.map((r) => r.cover_path).filter(Boolean) as string[]));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [refreshToken]);

  const setKey = async (eventId: string) => {
    const key = generateAccessKey();
    const { error } = await supabase.from("event_access_keys").upsert({ event_id: eventId, access_key: key });
    if (error) toast.error("Couldn't create a new key.");
    else toast.success("New key created. The old key no longer works.");
    load();
  };

  const togglePrivacy = async (ev: AdminEvent) => {
    const makePrivate = !ev.is_private;
    const { error } = await supabase.from("events").update({ is_private: makePrivate }).eq("id", ev.id);
    if (error) {
      toast.error("Couldn't change who can see this event.");
      return;
    }
    if (makePrivate && !ev.event_access_keys) await setKey(ev.id);
    else if (!makePrivate) await supabase.from("event_access_keys").delete().eq("event_id", ev.id);
    toast.success(makePrivate ? "Event is now private." : "Event is now public.");
    load();
  };

  const remove = async (ev: AdminEvent) => {
    const { data: files } = await supabase.from("event_files").select("storage_path").eq("event_id", ev.id);
    const paths = (files ?? []).map((f) => f.storage_path);
    for (let i = 0; i < paths.length; i += 100) {
      await supabase.storage.from(EVENT_BUCKET).remove(paths.slice(i, i + 100));
    }
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) toast.error("Couldn't delete the event.");
    else toast.success("Event deleted.");
    load();
  };

  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-muted" />;

  if (events.length === 0)
    return (
      <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No events yet. Upload your first folder above.
      </p>
    );

  return (
    <>
    <CaptionsDialog
      eventId={captionEvent?.id ?? null}
      eventTitle={captionEvent?.title ?? ""}
      onOpenChange={(open) => !open && setCaptionEvent(null)}
    />
    <ul className="space-y-3">
      {events.map((ev) => (
        <li key={ev.id} className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:flex-row md:items-center">
          <div className="h-20 w-full shrink-0 overflow-hidden rounded-2xl bg-muted md:w-28">
            {ev.cover_path && covers[ev.cover_path] && <img src={covers[ev.cover_path]} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{ev.title}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {ev.is_private ? <Lock size={11} /> : <Globe size={11} />}
                {ev.is_private ? "Private" : "Public"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[formatEventDate(ev.event_date), `${ev.event_files?.[0]?.count ?? 0} files`].filter(Boolean).join(" · ")}
            </p>
            {ev.is_private && ev.event_access_keys && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Key:</span>
                <AccessKeyDisplay accessKey={ev.event_access_keys.access_key} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setCaptionEvent(ev)}>
              <Sparkles size={14} /> Captions
            </Button>
            {!ev.is_private && (
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to={`/events/${ev.id}`}>View</Link>
              </Button>
            )}
            {ev.is_private && (
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setKey(ev.id)}>
                <RefreshCw size={14} /> New key
              </Button>
            )}
            <Button variant="secondary" size="sm" className="rounded-full" onClick={() => togglePrivacy(ev)}>
              {ev.is_private ? <Globe size={14} /> : <Lock size={14} />}
              {ev.is_private ? "Make public" : "Make private"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" aria-label={`Delete ${ev.title}`}>
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{ev.title}"?</AlertDialogTitle>
                  <AlertDialogDescription>All its photos and documents will be removed for good. This can't be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove(ev)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </li>
      ))}
    </ul>
    </>
  );
};

export default AdminEventList;
