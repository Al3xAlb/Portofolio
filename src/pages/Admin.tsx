import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import EmailPasswordForm from "@/components/admin/EmailPasswordForm";
import NewEventForm from "@/components/admin/NewEventForm";
import AdminEventList from "@/components/admin/AdminEventList";
import AccessKeyDisplay from "@/components/admin/AccessKeyDisplay";
import AdminPortfolioPhotos from "@/components/admin/AdminPortfolioPhotos";

const Admin = () => {
  const { user, isAdmin, loading } = useAdminAuth();
  const [refreshToken, setRefreshToken] = useState(0);
  const [created, setCreated] = useState<{ title: string; accessKey: string | null } | null>(null);

  const signOut = () => supabase.auth.signOut();

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 pt-28 pb-24">
        {loading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        ) : !user ? (
          <div className="mx-auto max-w-md rounded-3xl bg-card p-10 text-center">
            <h1 className="text-3xl font-semibold">Admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to upload and manage your events.</p>
            <div className="mt-8 flex justify-center">
              <EmailPasswordForm />
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="mx-auto max-w-md rounded-3xl bg-card p-10 text-center">
            <h1 className="text-2xl font-semibold">No access</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {user.email} isn't allowed to manage this site.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="secondary" className="rounded-full" onClick={signOut}>
                Sign out
              </Button>
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/">Back to site</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Admin</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your events</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
                <Button variant="ghost" className="rounded-full" onClick={signOut}>
                  <LogOut size={16} /> Sign out
                </Button>
              </div>
            </div>

            <NewEventForm
              onCreated={(result) => {
                setCreated(result);
                setRefreshToken((t) => t + 1);
              }}
            />

            <AdminPortfolioPhotos />

            <h2 className="mt-14 mb-4 text-xs uppercase tracking-widest text-muted-foreground">All events</h2>
            <AdminEventList refreshToken={refreshToken} />
          </>
        )}
      </div>

      <Dialog open={!!created} onOpenChange={(v) => !v && setCreated(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>"{created?.title}" is live</DialogTitle>
            <DialogDescription>
              {created?.accessKey
                ? "This event is private. Send this key to your client — they enter it on the Events page to view and download everything."
                : "This event is public and now shows on your Events page."}
            </DialogDescription>
          </DialogHeader>
          {created?.accessKey && (
            <div className="flex flex-col items-center gap-2 py-4">
              <AccessKeyDisplay accessKey={created.accessKey} large />
              <p className="text-xs text-muted-foreground">Click to copy. You can always find it again in the list below.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Admin;
