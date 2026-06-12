"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteVideoButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir este vídeo? Esta ação não pode ser desfeita.")) return;
    const password = prompt("Senha de admin:") || "";
    setBusy(true);
    const res = await fetch(`/api/videos/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Falha ao excluir (senha incorreta?).");
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {busy ? "Excluindo…" : "Excluir"}
    </button>
  );
}
