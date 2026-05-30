import { useEffect, useRef, useState } from "react";
import bgmSrc from "@/assets/bgm.m4a";

interface BGMPlayerProps {
  className?: string;
}

export function BGMPlayer({ className = "" }: BGMPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.38;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          setPlaying(true);
          setBlocked(false);
        })
        .catch(() => {
          setPlaying(false);
          setBlocked(true);
        });
    }
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={bgmSrc} loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        className={`absolute right-4 top-[88px] z-30 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] tracking-wider text-white/85 backdrop-blur-md transition active:scale-95 ${className}`}
        aria-label={playing ? "暂停 BGM" : "播放 BGM"}
        title={playing ? "暂停 BGM" : "播放 BGM"}
      >
        {playing ? "♪ BGM" : blocked ? "♪ 开启BGM" : "♪ BGM"}
      </button>
    </>
  );
}
