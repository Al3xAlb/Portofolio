import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Lock, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingNav from "@/components/FloatingNav";
import GalleryGrid from "@/components/GalleryGrid";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { EventRow, GalleryFile, buildZip, downloadBlob, formatEventDate, safeFileName } from "@/lib/events";
import { PRIVATE_KEY_STORAGE } from "./Events";

const PrivateEvent = () => {
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const key = sessionStorage.getItem(PRIVATE_KEY_STORAGE);
    if (!key) {
      navigate("/events", { replace: true });
      return;
    }
    (async () => {
      const { data, error: fnError } = await supabase.functions.invoke("unlock-event", { body: { key } });
      if (fnError || !data?.event) {
        let message = "That key wasn't recognised.";
        try {
          const body = await (fnError as { context?: Response })?.context?.json();
          if (body?.error) message = body.error;
        } catch {
          /* keep default */
        }
        setError(message);
        sessionStorage.removeItem(PRIVATE_KEY_STORAGE);
      } else {
        setEvent(data.event);
        setFiles(data.files ?? []);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const zipName = event ? `${safeFileName(event.title)}.zip` : "event.zip";

  const prepareZip = async () => {
    setZipProgress(0);
    try {
      const blob = await buildZip(files, (done, total) => setZipProgress(Math.round((done / total) * 100)));
      setZipBlob(blob);
      // Try to save straight away; the "Save ZIP" button stays as a fallback for browsers that block it.
      downloadBlob(blob, zipName);
    } catch {
      setError("Couldn't prepare the ZIP. Please try again or download files one by one.");
    } finally {
      setZipProgress(null);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(PRIVATE_KEY_STORAGE);
    navigate("/events");
  };

  return (
    <>
      <main className="min-h-screen bg-background page-transition">
        <Navbar />
        <section className="px-6 pt-28 pb-10">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> All events
          </Link>

          {loading && <div className="mt-8 h-14 w-2/3 animate-pulse rounded-2xl bg-muted" />}

          {!loading && error && !event && (
            <div className="mt-10 max-w-md rounded-3xl bg-card p-8">
              <Lock className="text-primary" size={22} />
              <p className="mt-4 text-lg font-medium">{error}</p>
              <p className="mt-1 text-sm text-muted-foreground">Check the key and try again.</p>
              <Button asChild className="mt-6 rounded-full">
                <Link to="/events">Try another key</Link>
              </Button>
            </div>
          )}

          {event && (
            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <Lock size={12} /> Private gallery
                </p>
                <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight">{event.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {[formatEventDate(event.event_date), `${files.length} files`].filter(Boolean).join(" · ")}
                </p>
                {event.description && <p className="mt-6 max-w-2xl text-muted-foreground">{event.description}</p>}
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="flex gap-2">
                  {zipBlob ? (
                    <Button className="h-12 rounded-full px-6" onClick={() => downloadBlob(zipBlob, zipName)}>
                      <Download size={16} /> Save ZIP
                    </Button>
                  ) : (
                    <Button
                      className="h-12 rounded-full px-6"
                      onClick={prepareZip}
                      disabled={zipProgress !== null || files.length === 0}
                    >
                      <Download size={16} />
                      {zipProgress !== null ? `Preparing… ${zipProgress}%` : "Download all"}
                    </Button>
                  )}
                  <Button variant="ghost" className="h-12 rounded-full" onClick={lock}>
                    <LogOut size={16} /> Lock
                  </Button>
                </div>
                {zipProgress !== null && <Progress value={zipProgress} className="h-1 w-56" />}
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>
          )}
        </section>
        {event && (
          <section className="px-6 pb-32">
            <GalleryGrid files={files} allowDownload />
          </section>
        )}
      </main>
      <FloatingNav />
    </>
  );
};

export default PrivateEvent;
