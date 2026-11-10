import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

export const EVENT_BUCKET = "event-files";

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  is_private: boolean;
  cover_path: string | null;
  created_at: string;
}

export interface GalleryFile {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  caption?: string | null;
  url: string | null;
  download_url?: string | null;
}

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf"];
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const isImage = (mime: string) => mime.startsWith("image/");

// Unambiguous characters only (no 0/O, 1/I/L) so keys are easy to read out and type.
const KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateAccessKey(): string {
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => KEY_ALPHABET[b % KEY_ALPHABET.length]).join("");
  return chars.match(/.{4}/g)!.join("-");
}

export function normalizeAccessKey(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.match(/.{1,4}/g)?.join("-") ?? clean;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatEventDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Signed view URLs for files the current visitor is allowed to read (public events, or admin). */
export async function signPaths(paths: string[], ttlSeconds = 60 * 60): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(EVENT_BUCKET).createSignedUrls(paths, ttlSeconds);
  const map: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function buildZip(
  files: GalleryFile[],
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  const used = new Set<string>();
  let done = 0;
  for (const f of files) {
    if (!f.url) continue;
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`Could not fetch ${f.file_name}`);
    let name = f.file_name;
    let n = 1;
    while (used.has(name)) {
      const dot = f.file_name.lastIndexOf(".");
      name = dot > 0 ? `${f.file_name.slice(0, dot)} (${n})${f.file_name.slice(dot)}` : `${f.file_name} (${n})`;
      n++;
    }
    used.add(name);
    zip.file(name, await res.blob());
    done++;
    onProgress?.(done, files.length);
  }
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

export const safeFileName = (title: string) =>
  title.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "event";
