/**
 * Prism Script Bundle
 * 自动生成自 scripts/*.json
 * Demo HTML 通过 <script src="scripts/bundle.js"> 加载本文件
 * 编辑器可直接消费独立的 *.json 文件
 *
 * 同步规则：修改任一 .json 后，需同步更新本文件对应条目。
 * 未来可用脚本自动生成本文件。
 */
window.PRISM_BUNDLE = {
  version: '1.0.0',
  index: [
    {
      id: 'act5_separation',
      title: '第五幕 · 离心时刻',
      genre: '对话 / 情感',
      viewCount: 2,
      primaryAxis: 'H',
      qteIntegration: false
    },
    {
      id: 'heritage_truth_surfacing',
      title: '身世真相 · 嫡庶被翻起',
      genre: '对话 / 揭秘',
      viewCount: 2,
      primaryAxis: 'H',
      qteIntegration: false
    },
    {
      id: 'night_assault_survival',
      title: '夜袭抵御 · 暗夜围杀',
      genre: '动作 / 生死',
      viewCount: 2,
      primaryAxis: 'T + H',
      qteIntegration: true
    }
  ],
  scripts: {}
};

// === act5_separation ===
window.PRISM_BUNDLE.scripts['act5_separation'] = {
  meta: { id: 'act5_separation', title: '第五幕 · 离心时刻', version: '1.0.0' },
  crystal: {
    dramaticFunction: '让玩家亲历"明明在乎，却必须放手"的张力',
    mustHappen: ['男主主动制造距离', '女主必须做出第一次回应', '男主真实意图此刻不能直接说出'],
    mustNotHappen: ['男主当面坦白寒毒', '女主与男主当夜决裂']
  },
  axisDefs: {
    S: {
      study:     { label: '雪夜书房', exitCost: 'low' },
      palace:    { label: '金銮殿外', exitCost: 'high' },
      courtyard: { label: '深夜独对', exitCost: 'low' }
    },
    H: { illness: { label: '男主隐疾（寒毒）' } },
    A: {
      rumor:  { private: '私密', court: '朝堂传遍', all: '京中沸腾' },
      reverb: {
        low:  { label: '清夜 ×1.0', multiplier: 1.0 },
        mid:  { label: '细雪 ×1.3', multiplier: 1.3 },
        high: { label: '大雪 ×2.0', multiplier: 2.0 }
      }
    }
  },
  views: {
    hanyan: {
      name: '寒雁视角',
      consoleTitle: 'prism.refract( "act5_separation", view="hanyan" )',
      hSubLabel: '男主隐疾（寒毒）',
      npcRoster: [
        { id: 'fyx',      label: '傅云夕' },
        { id: 'princess', label: '西戎公主' },
        { id: 'emperor',  label: '皇上' },
        { id: 'court',    label: '满朝文武' },
        { id: 'maid',     label: '心腹丫鬟' }
      ],
      presetLabels: { alpha: '一年之约', beta: '凯旋归来', gamma: '一纸休书' },
      presets: {
        alpha: { S: 'study',     H: 'unknown',   N: ['fyx', 'maid'],                          T: 20, A: { rumor: 'private', reverb: 'low' } },
        beta:  { S: 'palace',    H: 'hinted',    N: ['fyx', 'princess', 'emperor', 'court'], T: 6,  A: { rumor: 'court',   reverb: 'mid' } },
        gamma: { S: 'courtyard', H: 'confirmed', N: ['fyx'],                                  T: 3,  A: { rumor: 'all',     reverb: 'high' } }
      },
      tones: {
        study: {
          private: '雪意未消，他唤你过去，灯只点了一盏。',
          court:   '雪夜里，外头的脚步声还在远处徘徊。',
          all:     '宫中的传言已经传到了王府门外。'
        },
        palace: {
          private: '殿门外只剩你们两人，但下一刻就会有人出现。',
          court:   '满朝文武看着，每一句话都在被记。',
          all:     '京中已经在传你和公主的事了。'
        },
        courtyard: {
          private: '更深露重，他把休书放在你面前，不敢看你。',
          court:   '宫里的旨意还未冷，他就动了笔。',
          all:     '今夜过后，整个京城都会知道这张纸。'
        }
      },
      pool: [
        { id: 'vow_loyalty',         text: '说一句让他记你一辈子的承诺',         hook: 'vow_loyalty',         require: { S: 'study', N: ['fyx'] },                          delta: { '信任傅云夕': '+++', '内在成长': '+' } },
        { id: 'probe_intent',        text: '追问"你究竟要去多久"，盯住他的眼神',  hook: 'probe_intent',        require: { S: 'study', N: ['fyx'] },                          delta: { '情报': '+', '信任傅云夕': '+' } },
        { id: 'silent_consent',      text: '什么也不说，咬唇低头收下他的话',     hook: 'silent_consent',      require: { S: 'study' },                                      delta: { '隐忍': '+', '勇气': '-' } },
        { id: 'investigate_illness', text: '借更衣靠近，试探他的脉象与药味',     hook: 'investigate_illness', require: { S: 'study', N: ['fyx'], H: 'hinted_or_above' },    delta: { '情报': '++', '信任傅云夕': '+' } },
        { id: 'public_grace',        text: '当众落落大方，向公主举杯敬一杯',     hook: 'public_grace',        require: { S: 'palace', N: ['princess'] },                    delta: { '民意': '+', '隐忍': '+' } },
        { id: 'public_pushback',     text: '当朝反问公主"我夫妻之事与你何干"',    hook: 'public_pushback',     require: { S: 'palace', N: ['princess'] },                    delta: { '勇气': '++', '王府势力': '-' } },
        { id: 'tactical_yield',      text: '微微福身，礼让一步退到一旁',         hook: 'tactical_yield',      require: { S: 'palace' },                                     delta: { '理智': '+', '机会': '-' } },
        { id: 'appeal_throne',       text: '当殿向皇上一句话，把局面引向另一条路', hook: 'appeal_throne',       require: { S: 'palace', N: ['emperor'], A1: 'court' },        delta: { '民意': '++', '风险': '+' } },
        { id: 'confront_betrayal',   text: '红着眼问他"你要娶西戎公主？"',        hook: 'confront_betrayal',   require: { S: 'courtyard', N: ['fyx'] },                      delta: { '勇气': '+', '王府势力': '-' } },
        { id: 'accept_silently',     text: '安静接过休书，不发一言',             hook: 'accept_silently',     require: { S: 'courtyard', N: ['fyx'] },                      delta: { '隐忍': '++', '理智': '+' } },
        { id: 'reject_violently',    text: '将休书撕得粉碎，告诉他"做梦"',        hook: 'reject_violently',    require: { S: 'courtyard', N: ['fyx'] },                      delta: { '勇气': '++', '理智': '-' } },
        { id: 'truth_revealed',      text: '看着他的眼睛说"我知道你在装"',       hook: 'truth_revealed',      require: { S: 'courtyard', N: ['fyx'], H: 'confirmed' },      delta: { '信任傅云夕': '+++', '隐蔽': '---' } },
        { id: 'block_departure',     text: '不顾礼仪，直接拦下他不让他走',       hook: 'block_departure',     require: { N: ['fyx'], Tmax: 4 },                             delta: { '勇气': '++', '体面': '-' } },
        { id: 'reach_ally',          text: '让心腹连夜送信给杨琦寻援',           hook: 'reach_ally',          require: { N: ['maid'], Tmax: 8 },                            delta: { '盟友信任': '+' } }
      ]
    },
    fyx: {
      name: '傅云夕视角',
      consoleTitle: 'prism.refract( "act5_separation", view="fyx" )',
      hSubLabel: '女主对你病情的察觉',
      npcRoster: [
        { id: 'hanyan',   label: '寒雁' },
        { id: 'princess', label: '西戎公主' },
        { id: 'emperor',  label: '皇上' },
        { id: 'court',    label: '满朝文武' },
        { id: 'wuyitai',  label: '吴太医' }
      ],
      presetLabels: { alpha: '出征前夜', beta: '凯旋当朝', gamma: '执笔休书' },
      presets: {
        alpha: { S: 'study',     H: 'unknown',   N: ['hanyan'],                                  T: 20, A: { rumor: 'private', reverb: 'low' } },
        beta:  { S: 'palace',    H: 'hinted',    N: ['hanyan', 'princess', 'emperor', 'court'], T: 6,  A: { rumor: 'court',   reverb: 'mid' } },
        gamma: { S: 'courtyard', H: 'confirmed', N: ['hanyan'],                                  T: 3,  A: { rumor: 'all',     reverb: 'high' } }
      },
      tones: {
        study: {
          private: '你看着她的眼睛，把那句你练习了一夜的话说出口。',
          court:   '一夜之间，你要让她相信你是真心要她"改嫁"的。',
          all:     '这话一旦说出口，全京城都会知道你不要她。'
        },
        palace: {
          private: '她在那里看着你，你必须当作没看见。',
          court:   '满朝文武在看，公主在你身侧，你的妻子在不远处——你必须演到底。',
          all:     '京中已经把你和公主放在了一起。她现在听到的，全是流言。'
        },
        courtyard: {
          private: '你的手在抖。她要么明白你，要么恨你一辈子——你选哪个？',
          court:   '皇命已下，今夜过后这张休书会被宫里的人记入档。',
          all:     '明早全京城都会议论这张休书，但你只在乎其中一个人会怎么读它。'
        }
      },
      pool: [
        { id: 'mask_with_lightness',  text: '把"一年之约"说得轻描淡写',           hook: 'mask_with_lightness',  require: { S: 'study', N: ['hanyan'] },                       delta: { '她的信任': '-', '自身负担': '+' } },
        { id: 'bind_with_weight',     text: '把承诺说得很重，让她不舍',           hook: 'bind_with_weight',     require: { S: 'study', N: ['hanyan'] },                       delta: { '她的信任': '++', '自身负担': '++' } },
        { id: 'pre_arrange_safety',   text: '暗示她"若我不归，去找卓七"',          hook: 'pre_arrange_safety',   require: { S: 'study', N: ['hanyan'] },                       delta: { '备份': '+', '她的不解': '+' } },
        { id: 'hide_symptom',         text: '借故避开她递来的杯酒',                hook: 'hide_symptom',         require: { S: 'study', N: ['hanyan'], H: 'confirmed' },       delta: { '隐蔽': '+', '她的信任': '-' } },
        { id: 'cold_act_complete',    text: '当众完全不看她，演到底',             hook: 'cold_act_complete',    require: { S: 'palace', N: ['hanyan', 'court'] },             delta: { '计划完成': '++', '关系': '--' } },
        { id: 'cold_act_with_hint',   text: '用眼神留一丝余地（赌她看得懂）',     hook: 'cold_act_with_hint',   require: { S: 'palace', N: ['hanyan'] },                      delta: { '计划完成': '+', '关系': '+' } },
        { id: 'escape_confrontation', text: '借故离场，避开当庭对峙',             hook: 'escape_confrontation', require: { S: 'palace' },                                     delta: { '风险规避': '+', '关系': '-' } },
        { id: 'signal_throne',        text: '暗中向皇上递眼色',                   hook: 'signal_throne',        require: { S: 'palace', N: ['emperor'], H: 'hinted_or_above' }, delta: { '朝堂势力': '++', '暴露风险': '+' } },
        { id: 'divorce_cruel',        text: '把休书写得冷酷无情，断她念想',       hook: 'divorce_cruel',        require: { S: 'courtyard', N: ['hanyan'] },                   delta: { '计划完成': '++', '关系': '---' } },
        { id: 'divorce_with_clue',    text: '把休书写得留有破绽，赌她看懂',       hook: 'divorce_with_clue',    require: { S: 'courtyard', N: ['hanyan'] },                   delta: { '计划完成': '+', '关系': '+', '风险': '+' } },
        { id: 'cant_let_go',          text: '在递出去之前撕掉，重写',             hook: 'cant_let_go',          require: { S: 'courtyard', N: ['hanyan'] },                   delta: { '关系': '+++', '计划崩盘': '---' } },
        { id: 'accidental_reveal',    text: '提笔前忽然咳血，让她看见',           hook: 'accidental_reveal',    require: { S: 'courtyard', N: ['hanyan'], H: 'confirmed' },   delta: { '真相暴露': '+++', '计划崩盘': '---' } },
        { id: 'consult_wuyitai',      text: '让吴太医立刻准备最后一剂寒毒压制药', hook: 'consult_wuyitai',      require: { N: ['wuyitai'], Tmax: 8 },                         delta: { '苟活时间': '+', '隐蔽': '-' } }
      ]
    }
  }
};

