/**
 * useQTE · 暗巷追杀声音 QTE
 * Web Audio API + 麦克风分贝/时长判定
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface QTEConfig {
  duration: number;      // 总时长 ms
  sampleInterval: number; // 采样间隔 ms
  successDB: number;     // 三星阈值
  midDB: number;         // 二星阈值
  successHit: number;    // 三星持续帧数
  midHit: number;        // 二星持续帧数
}

export type QTEResult = "fuyunxi" | "zhuoqi" | "captured";

export interface QTEFinalScore {
  db: number;
  hit: number; // 秒
  stars: 1 | 2 | 3;
  result: QTEResult;
}

export interface QTEState {
  active: boolean;        // 是否已点击开始（mic 在采样）
  preparing: boolean;     // 申请权限到拿到 stream 之间
  db: number;             // 当前分贝
  hitSeconds: number;     // 已命中秒数
  remaining: number;      // 倒计时（秒）
  error: string | null;
  finalScore: QTEFinalScore | null;
}

export const DEFAULT_QTE_CONFIG: QTEConfig = {
  duration: 5000,
  sampleInterval: 80,
  successDB: 78,
  midDB: 62,
  successHit: 25,
  midHit: 13,
};

export function useQTE(config: QTEConfig = DEFAULT_QTE_CONFIG) {
  const [state, setState] = useState<QTEState>({
    active: false,
    preparing: false,
    db: 0,
    hitSeconds: 0,
    remaining: config.duration / 1000,
    error: null,
    finalScore: null,
  });

  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const judge = useCallback(
    (maxDB: number, hitFrames: number): QTEFinalScore => {
      let stars: 1 | 2 | 3 = 1;
      let result: QTEResult = "captured";
      if (maxDB >= config.successDB && hitFrames >= config.successHit) {
        stars = 3;
        result = "fuyunxi";
      } else if (maxDB >= config.midDB && hitFrames >= config.midHit) {
        stars = 2;
        result = "zhuoqi";
      }
      return {
        db: Math.round(maxDB),
        hit: +((hitFrames * config.sampleInterval) / 1000).toFixed(1),
        stars,
        result,
      };
    },
    [config]
  );

  const start = useCallback(async () => {
    if (state.active || state.preparing) return;
    setState((s) => ({ ...s, preparing: true, error: null, finalScore: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const audioCtx = new AC();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const startTime = Date.now();
      let maxDB = 0;
      let hitFrames = 0;

      setState((s) => ({ ...s, active: true, preparing: false }));

      timerRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const db = Math.min(100, Math.max(0, 30 + (avg / 255) * 80));

        if (db > 50) hitFrames++;
        if (db > maxDB) maxDB = db;

        const elapsed = (Date.now() - startTime) / 1000;
        const remain = Math.max(0, config.duration / 1000 - elapsed);

        setState((s) => ({
          ...s,
          db: Math.round(db),
          hitSeconds: +((hitFrames * config.sampleInterval) / 1000).toFixed(1),
          remaining: +remain.toFixed(1),
        }));

        if (elapsed >= config.duration / 1000) {
          const score = judge(maxDB, hitFrames);
          cleanup();
          setState((s) => ({
            ...s,
            active: false,
            db: 0,
            hitSeconds: score.hit,
            remaining: 0,
            finalScore: score,
          }));
        }
      }, config.sampleInterval);
    } catch (err: any) {
      console.warn("[QTE] mic denied or failed:", err);
      // 麦克风被拒：直接判定为最低档
      const score: QTEFinalScore = { db: 0, hit: 0, stars: 1, result: "captured" };
      cleanup();
      setState((s) => ({
        ...s,
        active: false,
        preparing: false,
        error: err?.message || "麦克风不可用",
        finalScore: score,
      }));
    }
  }, [state.active, state.preparing, config, cleanup, judge]);

  const reset = useCallback(() => {
    cleanup();
    setState({
      active: false,
      preparing: false,
      db: 0,
      hitSeconds: 0,
      remaining: config.duration / 1000,
      error: null,
      finalScore: null,
    });
  }, [cleanup, config.duration]);

  return { state, start, reset };
}
