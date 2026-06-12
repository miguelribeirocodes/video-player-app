"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Course = { id: string; title: string };

export default function UploadForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setCourseId("");
    setFile(null);
    setProgress(0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (!title.trim()) return setError("Informe um título.");
    if (!file) return setError("Selecione um arquivo de vídeo.");

    setBusy(true);
    setProgress(0);

    const qs = new URLSearchParams({
      title: title.trim(),
      description: description.trim(),
      originalName: file.name,
      mimeType: file.type || "video/mp4",
    });
    if (courseId) qs.set("courseId", courseId);

    // XHR para ter barra de progresso de upload.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload?${qs.toString()}`);
    xhr.setRequestHeader("content-type", file.type || "video/mp4");
    if (password) xhr.setRequestHeader("x-admin-password", password);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setBusy(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setDone(true);
        reset();
        router.refresh();
      } else {
        try {
          setError(JSON.parse(xhr.responseText).error || "Falha no upload.");
        } catch {
          setError(`Falha no upload (HTTP ${xhr.status}).`);
        }
      }
    };
    xhr.onerror = () => {
      setBusy(false);
      setError("Erro de rede durante o upload.");
    };

    xhr.send(file);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-white/10 bg-slate-900/50 p-5"
    >
      <h2 className="font-semibold">Enviar novo vídeo</h2>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:border-brand-400"
          placeholder="Ex.: Aula 1 — O que é psicologia"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:border-brand-400"
          placeholder="Resumo da aula (opcional)"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Curso</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:border-brand-400"
        >
          <option value="">Sem curso (avulso)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Arquivo de vídeo *
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-white hover:file:bg-brand-500"
        />
        {file && (
          <p className="mt-1 text-xs text-slate-500">
            {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Senha de admin
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:border-brand-400"
          placeholder="Definida em ADMIN_PASSWORD"
        />
      </div>

      {busy && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">Enviando… {progress}%</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && (
        <p className="text-sm text-green-400">
          Vídeo enviado com sucesso!
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand-600 px-4 py-2 font-medium hover:bg-brand-500 disabled:opacity-50"
      >
        {busy ? "Enviando…" : "Enviar vídeo"}
      </button>
    </form>
  );
}