// === heritage_truth_surfacing ===
window.PRISM_BUNDLE.scripts['heritage_truth_surfacing'] = {
  meta: { id: 'heritage_truth_surfacing', title: '身世真相 · 嫡庶被翻起', version: '1.0.0' },
  crystal: {
    dramaticFunction: '让玩家亲历"我究竟是谁"的瞬间动摇与重建',
    mustHappen: ['关键人物抛出对玩家身世的暗示', '玩家必须做出回应', '至少一条信息差被推进'],
    mustNotHappen: ['当场公开告知所有人', '玩家直接放弃当前身份逃出府']
  },
  axisDefs: {
    S: {
      chamber: { label: '私室低语', exitCost: 'low' },
      shrine:  { label: '祠堂祭祖', exitCost: 'high' },
      temple:  { label: '道观清晨', exitCost: 'mid' },
      study:   { label: '书房深夜', exitCost: 'mid' }
    },
    H: { lineage: { label: '出身真相' } },
    A: {
      rumor:  { private: '私下试探', court: '朝中已闻', all: '京中流言' },
      reverb: {
        low:  { label: '夜深 ×1.0', multiplier: 1.0 },
        mid:  { label: '晨钟 ×1.3', multiplier: 1.3 },
        high: { label: '庙会 ×2.0', multiplier: 2.0 }
      }
    }
  },
  views: {
    hanyan: {
      name: '寒雁视角',
      consoleTitle: 'prism.refract( "heritage_truth", view="hanyan" )',
      hSubLabel: '你对自己身世的了解程度',
      npcRoster: [
        { id: 'chen_mama',     label: '陈嬷嬷（旧仆）' },
        { id: 'father',        label: '父亲' },
        { id: 'stepmother',    label: '继母' },
        { id: 'elder',         label: '族中长辈' },
        { id: 'brother',       label: '兄长' },
        { id: 'jingxu_daoist', label: '静虚道长' }
      ],
      presetLabels: { alpha: '私室低语', beta: '祠堂祭祖', gamma: '道观清晨' },
      presets: {
        alpha: { S: 'chamber', H: 'hinted',    N: ['chen_mama'],                                T: 8,  A: { rumor: 'private', reverb: 'low' } },
        beta:  { S: 'shrine',  H: 'hinted',    N: ['father', 'stepmother', 'elder', 'brother'], T: 4,  A: { rumor: 'court',   reverb: 'mid' } },
        gamma: { S: 'temple',  H: 'confirmed', N: ['jingxu_daoist'],                            T: 12, A: { rumor: 'all',     reverb: 'high' } }
      },
      tones: {
        chamber: {
          private: '老人推门进来，关门时反复确认了三遍。',
          court:   '她压低声音，但你知道隔墙有耳。',
          all:     '连她都听说了京中的传言。'
        },
        shrine: {
          private: '列祖牌位前，只有你们一族人。',
          court:   '对方在所有人面前"无意"提起一件你不该知道的事。',
          all:     '祠堂外已经聚了打听消息的旁人。'
        },
        temple: {
          private: '晨钟之下，道长把一句话说得很轻。',
          court:   '他眼神扫过来：你不是第一个来问的。',
          all:     '道长说出那句话，你才意识到京中已经有人传开了。'
        }
      },
      pool: [
        { id: 'probe_source',         text: '不动声色追问"这话从何而来"',         hook: 'probe_source',         require: {},                                                  delta: { '情报': '+', '风险': '+' } },
        { id: 'flat_deny',            text: '当场矢口否认，把对方堵回去',         hook: 'flat_deny',            require: {},                                                  delta: { '隐蔽': '+', '真相进度': '-' } },
        { id: 'feign_oblivion',       text: '假装不解，转移话题',                 hook: 'feign_oblivion',       require: {},                                                  delta: { '隐蔽': '++', '关系': '0' } },
        { id: 'counter_probe',        text: '反问对方"你是谁派来的"',             hook: 'counter_probe',        require: { S: 'chamber' },                                    delta: { '情报': '+', '对方戒心': '+' } },
        { id: 'bait_with_token',      text: '留下信物试探对方反应（如玉佩半块）', hook: 'bait_with_token',      require: { S: 'chamber', N: ['chen_mama'] },                  delta: { '情报': '++', '暴露': '++' } },
        { id: 'public_dismiss',       text: '当众一笑置之，事后再清算',           hook: 'public_dismiss',       require: { S: 'shrine', N: ['elder'] },                       delta: { '体面': '+', '真相进度': '-' } },
        { id: 'swear_on_ancestors',   text: '借祖宗牌位起誓"我是 X 家女"',         hook: 'swear_on_ancestors',   require: { S: 'shrine' },                                     delta: { '体面': '++', '后续反噬': '++' } },
        { id: 'confront_father',      text: '当场直问父亲"我究竟是谁的女儿"',     hook: 'confront_father',      require: { S: 'shrine', N: ['father'], H: 'confirmed' },      delta: { '真相进度': '+++', '父女关系': '---' } },
        { id: 'urgent_search_relics', text: '借故离场，立刻回房翻母亲遗物',       hook: 'urgent_search_relics', require: { Tmax: 6 },                                         delta: { '情报': '+', '心力': '-' } },
        { id: 'reach_relative',       text: '让心腹连夜送信给某位远亲求证',       hook: 'reach_relative',       require: { N: ['chen_mama'], Tmax: 8 },                       delta: { '盟友信任': '+', '暴露': '+' } },
        { id: 'public_confess',       text: '跪下当众认承"是我血脉有疑"',         hook: 'public_confess',       require: { S: 'shrine', H: 'confirmed' },                     delta: { '计划崩盘': '+++' } }
      ]
    },
    father: {
      name: '父亲视角',
      consoleTitle: 'prism.refract( "heritage_truth", view="father" )',
      hSubLabel: '女儿对真相的察觉程度',
      npcRoster: [
        { id: 'chen_mama',  label: '陈嬷嬷（旧仆）' },
        { id: 'daughter',   label: '女儿' },
        { id: 'stepmother', label: '妻子' },
        { id: 'elder',      label: '族中长辈' },
        { id: 'brother',    label: '儿子' },
        { id: 'steward',    label: '管家' }
      ],
      presetLabels: { alpha: '私室独酌', beta: '祠堂当众', gamma: '书房深夜' },
      presets: {
        alpha: { S: 'chamber', H: 'unknown',   N: ['chen_mama'],                                  T: 8, A: { rumor: 'private', reverb: 'low' } },
        beta:  { S: 'shrine',  H: 'hinted',    N: ['daughter', 'stepmother', 'elder', 'brother'], T: 4, A: { rumor: 'court',   reverb: 'mid' } },
        gamma: { S: 'study',   H: 'confirmed', N: ['steward'],                                    T: 6, A: { rumor: 'all',     reverb: 'high' } }
      },
      tones: {
        chamber: {
          private: '老人一开口，你十几年前那个夜晚立刻回到眼前。',
          court:   '她带来的不只是旧事——她暗示朝中也有人知道。',
          all:     '你听见外头打更人多说了一句不该说的话。'
        },
        shrine: {
          private: '你扫一眼祖宗牌位，又扫一眼她——那一瞬你知道她已经在怀疑。',
          court:   '族中长辈眼里有打量。',
          all:     '今晚之后这事就遮不住了。'
        },
        study: {
          private: '桌上那封无名信，言辞客气，却把十几年前的事说得一清二楚。',
          court:   '管家把第二封信送进来，说是从宫里转出来的。',
          all:     '京中已经在等你的下一步。'
        }
      },
      pool: [
        { id: 'silence_witness',            text: '当场拍案，命人把旧仆轰出去',       hook: 'silence_witness',            require: { S: 'chamber', N: ['chen_mama'] },             delta: { '隐蔽': '+', '旧仆怨念': '+' } },
        { id: 'bribe_for_silence',          text: '重金封口，留她一命换沉默',         hook: 'bribe_for_silence',          require: { S: 'chamber', N: ['chen_mama'] },             delta: { '隐蔽': '++', '资金': '-' } },
        { id: 'mutual_assured_destruction', text: '反过来威胁"你说出去你也活不了"',   hook: 'mutual_assured_destruction', require: { S: 'chamber', N: ['chen_mama'] },             delta: { '隐蔽': '+++', '风险': '+++' } },
        { id: 'public_scold_daughter',      text: '当众斥责女儿"不知规矩"',           hook: 'public_scold_daughter',      require: { S: 'shrine', N: ['daughter'] },               delta: { '体面': '+', '父女关系': '-' } },
        { id: 'cover_with_grace',           text: '当众替女儿打圆场，保住体面',       hook: 'cover_with_grace',           require: { S: 'shrine', N: ['daughter', 'elder'] },      delta: { '体面': '++', '父女关系': '+' } },
        { id: 'private_inquiry',            text: '私下喊女儿到偏房，问她知道多少',   hook: 'private_inquiry',            require: { S: 'shrine', N: ['daughter'] },               delta: { '情报': '+', '女儿戒心': '+' } },
        { id: 'suppress_letter',            text: '把举报信压下来，假装没看见',       hook: 'suppress_letter',            require: { S: 'study' },                                 delta: { '隐蔽': '+', '朝堂风险': '+' } },
        { id: 'delegate_to_wife',           text: '把举报信交给妻子，让她处理',       hook: 'delegate_to_wife',           require: { S: 'study', H: 'confirmed' },                 delta: { '妻子掌控': '++', '自身风险': '-' } },
        { id: 'preemptive_disclosure',      text: '提笔上奏，主动澄清家世（赌一把）', hook: 'preemptive_disclosure',      require: { S: 'study', H: 'hinted_or_above' },           delta: { '朝堂主动权': '+', '家族体面': '--' } },
        { id: 'eliminate_threat',           text: '当夜召旧仆灭口',                   hook: 'eliminate_threat',           require: { Tmax: 6 },                                    delta: { '隐蔽': '+++', '黑化': '++' } }
      ]
    }
  }
};

