import path from "node:path";
import fs from "node:fs";

/** Diretório absoluto onde os vídeos enviados são guardados. */
export function getStorageDir(): string {
  const rel = process.env.VIDEO_STORAGE_DIR || "storage/videos";
  const dir = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Caminho absoluto de um arquivo de vídeo a partir do nome salvo no banco. */
export function getVideoPath(filename: string): string {
  // Bloqueia path traversal — só aceita o nome base do arquivo.
  const safe = path.basename(filename);
  return path.join(getStorageDir(), safe);
}

/** Gera um nome de arquivo único preservando a extensão original. */
export function buildStoredFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".mp4";
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}${ext}`;
}

/** Slug simples e seguro para URLs a partir de um título. */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      // Remove marcas diacriticas combinantes (acentos) via faixa unicode.
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "video"
  );
}
