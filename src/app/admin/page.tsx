import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UploadForm from "@/components/UploadForm";
import DeleteVideoButton from "@/components/DeleteVideoButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [courses, videos] = await Promise.all([
    prisma.course.findMany({ orderBy: { title: "asc" } }),
    prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      include: { course: true },
    }),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-xl font-semibold mb-4">Administração</h1>
        <UploadForm courses={courses} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">
          Vídeos enviados ({videos.length})
        </h2>
        {videos.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhum vídeo ainda.</p>
        ) : (
          <ul className="space-y-2">
            {videos.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/watch/${v.slug}`}
                    className="font-medium hover:text-brand-300 truncate block"
                  >
                    {v.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {v.course ? v.course.title : "Avulso"} ·{" "}
                    {(v.sizeBytes / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <DeleteVideoButton id={v.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
