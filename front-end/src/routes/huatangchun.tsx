import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Share2, Bookmark, ChevronDown, Sparkles, Users, Clock, X } from "lucide-react";
import heroImg from "@/assets/hero-huatangchun.jpg";
import { PLAYABLE_CHARACTERS } from "@/lib/characters";
import { PhoneMockup } from "@/components/PhoneMockup";

export const Route = createFileRoute("/huatangchun")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "重生之贵女难求 · 第五章 初次交锋" },
      { name: "description", content: "长篇故事《重生之贵女难求》互动剧本杀，自由代入任意角色，AI 实时改编剧情。" },
    ],
  }),
});

const STORY_CHAPTERS = [
  { title: "第 1 幕：洞房毒酒，凤凰重生", body: "红烛洞房，等来的是庶姐庄语山一杯鸩酒。再睁眼，已是十二岁那年。她不再哭，溜出府寻武师、拜状元、宫宴上一句话刺得继母脸色发青。白衣男子在人群外，记下了她的名字。" },
  { title: "第 2 幕：宫闱博弈，反败为胜", body: "雪落梅园，玄清王傅云夕第一次正面照面。宫宴上李佳棋抚琴争艳、表哥动手相逼，她一手左手题字反败为胜。回府却撞上教习姑姑明责暗挑、媚姨娘喝下假怀胎药。两头开弓，谁也没占着便宜。" },
  { title: "第 3 幕：山寺劫难，朝堂下聘", body: "山崖边黑衣人逼近，两片树叶破风而至。卫如风提亲被拒，她当众放话：「我的夫君，一辈子只能娶我一人。」金銮殿上，傅云夕负手而立：「本王以整个玄清王府为聘。」祠堂里他踏月而来，一只蓝玉鱼簪插进她发间。" },
  { title: "第 4 幕：春毒祭刀，救驾立功", body: "陈贵妃寿宴的清酒里掺着春毒，太后命她当众验身坐实「祸乱后宫」。七皇子事败，反手毒杀亲母灭口。春祭血光骤起，她梅花刺扎进马屁股逃命，傅云夕的剑从斜刺里劈开乱刀，把她拢进怀里。" },
  { title: "第 5 幕：凯旋别离，迷雾渐显", body: "她回庄府讨债，一局反将——周氏入狱、大周氏游街疯死、七皇子禁足。傅云夕却突然出征，归来时身侧挽着西戎公主伊琳娜。绿眼皇子卓七把蓝玉鱼簪掷进湖里。她淡然搬出王府，唐门「小乔」的名字浮出水面。" },
  { title: "第 6 幕：身世大白，一网打尽", body: "暗巷长剑挑开乱刀，傅云夕的真实身世剥开——东侯王与唐门小乔之子，金枝玉叶却被偷换一生。他诈死引蛇出洞，金銮殿上七皇子逼宫，「死人」提剑而归。卫王九族尽诛，太后伏法。他终于把那个钻狗洞的小丫头，正正经经娶回了家。" },
];

