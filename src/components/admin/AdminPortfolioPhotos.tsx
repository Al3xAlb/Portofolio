import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioProjects } from "@/hooks/usePortfolioProjects";
import { PORTFOLIO_BUCKET, type PortfolioPhoto } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);

const AdminPortfolioPhotos = () => {
  const { projects, loading, refresh } = usePortfolioProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const filesInput = useRef<HTMLInputElement>(null);
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || !selectedProject) return;
    const candidates = Array.from(files);
    const validFiles = candidates.filter(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES,
    );
    if (validFiles.length !== candidates.length) {
      toast.error("Only JPEG, PNG, WebP, GIF, or AVIF images up to 50 MB can be uploaded.");
    }
    if (validFiles.length === 0) return;

    setBusy(true);
    let uploaded = 0;
    let failed = 0;
    try {
      for (const file of validFiles) {
        const path = `${selectedProject.id}/${crypto.randomUUID()}-${sanitize(file.name)}`;
        try {
          const { error: uploadError } = await supabase.storage
            .from(PORTFOLIO_BUCKET)
            .upload(path, file, { contentType: file.type });
          if (uploadError) throw uploadError;

          const { error: rowError } = await supabase.from("portfolio_photos").insert({
            project_id: selectedProject.id,
            storage_path: path,
            is_hidden: false,
          });
          if (rowError) {
            const { error: cleanupError } = await supabase.storage.from(PORTFOLIO_BUCKET).remove([path]);
            if (cleanupError) console.error("Could not clean up an unlisted portfolio photo.", cleanupError);
            throw rowError;
          }
          uploaded++;
        } catch (error) {
          console.error("Could not upload portfolio photo.", error);
          failed++;
        }
      }

      if (uploaded > 0) {
        await refresh();
        toast.success(`${uploaded} photo${uploaded === 1 ? "" : "s"} added to the portfolio.`);
      }
      if (failed > 0) toast.error(`${failed} photo${failed === 1 ? "" : "s"} couldn't be uploaded.`);
    } finally {
      setBusy(false);
      if (filesInput.current) filesInput.current.value = "";
    }
  };

  const deletePhoto = async (photo: PortfolioPhoto) => {
    if (!selectedProject) return;
    setBusy(true);
    try {
      if (photo.sourceUrl) {
        const { error } = await supabase.from("portfolio_photos").insert({
          project_id: selectedProject.id,
          source_url: photo.sourceUrl,
          is_hidden: true,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("portfolio_photos").delete().eq("id", photo.id);
        if (error) throw error;

        if (photo.storagePath) {
          const { error: storageError } = await supabase.storage
            .from(PORTFOLIO_BUCKET)
            .remove([photo.storagePath]);
          if (storageError) {
            console.error("Could not delete the portfolio photo from storage.", storageError);
            toast.error("The photo was removed from the portfolio, but its stored file couldn't be deleted.");
          }
        }
      }

      await refresh();
      toast.success("Photo removed from the portfolio.");
    } catch (error) {
      console.error("Could not remove portfolio photo.", error);
      toast.error("Couldn't remove this photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-14 rounded-3xl bg-card p-6 md:p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Main portfolio</p>
        <h2 className="mt-2 text-2xl font-semibold">Manage portfolio photos</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add or remove photos for each project shown in the main portfolio.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="portfolio-project" className="text-sm font-medium">Project</label>
        <select
          id="portfolio-project"
          value={selectedProject?.id ?? ""}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          disabled={busy}
          className="h-11 min-w-56 rounded-xl border border-input bg-background px-3 text-sm"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>
        <input
          ref={filesInput}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(event) => void uploadPhotos(event.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          disabled={busy || !selectedProject}
          onClick={() => filesInput.current?.click()}
        >
          <ImagePlus size={16} /> Add photos
        </Button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      ) : selectedProject?.photos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {selectedProject.photos.map((photo) => (
            <li key={photo.id} className="group relative overflow-hidden rounded-2xl bg-muted">
              <img src={photo.url} alt={selectedProject.title} className="aspect-[4/5] h-full w-full object-cover" loading="lazy" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    disabled={busy}
                    className="absolute right-2 top-2 rounded-full opacity-100 shadow md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                    aria-label={`Remove photo from ${selectedProject.title}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      It will no longer appear in this project in the main portfolio.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void deletePhoto(photo)}>Remove photo</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No photos in this project yet. Add photos to show them in the main portfolio.
        </p>
      )}
    </section>
  );
};

export default AdminPortfolioPhotos;
