import { useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GalleryFile, formatBytes, isImage } from "@/lib/events";

interface GalleryGridProps {
  files: GalleryFile[];
  allowDownload?: boolean;
}

const DownloadLink = ({ file, compact = false }: { file: GalleryFile; compact?: boolean }) =>
  file.download_url ? (
    <a
      href={file.download_url}
      download={file.file_name}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Download ${file.file_name}`}
      className={
        compact
          ? "inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
          : "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      }
    >
      <Download size={16} />
      {!compact && "Download"}
    </a>
  ) : null;

const GalleryGrid = ({ files, allowDownload = false }: GalleryGridProps) => {
  const [open, setOpen] = useState<GalleryFile | null>(null);
  const images = files.filter((f) => isImage(f.mime_type));
  const documents = files.filter((f) => !isImage(f.mime_type));

  return (
    <>
      {images.length > 0 && (
        <div className="columns-2 lg:columns-3 gap-4">
          {images.map((file) => (
            <figure key={file.id} className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-muted">
              <button type="button" onClick={() => setOpen(file)} className="block w-full" aria-label={`Open ${file.file_name}`}>
                {file.url && (
                  <img
                    src={file.url}
                    alt={file.file_name}
                    loading="lazy"
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                )}
              </button>
              {allowDownload && (
                <div className="absolute right-3 top-3 opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100">
                  <DownloadLink file={file} compact />
                </div>
              )}
            </figure>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Documents</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {documents.map((file) => (
              <li key={file.id} className="flex items-center gap-4 rounded-2xl bg-card p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                  <FileText size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size_bytes)}</p>
                </div>
                {file.url && !allowDownload && (
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    View
                  </a>
                )}
                {allowDownload && (
                  <div className="flex items-center gap-2">
                    {file.url && (
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                        View
                      </a>
                    )}
                    <DownloadLink file={file} compact />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-5xl border-none bg-background p-2 sm:rounded-2xl [&>button]:hidden">
          <DialogTitle className="sr-only">{open?.file_name}</DialogTitle>
          {open?.url && <img src={open.url} alt={open.file_name} className="max-h-[80vh] w-full rounded-xl object-contain" />}
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <p className="truncate text-sm text-muted-foreground">{open?.file_name}</p>
            <div className="flex items-center gap-2">
              {allowDownload && open && <DownloadLink file={open} />}
              <Button variant="ghost" size="icon" onClick={() => setOpen(null)} aria-label="Close">
                <X size={18} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GalleryGrid;
