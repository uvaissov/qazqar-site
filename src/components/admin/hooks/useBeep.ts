"use client";

import { useCallback, useRef } from "react";

type AudioCtxCtor = typeof AudioContext;

export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  return useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      if (!ctxRef.current) {
        const Ctor: AudioCtxCtor | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: AudioCtxCtor })
            .webkitAudioContext;
        if (!Ctor) return;
        ctxRef.current = new Ctor();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // autoplay-blocked, OS muted, etc. — silently ignore
    }
  }, []);
}
