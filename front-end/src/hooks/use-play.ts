/**
 * usePlay · 第五幕游戏主状态机
 * 串起 PRISM 折射 / 翻译层 / chat / 场景流转 / QTE 入口
 *
 * 从 dist/play/index.html 的 state + nextScene + showOptions + onUserChoose
 * 迁移而来，改成 React 状态机
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  VIEWS,
  PERSONAS,
  ENDINGS,
  type SceneConfig,
  type SceneOption,
  type SceneSideQuest,
  type ViewKey,
} from "@/lib/story";
import {
  refract,
  type RefractedOption,
  type RefractedAxes,
  type HUDInfo,
  type PrismMeta,
} from "@/lib/prism";
import {
  chatWithAIStream,
  translateIntent,
  type ChatMessage,
} from "@/lib/chat";
import {
  INITIAL_STATE,
  applyHook,
  decideEndingByChoices,
  summarizeChange,
  type NumericsState,
  type EndingDecision,
} from "@/lib/numerics";

// ── Message types ─────────────────────────────────────────

export type PlayMessage =
  | { id: string; kind: "narration"; text: string }
  | { id: string; kind: "ai"; name: string; text: string; streaming?: boolean }
  | { id: string; kind: "me"; text: string }
  | { id: string; kind: "loading"; name: string }
  | { id: string; kind: "system"; text: string };

export interface PlayHookLog {
  scene: string;
  hook: string;
  tag?: string;
  delta?: Record<string, string>;
  id: string;
}

export interface PlayState {
  phase: "intro" | "playing" | "qte" | "battleIntro" | "ending";
  sceneIdx: number;
  scene: SceneConfig | null;
  messages: PlayMessage[];
  options: RefractedOption[] | null;
  optionsLoading: boolean;
  translating: boolean;
  busy: boolean;
  showContinue: boolean;
  axes: RefractedAxes | null;
  hud: HUDInfo | null;
  hookLog: PlayHookLog[];
  roundInScene: number;
  maxRoundsPerScene: number;
  currentBeatLabel: string | null;
  endingKey: string | null;
  // 数值系统
  numerics: NumericsState;
  lastChange: string[];           // 最近一次 hook 引起的数值变化（给 UI 飘字用）
  endingDecision: EndingDecision | null;
  pendingSideQuest: SceneSideQuest | null;
  completedSideQuests: string[];
}

const MAX_ROUNDS = 1;
const DEFAULT_VIEW: ViewKey = "hanyan";

let _msgId = 0;
const newId = () => `m${++_msgId}`;

function getSceneIndexBefore(view: ViewKey, sceneId?: string) {
  if (!sceneId) return -1;
  const index = VIEWS[view].scenes.findIndex((scene) => scene.id === sceneId);
  return index > -1 ? index - 1 : -1;
}

function toRefractedOption(
  option: SceneOption,
  sceneId: string,
  beatId: string,
  index: number
): RefractedOption {
  return {
    text: option.text,
    tag: option.tag,
    cls: option.cls || "",
    _prism: {
      hook: option.hook || "",
      id: option.id || `${sceneId}_${beatId}_${index}`,
      tag: option.tag,
      delta: option.delta,
    },
  };
}

export function usePlay(initialView: ViewKey = DEFAULT_VIEW, initialSceneId?: string) {
  const [view, setView] = useState<ViewKey>(initialView);
  const scenesRef = useRef(VIEWS[initialView].scenes);
  const startedRef = useRef(false);
  const initialSceneIdx = getSceneIndexBefore(initialView, initialSceneId);

  const [state, setState] = useState<PlayState>({
    phase: "intro",
    sceneIdx: initialSceneIdx,
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
    currentBeatLabel: null,
    endingKey: null,
    numerics: INITIAL_STATE,
    lastChange: [],
    endingDecision: null,
    pendingSideQuest: null,
    completedSideQuests: [],
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

  const recordChoiceMeta = useCallback((sceneId: string, prismMeta: PrismMeta | null) => {
    if (!prismMeta?.hook) return;
    setState((s) => {
      if (s.hookLog.some((item) => item.id === prismMeta.id)) return s;
      const nextNum = applyHook(s.numerics, prismMeta.delta);
      const change = summarizeChange(s.numerics, nextNum);
      console.log("[Prism hook]", prismMeta.hook, prismMeta.delta || {}, "→", change);
      return {
        ...s,
        numerics: nextNum,
        lastChange: change,
        hookLog: [
          ...s.hookLog,
          {
            scene: sceneId,
            hook: prismMeta.hook,
            tag: prismMeta.tag,
            delta: prismMeta.delta,
            id: prismMeta.id,
          },
        ],
      };
    });
  }, []);

  // ── 加载选项（三段式 beat 控制选项；PRISM 仍负责 HUD / 轴信息）────────
  const loadOptions = useCallback(async (scene: SceneConfig, round = 0) => {
    setState((s) => ({ ...s, optionsLoading: true, options: null }));

    const beat = scene.dialogueBeats?.[round];
    let opts: RefractedOption[] | null = beat
      ? beat.options.map((o, i) => toRefractedOption(o, scene.id, beat.id, i))
      : null;
    let axes: RefractedAxes | null = null;
    let hud: HUDInfo | null = null;

    try {
      const result = await refract(scene);
      if (result) {
        if (!opts) opts = result.options;
        axes = result.axes;
        hud = result.hud;
      }
    } catch (e) {
      console.warn("[Prism] refract error", e);
    }

    // 兜底
    if (!opts || opts.length === 0) {
      opts =
        scene.options?.map((o, i) => toRefractedOption(o, scene.id, "legacy", i)) || [];
    }

    setState((s) => ({
      ...s,
      options: opts,
      optionsLoading: false,
      axes,
      hud,
      currentBeatLabel: beat?.label ?? null,
    }));
  }, []);

  // ── 进入下一幕（或 QTE） ─────────────────────────────────
  const nextScene = useCallback(() => {
    setState((s) => {
      const scenes = scenesRef.current;
      const nextIdx = s.sceneIdx + 1;
      if (nextIdx >= scenes.length) {
        // 剧情走完：按玩家在三幕中的"选择"投票决定结局（无选择时回退数值兜底）
        const decision = decideEndingByChoices(s.hookLog, s.numerics);
        console.log("[Ending decision · by-choices]", decision);
        return {
          ...s,
          phase: "battleIntro",
          endingKey: decision.ending,
          endingDecision: decision,
          showContinue: false,
        };
      }
      const scene = scenes[nextIdx];
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
        maxRoundsPerScene: scene.dialogueBeats?.length || MAX_ROUNDS,
        currentBeatLabel: scene.dialogueBeats?.[0]?.label ?? null,
        showContinue: false,
      };
    });
  }, []);

  // 当 scene / round 变化时，触发 loadOptions
  useEffect(() => {
    if (state.scene && state.phase === "playing" && state.options === null && !state.optionsLoading) {
      loadOptions(state.scene, state.roundInScene);
    }
  }, [
    state.scene,
    state.phase,
    state.options,
    state.optionsLoading,
    state.roundInScene,
    loadOptions,
  ]);

  // ── 玩家选了选项 / 自由输入 ─────────────────────────────
  const submitTurn = useCallback(
    async (text: string, prismMeta: PrismMeta | null) => {
      const scene = state.scene;
      if (!scene || state.busy) return;

      recordChoiceMeta(scene.id, prismMeta);

      // 玩家消息 + 立刻 push 一条空的 streaming AI 气泡
      const meId = newId();
      const aiId = newId();
      setState((s) => ({
        ...s,
        busy: true,
        options: null,
        messages: [
          ...s.messages,
          { id: meId, kind: "me", text },
          { id: aiId, kind: "ai", name: scene.aiCharacter, text: "", streaming: true },
        ],
      }));

      historyRef.current.push({ role: "user", content: text });

      try {
        const persona = PERSONAS[scene.aiPersona];

        // 流式：每收到一段就更新 aiId 那条消息的 text
        const reply = await chatWithAIStream(persona, historyRef.current, {
          onChunk: (_delta, accumulated) => {
            setState((s) => ({
              ...s,
              messages: s.messages.map((m) =>
                m.id === aiId && m.kind === "ai"
                  ? { ...m, text: accumulated, streaming: true }
                  : m
              ),
            }));
          },
        });

        historyRef.current.push({ role: "assistant", content: reply });

        setState((s) => {
          const messages = s.messages.map((m) =>
            m.id === aiId && m.kind === "ai"
              ? { ...m, text: reply, streaming: false }
              : m
          );
          const newRound = s.roundInScene + 1;
          const sideQuest = scene.sideQuest;
          const shouldShowSideQuest =
            newRound >= s.maxRoundsPerScene &&
            sideQuest &&
            !s.completedSideQuests.includes(sideQuest.id);
          return {
            ...s,
            messages,
            busy: false,
            roundInScene: newRound,
            pendingSideQuest: shouldShowSideQuest ? sideQuest : s.pendingSideQuest,
            showContinue: newRound >= s.maxRoundsPerScene && !shouldShowSideQuest,
            options: newRound >= s.maxRoundsPerScene ? null : s.options,
          };
        });

        // 还没达到轮次上限，重新加载选项
        setTimeout(() => {
          setState((s) => {
            if (s.roundInScene < s.maxRoundsPerScene) {
              loadOptions(scene, s.roundInScene);
            }
            return s;
          });
        }, 600);
      } catch (err: any) {
        setState((s) => {
          // 失败时把流式气泡换成系统错误
          const messages = s.messages
            .filter((m) => m.id !== aiId)
            .concat([{ id: newId(), kind: "system", text: `⚠️ ${err.message || err}` }]);
          return { ...s, messages, busy: false, showContinue: true };
        });
      }
    },
    [state.scene, state.busy, loadOptions, recordChoiceMeta]
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
    setState((s) => {
      const sideQuest = s.scene?.sideQuest;
      if (sideQuest && !s.completedSideQuests.includes(sideQuest.id)) {
        return {
          ...s,
          options: null,
          showContinue: false,
          pendingSideQuest: sideQuest,
        };
      }

      return { ...s, options: null, showContinue: true };
    });
  }, []);

  const goNext = useCallback(() => {
    const sideQuest = state.scene?.sideQuest;
    if (
      sideQuest &&
      !state.pendingSideQuest &&
      !state.completedSideQuests.includes(sideQuest.id)
    ) {
      setState((s) => ({
        ...s,
        pendingSideQuest: sideQuest,
        showContinue: false,
        options: null,
      }));
      return;
    }

    nextScene();
  }, [nextScene, state.completedSideQuests, state.pendingSideQuest, state.scene]);

  const continueMainAfterSideQuest = useCallback(() => {
    const sideQuest = state.pendingSideQuest;
    if (!sideQuest) {
      nextScene();
      return;
    }

    setState((s) => ({
      ...s,
      pendingSideQuest: null,
      completedSideQuests: s.completedSideQuests.includes(sideQuest.id)
        ? s.completedSideQuests
        : [...s.completedSideQuests, sideQuest.id],
    }));
    setTimeout(nextScene, 0);
  }, [nextScene, state.pendingSideQuest]);

  // ── 开始游戏 ────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    nextScene();
  }, [nextScene]);

  // ── 重玩 ────────────────────────────────────────────────
  const restart = useCallback((newView?: ViewKey) => {
    startedRef.current = false;
    historyRef.current = [];
    if (newView) {
      setView(newView);
      scenesRef.current = VIEWS[newView].scenes;
    }
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
      currentBeatLabel: null,
      endingKey: null,
      numerics: INITIAL_STATE,
      lastChange: [],
      endingDecision: null,
      pendingSideQuest: null,
      completedSideQuests: [],
    });
  }, []);

  // ── 切换视角（会重启）─────────────────────────────────
  const switchView = useCallback(
    (nextView: ViewKey) => {
      if (nextView === view) return;
      restart(nextView);
    },
    [view, restart]
  );

  return {
    state,
    view,
    startGame,
    chooseOption,
    submitFreeInput,
    skipScene,
    goNext,
    continueMainAfterSideQuest,
    recordChoiceMeta,
    restart,
    switchView,
    ending: state.endingKey ? ENDINGS[state.endingKey] : null,
  };
}
