/**
 * usePlay · 第五幕游戏主状态机
 * 串起 PRISM 折射 / 翻译层 / chat / 场景流转 / QTE 入口
 *
 * 从 dist/play/index.html 的 state + nextScene + showOptions + onUserChoose
 * 迁移而来，改成 React 状态机
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { SCENES, PERSONAS, ENDINGS, type SceneConfig } from "@/lib/story";
import {
  refract,
  type RefractedOption,
  type RefractedAxes,
  type HUDInfo,
  type PrismMeta,
} from "@/lib/prism";
import {
  chatWithAI,
  translateIntent,
  type ChatMessage,
} from "@/lib/chat";

// ── Message types ─────────────────────────────────────────

export type PlayMessage =
  | { id: string; kind: "narration"; text: string }
  | { id: string; kind: "ai"; name: string; text: string }
  | { id: string; kind: "me"; text: string }
  | { id: string; kind: "loading"; name: string }
  | { id: string; kind: "system"; text: string };

export interface PlayHookLog {
  scene: string;
  hook: string;
  delta?: Record<string, string>;
  id: string;
}

export interface PlayState {
  phase: "intro" | "playing" | "qte" | "ending";
  sceneIdx: number;
  scene: SceneConfig | null;
  messages: PlayMessage[];
  options: RefractedOption[] | null; // null = 还在加载
  optionsLoading: boolean;
  translating: boolean;       // 翻译选项中（按钮显示"译…"）
  busy: boolean;              // 等 AI 回复中
  showContinue: boolean;      // 显示"进入下一幕"按钮
  axes: RefractedAxes | null;
  hud: HUDInfo | null;
  hookLog: PlayHookLog[];
  roundInScene: number;
  maxRoundsPerScene: number;
  endingKey: string | null;
}

const MAX_ROUNDS = 1;

let _msgId = 0;
const newId = () => `m${++_msgId}`;

export function usePlay() {
  const [state, setState] = useState<PlayState>({
    phase: "intro",
    sceneIdx: -1,
    scene: null,
    messages: [],
    options: null,
    optionsLoading: false,
    translating: false,
    busy: false,
    showContinue: false,
    axes: null,
    hud: null,
    hookLog: [],
    roundInScene: 0,
    maxRoundsPerScene: MAX_ROUNDS,
    endingKey: null,
  });

  // 用 ref 持有当前场景的对话历史（不进 React state，频繁变动）
  const historyRef = useRef<ChatMessage[]>([]);

  const append = useCallback((msg: PlayMessage) => {
    setState((s) => ({ ...s, messages: [...s.messages, msg] }));
  }, []);

  const removeLoading = useCallback(() => {
    setState((s) => ({
      ...s,
      messages: s.messages.filter((m) => m.kind !== "loading"),
    }));
  }, []);

  // ── 加载选项（折射 PRISM；失败回退到 scene.options）────────
  const loadOptions = useCallback(async (scene: SceneConfig) => {
    setState((s) => ({ ...s, optionsLoading: true, options: null }));

    let opts: RefractedOption[] | null = null;
    let axes: RefractedAxes | null = null;
    let hud: HUDInfo | null = null;

    try {
      const result = await refract(scene);
      if (result) {
        opts = result.options;
        axes = result.axes;
        hud = result.hud;
      }
    } catch (e) {
      console.warn("[Prism] refract error", e);
    }

    // 兜底
    if (!opts || opts.length === 0) {
      opts =
        scene.options?.map((o) => ({
          text: o.text,
          tag: o.tag,
          cls: (o.cls as any) || "",
          _prism: { hook: "", id: "", delta: undefined, require: undefined },
        })) || [];
    }

    setState((s) => ({
      ...s,
      options: opts,
      optionsLoading: false,
      axes,
      hud,
    }));
  }, []);

  // ── 进入下一幕（或 QTE） ─────────────────────────────────
  const nextScene = useCallback(() => {
    setState((s) => {
      const nextIdx = s.sceneIdx + 1;
      if (nextIdx >= SCENES.length) {
        return { ...s, phase: "qte", showContinue: false };
      }
      const scene = SCENES[nextIdx];
      historyRef.current = [];

      const msgs: PlayMessage[] = [];
      scene.narrations.forEach((n) => msgs.push({ id: newId(), kind: "narration", text: n }));
      msgs.push({ id: newId(), kind: "ai", name: scene.aiCharacter, text: scene.aiOpening });
      historyRef.current.push({ role: "assistant", content: scene.aiOpening });

      return {
        ...s,
        phase: "playing",
        sceneIdx: nextIdx,
        scene,
        messages: msgs,
        options: null,
        roundInScene: 0,
        showContinue: false,
      };
    });
  }, []);

  // 当 scene 变化时，触发 loadOptions
  useEffect(() => {
    if (state.scene && state.phase === "playing" && state.options === null && !state.optionsLoading) {
      loadOptions(state.scene);
    }
  }, [state.scene, state.phase, state.options, state.optionsLoading, loadOptions]);

  // ── 玩家选了选项 / 自由输入 ─────────────────────────────
  const submitTurn = useCallback(
    async (text: string, prismMeta: PrismMeta | null) => {
      const scene = state.scene;
      if (!scene || state.busy) return;

      if (prismMeta?.hook) {
        setState((s) => ({
          ...s,
          hookLog: [
            ...s.hookLog,
            {
              scene: scene.id,
              hook: prismMeta.hook,
              delta: prismMeta.delta,
              id: prismMeta.id,
            },
          ],
        }));
        console.log("[Prism hook]", prismMeta.hook, prismMeta.delta || {});
      }

      // 玩家消息 + loading
      const meId = newId();
      const loadId = newId();
      setState((s) => ({
        ...s,
        busy: true,
        options: null,
        messages: [
          ...s.messages,
          { id: meId, kind: "me", text },
          { id: loadId, kind: "loading", name: scene.aiCharacter },
        ],
      }));

      historyRef.current.push({ role: "user", content: text });

      try {
        const persona = PERSONAS[scene.aiPersona];
        const reply = await chatWithAI(persona, historyRef.current);
        historyRef.current.push({ role: "assistant", content: reply });

        setState((s) => {
          const messages = s.messages.filter((m) => m.id !== loadId);
          messages.push({ id: newId(), kind: "ai", name: scene.aiCharacter, text: reply });
          const newRound = s.roundInScene + 1;
          return {
            ...s,
            messages,
            busy: false,
            roundInScene: newRound,
            showContinue: newRound >= s.maxRoundsPerScene,
            options: newRound >= s.maxRoundsPerScene ? null : s.options,
          };
        });

        // 还没达到轮次上限，重新加载选项
        setTimeout(() => {
          setState((s) => {
            if (s.roundInScene < s.maxRoundsPerScene) {
              // 触发重新折射
              loadOptions(scene);
            }
            return s;
          });
        }, 600);
      } catch (err: any) {
        setState((s) => {
          const messages = s.messages.filter((m) => m.id !== loadId);
          messages.push({ id: newId(), kind: "system", text: `⚠️ ${err.message || err}` });
          return { ...s, messages, busy: false, showContinue: true };
        });
      }
    },
    [state.scene, state.busy, loadOptions]
  );

  // ── 用户点击 Prism 选项（含翻译）────────────────────────
  const chooseOption = useCallback(
    async (opt: RefractedOption) => {
      if (state.busy || state.translating) return;
      const scene = state.scene;
      if (!scene) return;

      // 没有 prism hook（兜底场景）直接送文
      if (!opt._prism.hook) {
        await submitTurn(opt.text, null);
        return;
      }

      setState((s) => ({ ...s, translating: true }));
      const spokenLine = await translateIntent(
        {
          sceneId: scene.id,
          sceneTag: scene.sceneTag,
          sceneName: scene.sceneName,
          aiCharacter: scene.aiCharacter,
        },
        opt.text,
        opt._prism
      );
      setState((s) => ({ ...s, translating: false }));
      await submitTurn(spokenLine, opt._prism);
    },
    [state.busy, state.translating, state.scene, submitTurn]
  );

  // ── 自由输入 ────────────────────────────────────────────
  const submitFreeInput = useCallback(
    async (text: string) => {
      const v = text.trim();
      if (!v) return;
      await submitTurn(v, null);
    },
    [submitTurn]
  );

  // ── 跳过这幕 / 进入下一幕 ───────────────────────────────
  const skipScene = useCallback(() => {
    setState((s) => ({ ...s, options: null, showContinue: true }));
  }, []);

  const goNext = useCallback(() => {
    nextScene();
  }, [nextScene]);

  // ── 开始游戏 ────────────────────────────────────────────
  const startGame = useCallback(() => {
    nextScene();
  }, [nextScene]);

  // ── QTE 完成后路由结局 ──────────────────────────────────
  const finishQTE = useCallback((endingKey: string) => {
    setState((s) => ({ ...s, phase: "ending", endingKey }));
  }, []);

  // ── 重玩 ────────────────────────────────────────────────
  const restart = useCallback(() => {
    historyRef.current = [];
    setState({
      phase: "intro",
      sceneIdx: -1,
      scene: null,
      messages: [],
      options: null,
      optionsLoading: false,
      translating: false,
      busy: false,
      showContinue: false,
      axes: null,
      hud: null,
      hookLog: [],
      roundInScene: 0,
      maxRoundsPerScene: MAX_ROUNDS,
      endingKey: null,
    });
  }, []);

  return {
    state,
    startGame,
    chooseOption,
    submitFreeInput,
    skipScene,
    goNext,
    finishQTE,
    restart,
    ending: state.endingKey ? ENDINGS[state.endingKey] : null,
  };
}
