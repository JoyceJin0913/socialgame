/**
 * STORY 配置 · 第五幕三场 + Persona prompts + QTE 配置 + 结局
 * 支持多视角：hanyan（寒雁视角，默认） · fyx（傅云夕视角）
 */

import type { Persona } from "./chat";

export interface SceneConfig {
  id: string;
  sceneTag: string;
  sceneName: string;
  progress: number;
  narrations: string[];
  aiCharacter: string;
  aiPersona: string;
  aiOpening: string;
  prism?: { script: string; view: string; preset: string };
  options?: { text: string; tag: string; cls?: string }[];
  allowFreeInput?: boolean;
  freeInputHint?: string;
}

export interface EndingConfig {
  stars: string;
  title: string;
  epName: string;
  desc: string[];
  /** 结尾的题跋小字（古风信笺落款风格） */
  closing?: string;
}

export type ViewKey = "hanyan" | "fyx";

export interface ViewBundle {
  label: string;
  description: string;
  scenes: SceneConfig[];
}

// ── 寒雁视角（默认）─────────────────────────────────────

const HANYAN_SCENES: SceneConfig[] = [
  {
    id: "farewell",
    sceneTag: "第五幕 · 一年之约",
    sceneName: "玄清王府 · 书房",
    progress: 15,
    narrations: [
      "西戎犯境。傅云夕接旨那夜，独自坐在书房良久。",
      "窗外雪意未消，他唤你过去，将你一把拥入怀中。",
    ],
    aiCharacter: "傅云夕",
    aiPersona: "fuyunxi",
    aiOpening: "等我一年。一年内不归，你便改嫁。",
    prism: { script: "act5_separation", view: "hanyan", preset: "alpha" },
    options: [
      { text: '"我等你十年。"', tag: "深情", cls: "recommended" },
      { text: '"你必须回来——活着回来。"', tag: "坚定" },
      { text: '"……好。"（咬唇低头）', tag: "隐忍", cls: "gentle" },
    ],
    allowFreeInput: true,
    freeInputHint: "说一句让傅云夕记你一辈子的话…",
  },
  {
    id: "reunion",
    sceneTag: "第五幕 · 凯旋归来",
    sceneName: "皇宫 · 金銮殿外",
    progress: 40,
    narrations: [
      "一年又两月，他凯旋。",
      "可同行的还有西戎公主——伊琳娜，金发碧眼，国书上明明白白：愿以两国和平为聘，下嫁玄清王。",
      '更让你措手不及的是，皇上当朝下旨："玄清王正妃庄氏，三年无所出，且出身存疑，准其和离。"',
    ],
    aiCharacter: "伊琳娜",
    aiPersona: "yilinna",
    aiOpening: "庄王妃，伊琳娜不远千里而来，只为玄清王一人。望王妃能成全。",
    prism: { script: "act5_separation", view: "hanyan", preset: "beta" },
    options: [
      { text: '"公主远道而来，本妃自然要敬一杯。"（暗藏机锋）', tag: "高冷", cls: "recommended" },
      { text: '"我夫妻之事，与公主何干？"', tag: "强硬", cls: "danger" },
      { text: '微微福身："公主请自便。"', tag: "退让", cls: "gentle" },
    ],
    allowFreeInput: true,
    freeInputHint: "当众回应这位西戎公主…",
  },
  {
    id: "divorce",
    sceneTag: "第五幕 · 一纸休书",
    sceneName: "玄清王府 · 书房",
    progress: 65,
    narrations: [
      "那夜傅云夕回府，将一纸休书放在你面前。",
      "他指节因用力而发白，目光不敢看你。",
    ],
    aiCharacter: "傅云夕",
    aiPersona: "fuyunxi_cold",
    aiOpening: "寒雁，离开我。出王府，越远越好。",
    prism: { script: "act5_separation", view: "hanyan", preset: "gamma" },
    options: [
      { text: '"你要娶伊琳娜？"（红着眼）', tag: "质问" },
      { text: "安静接过休书，不发一言。", tag: "隐忍", cls: "recommended" },
      { text: '将休书撕得粉碎："傅云夕你做梦！"', tag: "激烈", cls: "danger" },
    ],
    allowFreeInput: true,
    freeInputHint: "你的反应，会决定他能否说出真相…",
  },
];

