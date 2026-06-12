import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

export default async function HomePage() {
  const videos = await prisma.video.findMany({
    where: { published: true },
    orderBy: [{ createdAt: "desc" }],
    include: { course: true },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Cursos de Psicologia da Sabrina
        </h1>
        <p className="mt-2 max-w-xl text-brand-100">
          Aulas em vídeo para assistir quando e onde quiser — no computador ou
          no celular.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Aulas disponíveis</h2>

        {videos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-slate-400">
            Nenhum vídeo ainda. Vá em{" "}
            <Link href="/admin" className="text-brand-300 underline">
              Admin
            </Link>{" "}
            para enviar o primeiro.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <Link
                key={v.id}
                href={`/watch/${v.slug}`}
                className="group rounded-xl overflow-hidden border border-white/10 bg-slate-900/50 hover:border-brand-400/60 transition-colors"
              >
                <div className="aspect-video bg-slate-800 flex items-center justify-center text-slate-600 group-hover:text-brand-300">
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium leading-tight line-clamp-2">
                    {v.title}
                  </h3>
                  {v.course && (
                    <p className="mt-1 text-xs text-brand-300">
                      {v.course.title}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {formatBytes(v.sizeBytes)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
