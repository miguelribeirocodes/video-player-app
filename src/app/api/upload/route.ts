import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  buildStoredFilename,
  getStorageDir,
  slugify,
} from "@/lib/storage";

// Necessário runtime Node (fs/streams) e sem limite de body do edge.
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Upload de vídeo via streaming direto para o disco.
 *
 * O cliente envia o ARQUIVO BRUTO no corpo da requisição (sem multipart),
 * e os metadados como query params. Assim evitamos bufferizar o vídeo
 * inteiro em memória.
 *
 * POST /api/upload?title=...&originalName=...&courseId=...&password=...
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Gate de admin simples para o MVP (substituir por auth real na fase 2).
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    const provided =
      req.headers.get("x-admin-password") || searchParams.get("password");
    if (provided !== adminPassword) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const title = (searchParams.get("title") || "").trim();
  const description = (searchParams.get("description") || "").trim() || null;
  const originalName = searchParams.get("originalName") || "video.mp4";
  const courseId = searchParams.get("courseId") || null;
  const mimeType =
    searchParams.get("mimeType") ||
    req.headers.get("content-type") ||
    "video/mp4";

  if (!title) {
    return NextResponse.json(
      { error: "Título é obrigatório." },
      { status: 400 }
    );
  }
  if (!req.body) {
    return NextResponse.json(
      { error: "Corpo da requisição vazio (arquivo ausente)." },
      { status: 400 }
    );
  }

  const filename = buildStoredFilename(originalName);
  const destPath = path.join(getStorageDir(), filename);

  // Pipe do stream web -> stream node de arquivo.
  let bytesWritten = 0;
  try {
    const nodeReadable = Readable.fromWeb(req.body as any);
    const writeStream = createWriteStream(destPath);

    nodeReadable.on("data", (chunk: Buffer) => {
      bytesWritten += chunk.length;
    });

    await new Promise<void>((resolve, reject) => {
      nodeReadable.pipe(writeStream);
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
      nodeReadable.on("error", reject);
    });
  } catch (err) {
    // Limpa arquivo parcial em caso de falha.
    await unlink(destPath).catch(() => {});
    console.error("Falha no upload:", err);
    return NextResponse.json(
      { error: "Falha ao salvar o arquivo." },
      { status: 500 }
    );
  }

  // Garante slug único.
  const base = slugify(title);
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.video.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }

  const video = await prisma.video.create({
    data: {
      title,
      description,
      slug,
      filename,
      mimeType,
      sizeBytes: bytesWritten,
      courseId: courseId || undefined,
    },
  });

  return NextResponse.json({ video }, { status: 201 });
}
