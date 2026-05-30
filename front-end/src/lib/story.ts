/**
 * STORY 配置 · 第五幕三场 + Persona prompts + QTE 配置 + 结局
 * 支持多视角：hanyan（寒雁视角，默认） · fyx（傅云夕视角）
 */

import type { Persona } from "./chat";

export interface SceneOption {
  text: string;
  tag: string;
  cls?: "" | "recommended" | "danger" | "gentle";
  hook?: string;
  id?: string;
  delta?: Record<string, string>;
}

export interface DialogueBeat {
  id: string;
  label: string;
  options: SceneOption[];
}

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
  dialogueBeats?: DialogueBeat[];
  options?: SceneOption[];
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
    dialogueBeats: [
      {
        id: "probe",
        label: "试探",
        options: [
          { text: "问他为何忽然说起改嫁，盯住他的眼睛不放。", tag: "追问", cls: "recommended", hook: "probe_intent" },
          { text: "借整理披风靠近，悄悄试他掌心是不是发冷。", tag: "暗察", hook: "investigate_illness" },
          { text: "低头应一声好，把所有不安先压进袖中。", tag: "隐忍", cls: "gentle", hook: "silent_consent" },
        ],
      },
      {
        id: "pressure",
        label: "逼近",
        options: [
          { text: "告诉他别拿改嫁试你，你要的是他活着回来。", tag: "坚定", cls: "recommended", hook: "vow_loyalty" },
          { text: "提出立刻给杨琦递信，替他预备一条暗线退路。", tag: "外援", hook: "reach_ally" },
          { text: "故作轻松地笑他多虑，却把他的每句话都记下。", tag: "克制", cls: "gentle", hook: "tactical_yield" },
        ],
      },
      {
        id: "decision",
        label: "抉择",
        options: [
          { text: "抓住他的袖口，要他当着你的面立下归期。", tag: "不放", cls: "recommended", hook: "block_departure" },
          { text: "看穿他的躲闪，直接问他是不是有事瞒你。", tag: "看破", cls: "recommended", hook: "truth_revealed" },
          { text: "答应等一年，但转身便安排心腹暗中随军。", tag: "自谋", hook: "reach_ally" },
        ],
      },
    ],
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
    dialogueBeats: [
      {
        id: "probe",
        label: "试探",
        options: [
          { text: "举杯称谢公主远来，话锋却轻轻落在正妃名分上。", tag: "体面", cls: "recommended", hook: "public_grace" },
          { text: "当众问她，西戎国书何时能管到大宗王府家事。", tag: "反击", cls: "danger", hook: "public_pushback" },
          { text: "退半步让她先说，借沉默看清殿前每个人的脸色。", tag: "观察", cls: "gentle", hook: "tactical_yield" },
        ],
      },
      {
        id: "pressure",
        label: "逼近",
        options: [
          { text: "转向皇上陈情，要求把和离缘由写得明明白白。", tag: "殿前", cls: "danger", hook: "appeal_throne" },
          { text: "越过公主看向傅云夕，问他是否也认这道旨意。", tag: "质问", cls: "recommended", hook: "confront_betrayal" },
          { text: "暗示身边侍女去递消息，先把宫外退路铺好。", tag: "外援", hook: "reach_ally" },
        ],
      },
      {
        id: "decision",
        label: "抉择",
        options: [
          { text: "笑着接下圣意，却把这场羞辱记成日后的证词。", tag: "隐忍", cls: "gentle", hook: "tactical_yield" },
          { text: "当殿表明王妃之位不是西戎一句话就能换走。", tag: "硬刚", cls: "danger", hook: "public_pushback" },
          { text: "看见傅云夕袖中攥紧的手，怀疑这场戏另有隐情。", tag: "看破", cls: "recommended", hook: "truth_revealed" },
        ],
      },
    ],
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
    dialogueBeats: [
      {
        id: "probe",
        label: "试探",
        options: [
          { text: "问他这纸休书，是他本意，还是有人逼他。", tag: "追问", cls: "recommended", hook: "probe_intent" },
          { text: "安静把休书拿起，先看落款与印信有没有破绽。", tag: "冷静", cls: "gentle", hook: "accept_silently" },
          { text: "盯住他发白的指节，问他是不是又在强撑。", tag: "暗察", hook: "investigate_illness" },
        ],
      },
      {
        id: "pressure",
        label: "逼近",
        options: [
          { text: "挡在门前不让他走，逼他把话一次说完。", tag: "不放", cls: "recommended", hook: "block_departure" },
          { text: "把休书按回桌上，告诉他你不认这场荒唐。", tag: "反抗", cls: "danger", hook: "reject_violently" },
          { text: "忍住眼泪，先问自己还能调动哪些人手。", tag: "自救", hook: "reach_ally" },
        ],
      },
      {
        id: "decision",
        label: "抉择",
        options: [
          { text: "说出你已看穿他的冷脸，除非他说真话，否则不走。", tag: "看破", cls: "recommended", hook: "truth_revealed" },
          { text: "收下休书转身离开，把余生握回自己手里。", tag: "自立", hook: "reach_ally" },
          { text: "当着他的面撕碎休书，宁愿同死也不做弃妇。", tag: "决绝", cls: "danger", hook: "reject_violently" },
        ],
      },
    ],
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
    dialogueBeats: [
      {
        id: "probe",
        label: "试探",
        options: [
          { text: "把一年之约说得轻描淡写，先试她会不会追问。", tag: "试探", hook: "mask_with_lightness" },
          { text: "避开她伸来的手，不让她摸到你掌心寒意。", tag: "藏疾", cls: "gentle", hook: "hide_symptom" },
          { text: "抱住她许久，才低声说你必须走这一趟。", tag: "深情", cls: "recommended", hook: "bind_with_weight" },
        ],
      },
      {
        id: "pressure",
        label: "逼近",
        options: [
          { text: "把暗卫和银票去处提前交代好，却不说原因。", tag: "退路", hook: "pre_arrange_safety" },
          { text: "寒毒忽然上涌，你险些在她面前咳出血。", tag: "破绽", cls: "recommended", hook: "accidental_reveal" },
          { text: "故意把话说冷，让她以为你早已想好分离。", tag: "冷演", cls: "danger", hook: "mask_with_lightness" },
        ],
      },
      {
        id: "decision",
        label: "抉择",
        options: [
          { text: "郑重许诺归期，不许她把自己许给旁人。", tag: "重诺", cls: "recommended", hook: "bind_with_weight" },
          { text: "转身出门前压住寒毒，把所有痛意都吞下。", tag: "隐忍", cls: "gentle", hook: "hide_symptom" },
          { text: "决定先去无医台求药，哪怕只换一年命。", tag: "自救", hook: "consult_wuyitai" },
        ],
      },
    ],
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
    dialogueBeats: [
      {
        id: "probe",
        label: "试探",
        options: [
          { text: "从她身旁经过时不看她，把冷面演到极致。", tag: "冷演", cls: "danger", hook: "cold_act_complete" },
          { text: "只在转身一瞬看她一眼，留下极轻的破绽。", tag: "破绽", cls: "recommended", hook: "cold_act_with_hint" },
          { text: "借向皇兄复命离开，先避开她的当庭质问。", tag: "退避", cls: "gentle", hook: "escape_confrontation" },
        ],
      },
      {
        id: "pressure",
        label: "逼近",
        options: [
          { text: "递眼给皇兄，让他把后续退路照计划推进。", tag: "布局", hook: "signal_throne" },
          { text: "暗中吩咐暗卫护住她出宫，不准惊动任何人。", tag: "护送", cls: "recommended", hook: "pre_arrange_safety" },
          { text: "当着伊琳娜的面承认和离，把刀插得更深。", tag: "狠心", cls: "danger", hook: "cold_act_complete" },
        ],
      },
      {
        id: "decision",
        label: "抉择",
        options: [
          { text: "故意留下只有她看得懂的旧年暗号。", tag: "暗示", cls: "recommended", hook: "cold_act_with_hint" },
          { text: "彻底退场，不给她抓住你破绽的机会。", tag: "断念", cls: "gentle", hook: "escape_confrontation" },
          { text: "寒毒发作踉跄半步，险些在她面前露馅。", tag: "露真", cls: "recommended", hook: "accidental_reveal" },
        ],
      },
    ],
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
    dialogueBeats: [
      {
        id: "probe",
        label: "试探",
        options: [
          { text: "落笔写下最冷的第一句，逼自己别抬头。", tag: "冰冷", cls: "danger", hook: "divorce_cruel" },
          { text: "在休书措辞里留一个只有她能察觉的破绽。", tag: "暗示", cls: "recommended", hook: "divorce_with_clue" },
          { text: "笔尖停住，差点把整张纸当场撕毁。", tag: "破功", cls: "gentle", hook: "cant_let_go" },
        ],
      },
      {
        id: "pressure",
        label: "逼近",
        options: [
          { text: "把她出府后的护卫路线写进暗令，提前送出。", tag: "退路", hook: "pre_arrange_safety" },
          { text: "按住胸口的寒意，不让血腥味被她闻见。", tag: "藏疾", cls: "gentle", hook: "hide_symptom" },
          { text: "说出更狠的话，让她相信你真的不要她了。", tag: "断念", cls: "danger", hook: "divorce_cruel" },
        ],
      },
      {
        id: "decision",
        label: "抉择",
        options: [
          { text: "终于咳出血来，真相在她眼前藏不住了。", tag: "露真", cls: "recommended", hook: "accidental_reveal" },
          { text: "把休书折法改成旧年暗号，赌她能看懂。", tag: "留隙", cls: "recommended", hook: "divorce_with_clue" },
          { text: "递出前一刻撕碎休书，承认你根本放不了手。", tag: "破功", cls: "gentle", hook: "cant_let_go" },
        ],
      },
    ],
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
