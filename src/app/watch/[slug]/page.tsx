import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import VideoPlayer from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await prisma.video.findUnique({ where: { slug } });
  return { title: video?.title ?? "Vídeo" };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const video = await prisma.video.findUnique({
    where: { slug },
    include: { course: true },
  });

  if (!video || !video.published) notFound();

  // Outras aulas do mesmo curso (lista lateral / abaixo).
  const related = video.courseId
    ? await prisma.video.findMany({
        where: {
          courseId: video.courseId,
          published: true,
          id: { not: video.id },
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: 8,
      })
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <VideoPlayer
          src={`/api/stream/${video.id}`}
          title={video.title}
          mimeType={video.mimeType}
          poster={video.thumbnail}
        />
        <div>
          {video.course && (
            <Link
              href="/"
              className="text-xs text-brand-300 hover:underline"
            >
              {video.course.title}
            </Link>
          )}
          <h1 className="text-xl font-semibold mt-1">{video.title}</h1>
          {video.description && (
            <p className="mt-2 text-slate-300 whitespace-pre-wrap">
              {video.description}
            </p>
          )}
        </div>
      </div>

      <aside className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400">
          {related.length > 0 ? "Mais aulas deste curso" : "Continue assistindo"}
        </h2>
        {related.length === 0 ? (
          <Link
            href="/"
            className="block rounded-lg border border-white/10 p-3 text-sm text-slate-300 hover:border-brand-400/60"
          >
            ← Voltar ao catálogo
          </Link>
        ) : (
          related.map((r) => (
            <Link
              key={r.id}
              href={`/watch/${r.slug}`}
              className="flex gap-3 rounded-lg border border-white/10 p-2 hover:border-brand-400/60"
            >
              <div className="h-12 w-20 flex-shrink-0 rounded bg-slate-800 flex items-center justify-center text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-sm leading-tight line-clamp-2">
                {r.title}
              </span>
            </Link>
          ))
        )}
      </aside>
    </div>
  );
}