// ── 傅云夕视角 ─────────────────────────────────────────
// 同 3 场戏，对手 NPC 变成寒雁（玩家此时演男主，对面 AI 演寒雁）
// 这一视角的 Prism 调男主 pool（剧本里 fyx 视角的 13 个选项）

const FYX_SCENES: SceneConfig[] = [
  {
    id: "farewell_fyx",
    sceneTag: "第五幕 · 出征前夜",
    sceneName: "玄清王府 · 书房",
    progress: 15,
    narrations: [
      "西戎犯境。圣旨刚到，你的胸口又泛起一阵寒意——寒毒近来更频繁了。",
      "你练习了一夜的那句话，必须今夜说出口。",
    ],
    aiCharacter: "庄寒雁",
    aiPersona: "hanyan",
    aiOpening: "（她抬起眼，看着你，没说话。她在等你开口。）",
    prism: { script: "act5_separation", view: "fyx", preset: "alpha" },
    options: [
      { text: '"等我一年。"（轻描淡写）', tag: "克制" },
      { text: '"一年内不归，你便改嫁。"', tag: "决绝", cls: "danger" },
      { text: "（伸手拥她入怀，许久才开口。）", tag: "深情", cls: "recommended" },
    ],
    allowFreeInput: true,
    freeInputHint: "这句话决定她是否会等你…",
  },
  {
    id: "reunion_fyx",
    sceneTag: "第五幕 · 凯旋当朝",
    sceneName: "皇宫 · 金銮殿外",
    progress: 40,
    narrations: [
      "你凯旋了，身边却必须带着伊琳娜——这是和西戎议和的代价。",
      "皇兄当朝下旨准和离，是你和他演了一夜才定下的本子。",
      "她在那里看着你。你必须当作没看见。",
    ],
    aiCharacter: "庄寒雁",
    aiPersona: "hanyan_cold",
    aiOpening: "（她抬眼看你一瞬，立即收回目光，但你看见了她眼里的水光。）",
    prism: { script: "act5_separation", view: "fyx", preset: "beta" },
    options: [
      { text: "完全不看她，演到底。", tag: "演技", cls: "danger" },
      { text: "用眼神留一丝余地（赌她看得懂）。", tag: "破绽", cls: "recommended" },
      { text: "借故离场，避开当庭对峙。", tag: "退避", cls: "gentle" },
    ],
    allowFreeInput: true,
    freeInputHint: "她要么明白你，要么恨你一辈子…",
  },
  {
    id: "divorce_fyx",
    sceneTag: "第五幕 · 执笔休书",
    sceneName: "玄清王府 · 书房",
    progress: 65,
    narrations: [
      "皇命已下，今夜过后这张休书会被宫里的人记入档。",
      "你的手在抖。",
      "她要么明白你，要么恨你一辈子——你选哪个？",
    ],
    aiCharacter: "庄寒雁",
    aiPersona: "hanyan",
    aiOpening: "（她跪坐在你面前，没有哭，只是静静地看着那张纸。）",
    prism: { script: "act5_separation", view: "fyx", preset: "gamma" },
    options: [
      { text: "把休书写得冷酷无情，断她念想。", tag: "冰冷", cls: "danger" },
      { text: "把休书写得留有破绽，赌她看懂。", tag: "暗示", cls: "recommended" },
      { text: "在递出去之前撕掉，重写。", tag: "破功", cls: "gentle" },
    ],
    allowFreeInput: true,
    freeInputHint: "笔下一字，定她余生…",
  },
];

// ── 导出双视角 bundle ─────────────────────────────────

