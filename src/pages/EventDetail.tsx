import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingNav from "@/components/FloatingNav";
import GalleryGrid from "@/components/GalleryGrid";
import { supabase } from "@/integrations/supabase/client";
import { EventRow, GalleryFile, formatEventDate, signPaths } from "@/lib/events";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    (async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).eq("is_private", false).maybeSingle();
      if (!ev) {
        setState("missing");
        return;
      }
      const { data: rows } = await supabase
        .from("event_files")
        .select("id, storage_path, file_name, mime_type, size_bytes, caption")
        .eq("event_id", id)
        .order("sort_order");
      const urls = await signPaths((rows ?? []).map((r) => r.storage_path));
      setEvent(ev as EventRow);
      setFiles(
        (rows ?? []).map((r) => ({
          id: r.id,
          file_name: r.file_name,
          mime_type: r.mime_type,
          size_bytes: r.size_bytes,
          caption: r.caption,
          url: urls[r.storage_path] ?? null,
        })),
      );
      setState("ready");
    })();
  }, [id]);

  return (
    <>
      <main className="min-h-screen bg-background page-transition">
        <Navbar />
        <section className="px-6 pt-28 pb-10">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> All events
          </Link>
          {state === "missing" && (
            <p className="mt-10 text-lg text-muted-foreground">This event isn't available.</p>
          )}
          {event && (
            <>
              <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight">{event.title}</h1>
              {event.event_date && <p className="mt-2 text-sm text-muted-foreground">{formatEventDate(event.event_date)}</p>}
              {event.description && <p className="mt-6 max-w-2xl text-muted-foreground">{event.description}</p>}
            </>
          )}
        </section>
        <section className="px-6 pb-32">
          {state === "loading" ? (
            <div className="columns-2 lg:columns-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mb-4 h-64 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <GalleryGrid files={files} />
          )}
        </section>
      </main>
      <FloatingNav />
    </>
  );
};

export default EventDetail;
