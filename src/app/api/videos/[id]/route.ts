import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { getVideoPath } from "@/lib/storage";

export const runtime = "nodejs";

/** Exclui um vídeo (registro + arquivo). DELETE /api/videos/:id */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    const provided = req.headers.get("x-admin-password");
    if (provided !== adminPassword) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json(
      { error: "Vídeo não encontrado." },
      { status: 404 }
    );
  }

  await unlink(getVideoPath(video.filename)).catch(() => {});
  await prisma.video.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
