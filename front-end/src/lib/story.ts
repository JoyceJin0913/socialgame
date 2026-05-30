/**
 * STORY 配置 · 第五幕三场 + Persona prompts + QTE 配置 + 结局
 * 从 dist/play/index.html 的 STORY 与 PERSONAS 对象迁移而来
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
}

export const SCENES: SceneConfig[] = [
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
};

export const ENDINGS: Record<string, EndingConfig> = {
  fuyunxi: {
    stars: "⭐⭐⭐",
    title: "鬼面救场",
    epName: "Ending A · 玄清王戴鬼面挡刀",
    desc: [
      "雨幕里一道戴着鬼面的黑影破空而至，长剑挑飞三柄刀。",
      "鬼面下露出半截下颌——是傅云夕。",
      '他一边格挡一边怒吼："让你走，你为何还不走！"',
      '你哭着扑进他怀里："傅云夕，你这个混蛋——你病得这么重，还来救我！"',
      "那夜他咳血晕倒在你怀里，你抱着他坐了一整夜，做了一个决定：去找卓七，去找唐门外公，无论如何要解他的寒毒。",
    ],
  },
  zhuoqi: {
    stars: "⭐⭐",
    title: "卓七路过",
    epName: "Ending B · 西戎大皇子相救",
    desc: [
      "黑夜中突然射出一支袖箭，钉在为首侍卫的喉间。",
      "一袭胡袍的青年从屋顶翻下，长刀寒光凛冽。",
      '"庄寒雁，本皇子第三次救你了。" 卓七笑得轻佻，眼底却是认真。',
      '"跟我去西戎。" 他伸手向你。',
      '你犹豫了——傅云夕戴着鬼面在远处注视着你，他不能现身，因为他已经"和离"。',
      "雨夜中，你做出了选择…",
    ],
  },
  captured: {
    stars: "⭐",
    title: "失声被擒",
    epName: "Ending C · 自救之路",
    desc: [
      "你的呼救声被雨声盖住，黑衣侍卫一拥而上。",
      '冰冷的剑刃抵在颈间——"东侯王余孽，受死。"',
      "千钧一发之际，记忆深处闪过母亲临终时塞给你的玉佩。",
      "玉佩里藏着唐门接应暗号——你拼着最后一丝力气，将玉佩抛向半空。",
      '"叮——" 一声清越，远处传来唐门弟子的飞镖回应。',
      "你终于明白，自救者，方能他救。这一夜，你独自踏上了寻外公之路。",
    ],
  },
};