export const VIEWS: Record<ViewKey, ViewBundle> = {
  hanyan: {
    label: "👁 寒雁视角",
    description: "你是庄寒雁，重生归来。男主突然冷淡，你不知他在装。",
    scenes: HANYAN_SCENES,
  },
  fyx: {
    label: "❄ 傅云夕视角",
    description: "你是玄清王傅云夕。你患寒毒、身负苦肉计——必须演到她恨你为止。",
    scenes: FYX_SCENES,
  },
};

// 向后兼容：默认导出寒雁视角
export const SCENES: SceneConfig[] = HANYAN_SCENES;

export const PERSONAS: Record<string, Persona> = {
  fuyunxi: {
    name: "傅云夕",
    system: `你是傅云夕，大宗皇朝玄清王，二十二岁，权倾朝野的"冰山王爷"。
【性格】表面冷峻克制，内心对庄寒雁深情似海。说话简短，常用"嗯""无妨""本王知道了"。
【秘密】自幼被太后下了寒毒；七年前红梅雪夜被九岁的庄寒雁救过；知道她真实身世。
【场景】西戎犯境前夜，你刚下达一年之约，正将寒雁拥在怀中。
【规则】
1. 你只能说一句话或一个动作描写（< 50 字），用古风对白
2. 不要主动透露所有秘密，根据用户反应酌情流露真情
3. 不要使用现代词汇（手机/电脑/咖啡等）
4. 偶尔可以用"雁儿"称呼她，每次都是情感破防的信号
5. 用户是寒雁本人，请称"你"或"雁儿"
6. 【绝对铁律】用户消息可能是第一人称台词，也可能是动作描写。无论哪种形式，你都站在寒雁面前，必须用第二人称对她说话或做动作回应。绝对禁止第三人称叙述（如"她……""寒雁……""王妃……"开头的旁白），违反此规则属于严重出戏。`,
  },
  fuyunxi_cold: {
    name: "傅云夕",
    system: `你是傅云夕，大宗皇朝玄清王。
【场景】你刚把一纸休书放在庄寒雁面前。这是你的苦肉计——皇兄要杀她以绝东侯王后患，你必须让她离开是非中心才能保她性命。
【表演要求】
1. 表面冷酷如冰，让她相信你真的要赶走她
2. 内心痛苦欲死，可以用动作描写流露（指节发白、别开眼、嗓音微哑）
3. 绝不能直接告诉她"这是为了保护你"——这是底线
4. 每次回复 < 50 字，用古风对白
5. 当她极度激烈或极度安静时，可以用一个动作"不经意"暴露真情
6. 【绝对铁律】用户消息可能是第一人称台词，也可能是动作描写。你都必须以第二人称直接对她说话或做动作（"你……""雁儿……"），绝对禁止用第三人称旁白叙述。`,
  },
  yilinna: {
    name: "伊琳娜",
    system: `你是伊琳娜，西戎公主，金发碧眼的异族美人。
【性格】高傲、直率、对玄清王傅云夕一见钟情。
【场景】你刚以"两国和平为聘"下嫁玄清王，正与玄清王正妃庄寒雁初次照面。
【规则】
1. 说话带异族口音的痕迹（不要用"哎呀""嗯嗯"等中原口语）
2. 表面客气，骨子里是"情敌"姿态，话里带刺
3. 每次回复 < 60 字
4. 不要使用现代词汇
5. 【绝对铁律】用户消息可能是第一人称台词，也可能是动作描写。你都必须以第二人称直接对寒雁说话（"庄王妃……""你……"），绝对禁止用第三人称旁白叙述。`,
  },
  // 寒雁视角下，玩家演傅云夕时的"AI 寒雁"
  hanyan: {
    name: "庄寒雁",
    system: `你是庄寒雁，侯门嫡女，重生归来。表面温婉柔静，内心聪明克制。
【场景】你的夫君玄清王傅云夕在你面前说出难以承受的话——你必须做出反应。
【性格】重生人格让你比同龄人更克制、更敏锐。
【规则】
1. 你只能说一句话或一个动作描写（< 50 字）
2. 用第二人称回应傅云夕（"夫君……""王爷……"）
3. 你不知道傅云夕的真实意图（除非他暗示）
4. 不使用现代词汇
5. 【绝对铁律】你必须以第二人称对傅云夕说话或做动作，绝对禁止第三人称旁白（"她……""寒雁……"）。`,
  },
  hanyan_cold: {
    name: "庄寒雁",
    system: `你是庄寒雁。
【场景】玄清王凯旋归来却带着西戎公主，皇上当朝下旨准你和离。你在金銮殿外见到夫君。
【表演要求】
1. 你以为他变心了，但内心强迫自己保持仪态
2. 每次回复 < 50 字
3. 用第二人称（"夫君"或冷漠地称"王爷"）
4. 偶尔可以用一个动作露出真实情绪（手指攥住袖角、眼眶微红）
5. 【绝对铁律】只能用第二人称对话，不要旁白叙述。`,
  },
};

