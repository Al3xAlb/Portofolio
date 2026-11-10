import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingNav from "@/components/FloatingNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { EventRow, formatEventDate, normalizeAccessKey, signPaths } from "@/lib/events";

export const PRIVATE_KEY_STORAGE = "private-event-key";

type EventWithCount = EventRow & { event_files: { count: number }[] };

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("*, event_files(count)")
        .eq("is_private", false)
        .order("event_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as EventWithCount[];
      setEvents(rows);
      setCovers(await signPaths(rows.map((e) => e.cover_path).filter(Boolean) as string[]));
      setLoading(false);
    })();
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeAccessKey(key);
    if (normalized.replace(/-/g, "").length < 8) {
      setKeyError("Please enter the full key you received.");
      return;
    }
    sessionStorage.setItem(PRIVATE_KEY_STORAGE, normalized);
    navigate("/events/private");
  };

  return (
    <>
      <main className="min-h-screen bg-background page-transition">
        <Navbar />
        <section className="px-6 pt-28 pb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Events</p>
          <h1 className="mt-3 max-w-3xl text-4xl md:text-6xl font-semibold tracking-tight">
            Galleries from shoots, launches and commissions.
          </h1>
        </section>

        {/* Private access */}
        <section className="px-6 pb-16">
          <div className="grid gap-6 rounded-3xl bg-card p-6 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">Private client gallery</h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Got a key from me? Enter it to view and download your photos and files.
                </p>
              </div>
            </div>
            <form onSubmit={handleUnlock} className="flex w-full flex-col gap-2 md:w-[26rem]">
              <div className="flex gap-2">
                <Input
                  aria-label="Access key"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setKeyError("");
                  }}
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength={40}
                  className="h-12 rounded-full bg-background px-5 font-mono uppercase tracking-widest"
                />
                <Button type="submit" className="h-12 rounded-full px-6">
                  <KeyRound size={16} />
                  Unlock
                </Button>
              </div>
              {keyError && <p className="px-2 text-xs text-destructive">{keyError}</p>}
            </form>
          </div>
        </section>

        {/* Public events */}
        <section className="px-6 pb-32">
          <h2 className="mb-6 text-xs uppercase tracking-widest text-muted-foreground">Public events</h2>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-muted" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No public events yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="project-card group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
                    {event.cover_path && covers[event.cover_path] && (
                      <img src={covers[event.cover_path]} alt={event.title} loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="pt-3">
                    <h3 className="text-base font-medium group-hover:opacity-70 transition-opacity">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {[formatEventDate(event.event_date), `${event.event_files?.[0]?.count ?? 0} files`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <FloatingNav />
    </>
  );
};

export default Events;
