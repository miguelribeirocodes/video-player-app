"use client";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

type Props = {
  src: string;
  title: string;
  mimeType?: string;
  poster?: string | null;
};

/**
 * Player Vidstack servindo o vídeo do nosso próprio backend (/api/stream/:id).
 * Nenhuma API externa (YouTube/Vimeo) — o arquivo vem do nosso disco.
 */
export default function VideoPlayer({ src, title, mimeType, poster }: Props) {
  return (
    <MediaPlayer
      title={title}
      src={{ src, type: (mimeType as any) || "video/mp4" }}
      poster={poster || undefined}
      crossOrigin
      playsInline
      className="w-full aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10"
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