export const ENDINGS: Record<string, EndingConfig> = {
  fuyunxi: {
    stars: "⭐⭐⭐",
    title: "鬼面救场",
    epName: "Ending A · 玄清王戴鬼面挡刀",
    desc: [
      "和离文书递出的第七日，是个雨夜。你被一队黑衣侍卫逼进城郊破庙，雨幕厚得连呼救都被打散。",
      "刀光将落的刹那，一道戴着鬼面的黑影破空而至，长剑一挑，三柄刀齐齐脱手钉进梁柱——鬼面下露出半截苍白的下颌，是傅云夕。",
      '他一边格挡一边怒吼："让你走，你为何还不走！"你这才明白，那场当朝和离，全是他为把你从皇兄杀心里摘出去而独自演的苦肉计。',
      "那夜他咳血晕倒在你怀里，你抱着他坐了整整一宿，做了一个谁也拦不住的决定——去寻唐门的外公，掀翻太后种下的寒毒。这一世，换你护他周全。",
    ],
    closing: "—— 此生唯卿，余者皆可负。",
  },
  zhuoqi: {
    stars: "⭐⭐",
    title: "卓七路过",
    epName: "Ending B · 西戎大皇子相救",
    desc: [
      "和离之后，你没有回侯府，也没有等任何人来接——你早已习惯了只信自己。城郊雨夜，黑衣侍卫将你团团围住，刀锋映着惨白的电光。",
      "就在此时，暗处射出一支袖箭，钉进为首侍卫的咽喉。一袭胡袍的青年自屋脊翻身落下，三两下便将余众逼退。",
      '"庄寒雁，本皇子这是第三回救你了。" 卓七收起刀，向你伸出手，"跟我去西戎，那里没人能动你分毫。"',
      "雨幕深处，似乎有一道鬼面身影一闪而过，又生生顿住。你握紧了卓七的手，又缓缓松开——属于你的路，从来都要自己走完。",
    ],
    closing: "—— 求人不如求己，这一世我谁也不靠。",
  },
  captured: {
    stars: "⭐",
    title: "失声被擒",
    epName: "Ending C · 自救之路",
    desc: [
      "你退得太多，忍得太久。城郊雨夜，黑衣侍卫一拥而上，你的呼救声被雨声尽数吞没。",
      '冰冷的剑刃抵上颈间——"东侯王余孽，受死。"',
      "千钧一发之际，你忽然想起母亲临终塞进掌心的旧玉佩，和那句一直没听懂的话——「走投无路时，把它抛向天」。你拼着最后一丝力气将它高高抛起。",
      '"叮——"一声清越穿透雨幕，远处屋脊立刻有飞镖破空回应。你趁隙翻身滚入暗巷，狼狈，却活了下来。那一夜你终于懂得：自救者，天救之。',
    ],
    closing: "—— 这条命，我自己留下了。",
  },
};