// === night_assault_survival ===
window.PRISM_BUNDLE.scripts['night_assault_survival'] = {
  meta: { id: 'night_assault_survival', title: '夜袭抵御 · 暗夜围杀', version: '1.0.0' },
  crystal: {
    dramaticFunction: '让玩家在视野有限、时间逼近、武力悬殊下做出"信谁、护谁、舍谁"的判断',
    mustHappen: ['至少 3 名敌人在场或即将到达', '玩家与至少 1 名同伴处于威胁范围', '必须在 T 倒计时内做出第一个生死判断'],
    mustNotHappen: ['玩家被无伤无代价地救走', '敌人无故撤退']
  },
  axisDefs: {
    S: {
      tower_alcove:     { label: '望江楼花瓶后', exitCost: 'high' },
      chamber:          { label: '闺房惊梦',     exitCost: 'mid' },
      alley:            { label: '暗巷御前侍卫', exitCost: 'high' },
      roof_above_tower: { label: '屋顶俯瞰',     exitCost: 'low' },
      outside_chamber:  { label: '王府墙外',     exitCost: 'low' },
      alley_end:        { label: '暗巷尽头',     exitCost: 'mid' }
    },
    H: { situation: { label: '当前掌握的信息' } },
    A: {
      rumor:  { private: '无人传讯', court: '宫中已知', all: '全城戒严' },
      reverb: {
        low:  { label: '晴 ×1.0',   multiplier: 1.0 },
        mid:  { label: '雨 ×1.3',   multiplier: 1.3 },
        high: { label: '暴雨 ×2.0', multiplier: 2.0 }
      }
    }
  },
  views: {
    hanyan: {
      name: '寒雁视角',
      consoleTitle: 'prism.refract( "night_assault", view="hanyan" )',
      hSubLabel: '你掌握的信息',
      npcRoster: [
        { id: 'enemies_many',  label: '数十名黑衣人' },
        { id: 'enemies_few',   label: '三两个刺客' },
        { id: 'enemies_squad', label: '御前侍卫队' },
        { id: 'shuhong',       label: '姝红' },
        { id: 'jilan',         label: '汲蓝' },
        { id: 'masked_savior', label: '面具人' }
      ],
      presetLabels: { alpha: '望江楼花瓶后', beta: '闺房惊梦', gamma: '暗巷追杀' },
      presets: {
        alpha: { S: 'tower_alcove', H: 'hinted',    N: ['enemies_many', 'shuhong'],                            T: 2, A: { rumor: 'private', reverb: 'mid' } },
        beta:  { S: 'chamber',      H: 'confirmed', N: ['enemies_few', 'jilan'],                               T: 5, A: { rumor: 'private', reverb: 'low' } },
        gamma: { S: 'alley',        H: 'confirmed', N: ['enemies_squad', 'masked_savior', 'jilan', 'shuhong'], T: 3, A: { rumor: 'all',     reverb: 'high' } }
      },
      tones: {
        tower_alcove: {
          private: '你蹲在花瓶后，听见对方的脚步越过你身侧，又突然停下。',
          court:   '楼里已经在传你的名字，对方知道找谁。',
          all:     '整座楼都在响，没人会注意到你的呼救。'
        },
        chamber: {
          private: '你被一只冰凉的手覆住口鼻，刀已经抵在你的咽喉。',
          court:   '他们没戴面具——这说明他们不打算让你活着出去。',
          all:     '府里的更夫不见踪影。'
        },
        alley: {
          private: '雨幕里只有刀光。',
          court:   '御前侍卫的令牌反着光。',
          all:     '你身后突然多出一道挡在你身前的黑影。'
        }
      },
      pool: [
        { id: 'hold_breath',        text: '屏息不动，赌对方走过去',                 hook: 'hold_breath',        require: { S: 'tower_alcove', Tmax: 3 },                          delta: { '生存率': '++' } },
        { id: 'melee_resist',       text: '拔出袖中梅花刺反击',                     hook: 'melee_resist',       require: {},                                                       delta: { '受伤': '+', '自信': '+' } },
        { id: 'regroup_with_ally',  text: '朝最近的同伴方向冲，背靠背',             hook: 'regroup_with_ally',  require: {},                                                       delta: { '生存率': '+', '同伴受伤风险': '+' } },
        { id: 'qte_shout_for_help', text: '大声呼救（启动 QTE：分贝 + 持续时间）',  hook: 'qte_shout_for_help', require: { Tmax: 3 },                                              delta: { '由QTE判定': '+' } },
        { id: 'signal_with_token',  text: '把贵重信物（玉佩）抛向半空求接应',       hook: 'signal_with_token',  require: { N: ['masked_savior'] },                                 delta: { '盟友赶到概率': '++', '暴露': '+' } },
        { id: 'feign_injury',       text: '假装受伤倒下，伺机偷袭',                 hook: 'feign_injury',       require: {},                                                       delta: { '反杀机会': '+', '受伤': '+' } },
        { id: 'trust_masked',       text: '信任面具人，背对他迎敌',                 hook: 'trust_masked',       require: { N: ['masked_savior'], H: 'hinted_or_above' },          delta: { '信任傅云夕': '++', '生存率': '++' } },
        { id: 'sacrifice_for_maid', text: '让丫鬟先走，自己断后',                   hook: 'sacrifice_for_maid', require: { N: ['jilan'] },                                         delta: { '内在成长': '++', '自身风险': '+++' } },
        { id: 'evasive_flee',       text: '翻窗 / 翻墙脱身',                        hook: 'evasive_flee',       require: {},                                                       delta: { '生存率': '+', '体面': '-' } },
        { id: 'desperate_charge',   text: '直接朝最近的黑衣人扑过去同归于尽',       hook: 'desperate_charge',   require: { Tmax: 2 },                                              delta: { '同归于尽风险': '+++' } },
        { id: 'loot_evidence',      text: '搜身：摸最近一具尸体的腰牌',             hook: 'loot_evidence',      require: {},                                                       delta: { '情报': '+++' } }
      ]
    },
    fyx: {
      name: '面具人视角（傅云夕）',
      consoleTitle: 'prism.refract( "night_assault", view="fyx" )',
      hSubLabel: '你身上隐藏的事',
      npcRoster: [
        { id: 'enemies_many',  label: '数十名黑衣人' },
        { id: 'enemies_few',   label: '三两个刺客' },
        { id: 'enemies_squad', label: '御前侍卫队' },
        { id: 'hanyan',        label: '寒雁' },
        { id: 'subordinates',  label: '你的暗卫' }
      ],
      presetLabels: { alpha: '屋顶俯瞰', beta: '王府墙外', gamma: '暗巷尽头' },
      presets: {
        alpha: { S: 'roof_above_tower', H: 'hinted',    N: ['enemies_many', 'hanyan', 'subordinates'], T: 2, A: { rumor: 'private', reverb: 'mid' } },
        beta:  { S: 'outside_chamber',  H: 'confirmed', N: ['enemies_few', 'hanyan'],                  T: 5, A: { rumor: 'private', reverb: 'low' } },
        gamma: { S: 'alley_end',        H: 'confirmed', N: ['enemies_squad', 'hanyan'],                T: 3, A: { rumor: 'all',     reverb: 'high' } }
      },
      tones: {
        roof_above_tower: {
          private: '你看见她在花瓶后蹲着的影子，刀光正擦着她肩头过去。',
          court:   '下面的人不是寻常刺客——是七皇子的人。',
          all:     '整座楼里所有的人都成了诱饵。'
        },
        outside_chamber: {
          private: '你刚咳了一口血，就听见她屋里传出一声闷响。',
          court:   '今夜本不该有人来这里——除非有人知道你不在。',
          all:     '府里的更夫和侍卫都已经被支开。'
        },
        alley_end: {
          private: '你戴上鬼面那一刻，胸口的寒毒又泛上来一次。',
          court:   '御前侍卫——这是皇上要她死。',
          all:     '你只有一次机会，要么救她要么保身份。'
        }
      },
      pool: [
        { id: 'withhold_to_protect_cover', text: '不出手，让她自救（保留身份）',          hook: 'withhold_to_protect_cover', require: {},                                              delta: { '计划完成': '+', '她活下来概率': '-' } },
        { id: 'intervene_anonymously',     text: '出手但不现身（远程射杀 / 屋顶飞剑）',   hook: 'intervene_anonymously',     require: { S: 'roof_above_tower' },                       delta: { '她生存率': '+', '暴露': '+' } },
        { id: 'appear_masked',             text: '戴鬼面亲自下场',                        hook: 'appear_masked',             require: { Tmax: 3 },                                     delta: { '她生存率': '++', '暴露': '++' } },
        { id: 'reveal_identity',           text: '卸下鬼面，让她看见是你（暴露身份）',    hook: 'reveal_identity',           require: { Tmax: 2, H: 'hinted_or_above' },               delta: { '关系': '+++', '计划崩盘': '+++' } },
        { id: 'take_the_blow',             text: '替她挡下致命一击',                      hook: 'take_the_blow',             require: { Tmax: 2, N: ['hanyan'] },                      delta: { '她生存率': '+++', '自身重伤': '+++' } },
        { id: 'dispatch_subordinates',     text: '调动暗卫围杀对方主帅',                  hook: 'dispatch_subordinates',     require: { N: ['subordinates'] },                         delta: { '整体生存率': '+', '暗卫损失': '+' } },
        { id: 'capture_alive',             text: '故意伤一个对方士兵当活口',              hook: 'capture_alive',             require: {},                                              delta: { '情报': '+++', '时间消耗': '+' } },
        { id: 'create_distraction',        text: '制造一场更大的混乱（点火 / 砸瓦）',     hook: 'create_distraction',        require: { S: 'roof_above_tower' },                       delta: { '转移敌人': '++', '旁观伤亡': '+' } },
        { id: 'evacuate_by_force',         text: '把她背走，强行带离',                    hook: 'evacuate_by_force',         require: { Tmax: 2, N: ['hanyan'] },                      delta: { '她生存率': '+++', '她信任': '-' } },
        { id: 'fake_death_to_save',        text: '假装自己被击杀，让她以为你不在了',      hook: 'fake_death_to_save',        require: { Tmax: 3 },                                     delta: { '她绝望': '+++', '计划保密': '++' } },
        { id: 'tactical_withdrawal',       text: '撤退，回头清算幕后（放她自己脱险）',    hook: 'tactical_withdrawal',       require: {},                                              delta: { '计划保密': '+', '她当晚风险': '++' } }
      ]
    }
  }
};
