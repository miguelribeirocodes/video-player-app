import { NextRequest } from "next/server";
import { createReadStream, statSync, existsSync } from "node:fs";
import { Readable } from "node:stream";
import { prisma } from "@/lib/prisma";
import { getVideoPath } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Streaming de vídeo com suporte a HTTP Range Requests (seek/scrub no player).
 *
 * GET /api/stream/:id   (id = id do vídeo ou slug)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const video = await prisma.video.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });

  if (!video) {
    return new Response("Vídeo não encontrado.", { status: 404 });
  }

  const filePath = getVideoPath(video.filename);
  if (!existsSync(filePath)) {
    return new Response("Arquivo do vídeo ausente no servidor.", {
      status: 404,
    });
  }

  const stat = statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  const baseHeaders: Record<string, string> = {
    "Content-Type": video.mimeType || "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
  };

  // Sem Range -> devolve o arquivo inteiro (200).
  if (!range) {
    const stream = createReadStream(filePath);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(fileSize) },
    });
  }

  // Faixa pedida: "bytes=START-END"
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  let start = match && match[1] ? parseInt(match[1], 10) : 0;
  let end = match && match[2] ? parseInt(match[2], 10) : fileSize - 1;

  // Validação dos limites.
  if (Number.isNaN(start) || start < 0) start = 0;
  if (Number.isNaN(end) || end >= fileSize) end = fileSize - 1;
  if (start > end) {
    return new Response("Faixa inválida.", {
      status: 416,
      headers: { "Content-Range": `bytes */${fileSize}` },
    });
  }

  const chunkSize = end - start + 1;
  const stream = createReadStream(filePath, { start, end });

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": String(chunkSize),
    },
  });
}