function HuatangChun() {
  const navigate = useNavigate();
  const [active, setActive] = useState(1);
  const [openChapter, setOpenChapter] = useState(4);
  const [showWorld, setShowWorld] = useState(false);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const centerCard = (i: number, smooth = true) => {
    const track = trackRef.current;
    const card = cardRefs.current[i];
    if (!track || !card) return;
    const left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    centerCard(active, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync active card with scroll position (debounced — only after the user stops swiping)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let nearest = 0;
        let min = Infinity;
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const c = card.offsetLeft + card.clientWidth / 2;
          const d = Math.abs(c - center);
          if (d < min) { min = d; nearest = i; }
        });
        setActive((prev) => (prev === nearest ? prev : nearest));
      }, 140);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const setActiveSafe = (i: number) => {
    const idx = Math.max(0, Math.min(CHARACTERS.length - 1, i));
    setActive(idx);
    centerCard(idx);
  };

  return (
    <div className="relative h-full bg-white">
    <div className="relative h-full overflow-y-auto pb-32 text-foreground no-scrollbar">
      {/* HERO */}
      <section className="relative h-[68vh] min-h-[600px] w-full overflow-hidden">
        <img src={heroImg} alt="画堂春世界" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 88%, #ffffff 100%)" }} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-end px-5 pt-12">
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-md">
              <Bookmark className="h-4 w-4 text-white" />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-md">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Title block — horizontal */}
        <div className="relative z-10 mt-6 px-6">
          <h1 className="font-brush text-[48px] leading-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] tracking-[0.05em]">
            重生之<br/>贵女难求
          </h1>
          <div className="mt-2 space-y-1 text-[13px] leading-relaxed text-white/85">
            <p>侯门嫡女庄寒雁被继母与庶姐设计在大婚夜毒杀，<br/>重生回十二岁，一边步步为营复仇清算。</p>
          </div>

          <div className="mt-4 flex items-center gap-3 text-[11px] text-white/80">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />34,221 人入梦</span>
            <span className="h-3 w-px bg-white/30" />
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />约 90 分钟</span>
            <span className="h-3 w-px bg-white/30" />
            <span>原著改编</span>
          </div>
        </div>

        {/* World view chip */}
        <button
          onClick={() => setShowWorld(true)}
          className="absolute right-5 top-28 z-10 flex flex-col items-center gap-1 rounded-full bg-white/15 px-3 py-3 backdrop-blur-md transition active:scale-95"
        >
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-[10px] tracking-widest text-white">世界观</span>
        </button>
      </section>

      {/* CHARACTER CAROUSEL */}
      <section className="relative -mt-[260px] z-20">
        <div className="px-5 pb-2 text-center">
          <h2 className="font-brush text-2xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">人物角色</h2>
        </div>

        <div ref={trackRef} className="no-scrollbar mt-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[22%] pb-6 pt-4">
          {PLAYABLE_CHARACTERS.map((c, i) => {
            const isActive = i === active;
            return (
              <button
                key={c.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                onClick={() => {
                  navigate({ to: "/character/$id", params: { id: c.id } });
                }}
                className={`relative shrink-0 snap-center overflow-hidden rounded-2xl border transition-all duration-500 ${
                  isActive
                    ? "h-[330px] w-[200px] -translate-y-2 border-white/30 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]"
                    : "h-[270px] w-[140px] border-white/10 opacity-70"
                }`}
              >
                <img src={c.img} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                  <div className={`font-brush text-white ${isActive ? "text-3xl" : "text-2xl"}`}>{c.name}</div>
                  <div className="mt-1 text-[10px] text-white/80">{c.gender} · {c.age} 岁</div>
                  {isActive && (
                    <span className="mt-2 inline-block rounded-sm bg-white/15 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                      {c.tag}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5">
          {CHARACTERS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>

      </section>

      {/* STORY BACKGROUND */}
      <section className="mt-10 px-6">
        <div className="flex items-center gap-2">
          <span className="font-brush" style={{ color: "var(--rouge)" }}>❀</span>
          <h2 className="font-brush text-xl text-neutral-900">剧情分幕</h2>
        </div>

        <div className="mt-4 space-y-3">
          {STORY_CHAPTERS.map((ch, i) => {
            const open = i === openChapter;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] transition-all"
              >
                <button
                  onClick={() => setOpenChapter(open ? -1 : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[11px] tracking-widest text-neutral-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-[15px] text-neutral-900">{ch.title}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="animate-fade-up px-4 pb-4">
                    <p className="text-[13px] leading-7 text-neutral-600">{ch.body}</p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (i === 4) navigate({ to: "/lobby" });
                        }}
                        disabled={i !== 4}
                        className="rounded-full px-5 py-2 text-[12px] font-medium text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: "var(--gradient-rouge)" }}
                      >
                        {i === 4 ? "进入此幕" : "敬请期待"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* AI feature strip */}
      <section className="mt-8 px-6">
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--rouge)" }} />
            <span className="text-[12px] font-medium text-neutral-900">AI 动态剧情</span>
          </div>
          <p className="mt-2 text-[12px] leading-6 text-neutral-600">
            你的每一个选择，都将由 AI 实时改写，与他人的故事彼此交错——同一卷《重生之贵女难求》，没有两场相同的结局。
          </p>
        </div>
      </section>

    </div>


      {/* WORLDVIEW SHEET */}
      {showWorld && (
        <div className="absolute inset-0 z-40 flex items-end" onClick={() => setShowWorld(false)}>
          <div className="absolute inset-0 animate-fade-in bg-black/55 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-h-[78%] overflow-y-auto rounded-t-[28px] bg-white p-6 pb-10 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.4)] no-scrollbar animate-slide-in-right"
            style={{ animation: "fade-in 0.3s ease-out" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "var(--rouge)" }} />
                <h3 className="font-brush text-2xl text-neutral-900">重生之贵女难求 · 世界观</h3>
              </div>
              <button
                onClick={() => setShowWorld(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.05] text-neutral-500"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-[13px] leading-7 text-neutral-700">
              <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-[12px] italic text-neutral-600">
                「雁过留声，人过留名。这一回，她记得清清楚楚。」
              </p>

              <div>
                <h4 className="font-display text-[14px] font-medium text-neutral-900">大宗朝 · 镇国侯府</h4>
                <p className="mt-1.5">
                  大宗朝当今圣上最重仁爱孝义，律例森严：丧期三月内不得着艳色，违者罢官流放。京中世家百年清誉系于一线，最忌行差踏错。镇国侯庄府袭爵承业，外有官声体面，内里却早已被外室周氏一双勾魂的眼睛搅得乱了纲常。
                </p>
              </div>

              <div>
                <h4 className="font-display text-[14px] font-medium text-neutral-900">清秋苑里 · 庄寒雁</h4>
                <p className="mt-1.5">
                  庄寒雁，镇国侯庄仕洋之嫡长女。母亲温婉柔顺，从不与人争长短；父亲冷淡，多年在外头养着外室母女而她毫不知情。前世，她信了继母的笑、信了「好姐姐」的眼泪，眼看着母亲被算计而亡、弟弟被夺走、自己也走到了那个凄惨结局。再睁眼，竟回到了母丧未远、周氏母女初登庄府的那一天。
                </p>
              </div>

              <div>
                <h4 className="font-display text-[14px] font-medium text-neutral-900">第五章 · 初次交锋</h4>
                <p className="mt-1.5">
                  这一日，周氏盛装登门，庄语山娇声唤她「妹妹」。前世的寒雁会怯怯地笑着应下，今生的她，却把每一句话都化作钝刀——香粉、丧期、律例、丫鬟用的香膏，一句一句，剜在周氏母女最痛的地方。父亲庄仕洋的脸色变了又变，周氏第一次明白：这个嫡女，与从前不一样了。
                </p>
              </div>

              <div>
                <h4 className="font-display text-[14px] font-medium text-neutral-900">你的故事</h4>
                <p className="mt-1.5">
                  在这则故事里，你可以是任何人——是带着前世记忆归来的庄寒雁，以一双慧眼一张利口在虎狼之府里步步反扑；是装柔示弱、却被识破伪装的周氏；是骄矜娇气、第一次撞上铁板的庄语山；是只在意官声仕途的庄仕洋；也可以是那个叼着草梗、在外墙边含笑看戏的陌生人。
                </p>
                <p className="mt-3">
                  每一次选择，都会改写这场「初次交锋」的胜负——独一无二的，你的重生之贵女难求。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  return (
    <PhoneMockup>
      <HuatangChun />
    </PhoneMockup>
  );
}
