import { supabase } from "@/integrations/supabase/client";
import { projects, type Project } from "@/data/projects";

export const PORTFOLIO_BUCKET = "portfolio-photos";

export interface PortfolioPhoto {
  id: string;
  url: string;
  sourceUrl: string | null;
  storagePath: string | null;
}

export interface PortfolioProject extends Project {
  photos: PortfolioPhoto[];
}

type PortfolioPhotoRow = {
  id: string;
  project_id: string;
  source_url: string | null;
  storage_path: string | null;
  is_hidden: boolean;
  created_at: string;
};

export function getStaticPortfolioProjects(): PortfolioProject[] {
  return projects.map((project) => ({
    ...project,
    photos: project.images.map((url, index) => ({
      id: `static-${index}`,
      url,
      sourceUrl: url,
      storagePath: null,
    })),
  }));
}

export async function loadPortfolioProjects(): Promise<PortfolioProject[]> {
  const { data, error } = await supabase
    .from("portfolio_photos")
    .select("id, project_id, source_url, storage_path, is_hidden, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as PortfolioPhotoRow[];
  return getStaticPortfolioProjects().map((project) => {
    const projectRows = rows.filter((row) => row.project_id === project.id);
    const hiddenUrls = new Set(
      projectRows
        .filter((row) => row.is_hidden && row.source_url)
        .map((row) => row.source_url as string),
    );
    const originalPhotos = project.photos.filter((photo) => !hiddenUrls.has(photo.url));
    const addedPhotos = projectRows
      .filter((row) => !row.is_hidden && row.storage_path)
      .map((row) => ({
        id: row.id,
        url: supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(row.storage_path!).data.publicUrl,
        sourceUrl: null,
        storagePath: row.storage_path,
      }));
    const photos = [...originalPhotos, ...addedPhotos];

    return { ...project, photos, images: photos.map((photo) => photo.url) };
  });
}
