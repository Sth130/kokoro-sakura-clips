import { useEffect, useRef, useState } from "react";
import { ExternalLink, Play, Instagram, ChevronDown, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import CommunitySection from "../components/community";

/* ─── Sakura Petals Background ─── */
function SakuraPetals() {
  const petals = Array.from({ length: 20 }, (_, i) => {
    const isReverse = i % 3 === 0;
    return {
      id: i,
      left: `${(i * 5.3 + 7) % 100}%`,
      delay: `${(i * 1.7) % 12}s`,
      duration: `${10 + (i * 2.3) % 10}s`,
      size: 10 + (i * 3) % 14,
      opacity: 0.15 + (i % 5) * 0.06,
      className: isReverse ? "sakura-petal-reverse" : "sakura-petal",
    };
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {petals.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.className}`}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
          }}
        >
          ✿
        </div>
      ))}
    </div>
  );
}

/* ─── Intersection Observer for scroll animations ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Navigation ─── */
function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#about", label: "紹介" },
    { href: "#videos", label: "動画" },
    { href: "#gallery", label: "ギャラリー" },
    { href: "#community", label: "コミュニティ" },
    { href: "#sns", label: "SNS" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "nav-blur bg-[#FFF9F5]/80 shadow-sm border-b border-[#E8D5CA]/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a
          href="#"
          className="font-display text-lg tracking-wider text-[#D4627A] hover:text-[#C9A96E] transition-colors"
        >
          こころ桜クリップス
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-sans text-sm tracking-wide text-[#2D2D2D]/70 hover:text-[#D4627A] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://www.youtube.com/@KokoroSakuraClips"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-[#D4627A] text-white text-sm rounded-full hover:bg-[#C9A96E] transition-colors"
          >
            YouTube
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="メニュー"
        >
          <span className={`w-5 h-0.5 bg-[#D4627A] transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-5 h-0.5 bg-[#D4627A] transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`w-5 h-0.5 bg-[#D4627A] transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden nav-blur bg-[#FFF9F5]/95 border-b border-[#E8D5CA]/50 px-6 pb-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-[#2D2D2D]/70 hover:text-[#D4627A]"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://www.youtube.com/@KokoroSakuraClips"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 px-4 py-1.5 bg-[#D4627A] text-white text-sm rounded-full"
          >
            YouTube
          </a>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF0F3] via-[#FFF9F5] to-[#FFF9F5]" />

      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-[#F8B4C8]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-10 w-48 h-48 bg-[#C9A96E]/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl">
        {/* Channel icon */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-br from-[#D4627A]/20 via-[#F8B4C8]/10 to-[#C9A96E]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <img
              src="/kokoro-images/hero-kokoro-kimono.png"
              alt="Kokoro Sakura Clips"
              className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl shadow-xl object-cover ring-2 ring-[#C9A96E]/20"
            />
          </div>
        </div>

        {/* Japanese decorative text */}
        <p className="font-display text-sm tracking-[0.5em] text-[#C9A96E] mb-6 animate-fade-in">
          ─── 桜の舞う場所へ ───
        </p>

        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-[#2D2D2D] leading-tight mb-4 animate-fade-in-up">
          Kokoro Sakura Clips
        </h1>

        <p className="font-display text-xl md:text-2xl text-[#D4627A] tracking-wider mb-2 animate-fade-in-up stagger-2">
          こころ桜クリップス
        </p>

        <div className="gold-line max-w-xs mx-auto my-8 animate-fade-in stagger-3" />

        <p className="font-sans text-base md:text-lg text-[#2D2D2D]/60 max-w-xl mx-auto leading-relaxed mb-10 animate-fade-in-up stagger-3">
          DEAD OR ALIVE 5 Last Round ─ こころ専門チャンネル
          <br />
          対戦動画・衣装コレクション・ショートクリップ
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-4">
          <a
            href="https://www.youtube.com/@KokoroSakuraClips"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-8 py-3 bg-[#D4627A] text-white rounded-full text-sm font-medium hover:bg-[#C04060] transition-all shadow-lg shadow-[#D4627A]/20 hover:shadow-[#D4627A]/40"
          >
            <Play size={16} className="group-hover:scale-110 transition-transform" />
            チャンネルを見る
          </a>
          <a
            href="#videos"
            className="flex items-center gap-2 px-8 py-3 border border-[#C9A96E]/40 text-[#C9A96E] rounded-full text-sm font-medium hover:bg-[#C9A96E]/10 transition-all"
          >
            最新動画
          </a>
          <a
            href="https://x.com/intent/tweet?text=DOA5LR%20%E3%81%93%E3%81%93%E3%82%8D%E5%B0%82%E9%96%80%E3%83%81%E3%83%A3%E3%83%B3%E3%83%8D%E3%83%AB%E3%80%8C%E3%81%93%E3%81%93%E3%82%8D%E6%A1%9C%E3%82%AF%E3%83%AA%E3%83%83%E3%83%97%E3%82%B9%E3%80%8D&url=https%3A%2F%2Fkokoro-sakura-clips-web.vercel.app%2F"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 border border-[#2D2D2D]/20 text-[#2D2D2D]/50 rounded-full text-sm font-medium hover:border-[#D4627A]/40 hover:text-[#D4627A] transition-all"
          >
            <Share2 size={14} />
            共有
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 animate-float">
        <ChevronDown size={24} className="text-[#D4627A]/40" />
      </div>
    </section>
  );
}

/* ─── About Section ─── */
function AboutSection() {
  return (
    <section id="about" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <div className="text-center mb-16">
            <p className="font-display text-sm tracking-[0.4em] text-[#C9A96E] mb-3">ABOUT</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2D2D2D]">チャンネル紹介</h2>
            <div className="gold-line max-w-[60px] mx-auto mt-4" />
          </div>
        </RevealSection>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <RevealSection delay={0.15}>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border border-[#C9A96E]/20 rounded-2xl" />
              <img
                src="/kokoro-images/doa-5-lr-kokoro-character-image_0.jpg"
                alt="こころ DOA5LR"
                className="relative w-full rounded-2xl shadow-xl object-cover aspect-[4/5]"
              />
              <div className="absolute -bottom-3 -right-3 px-4 py-2 bg-[#1A1A1A] text-white font-display text-sm rounded-xl shadow-lg">
                DEAD OR ALIVE 5 LR
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={0.3}>
            <div className="space-y-6">
              <h3 className="font-serif text-2xl font-semibold text-[#2D2D2D]">
                こころの魅力を、<br />
                <span className="text-[#D4627A]">すべてのファンへ。</span>
              </h3>

              <p className="font-sans text-[#2D2D2D]/70 leading-relaxed">
                「Kokoro Sakura Clips │ こころ桜クリップス」は、
                DEAD OR ALIVE 5 Last Round のキャラクター・こころに特化した
                YouTubeチャンネルです。
              </p>

              <p className="font-sans text-[#2D2D2D]/70 leading-relaxed">
                オンライン対戦のハイライト、衣装コレクション、
                ショートクリップなど、こころの可愛さと強さを
                さまざまな角度からお届けしています。
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { num: "3日毎", label: "動画投稿" },
                  { num: "こころ", label: "専門" },
                  { num: "DOA5LR", label: "対戦" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 bg-[#FFF0F3] rounded-xl">
                    <div className="font-serif text-lg font-bold text-[#D4627A]">{item.num}</div>
                    <div className="text-xs text-[#2D2D2D]/50 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}

/* ─── Videos Section (Dark) ─── */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function VideosSection() {
  /* Set 1: fixed */
  const fixedVideos = [
    { id: "qBVRuv-Lkn4", title: "こころ DOA5LR ショートクリップ #1" },
    { id: "aWk1G0kVlr8", title: "こころ DOA5LR ショートクリップ #2" },
    { id: "LsQhgSoRUps", title: "こころ DOA5LR クリップ #1" },
    { id: "BEw-28zpH7o", title: "こころ DOA5LR クリップ #2" },
    { id: "TcjDCwr2GsU", title: "こころ DOA5LR クリップ #3" },
    { id: "Kv-Ee2ubWyc", title: "こころ DOA5LR クリップ #4" },
  ];

  /* Pool for random sets 2 & 3 — all-ages only (no Ryona, costume-focus, or age-restricted) */
  const randomPool = [
    { id: "c-8iiAT07ZY", title: "煽られたいが故に煽る│12" },
    { id: "__HrARz3ljI", title: "煽られたいが故に煽る│11" },
    { id: "kDZfqj2v5CI", title: "こころ VS ティナ│煽られたいが故に煽る│10" },
    { id: "Uuwp8Y32Amw", title: "煽られたいが故に煽る│9" },
    { id: "IQ4XhshsELY", title: "煽られたいが故に煽る #8" },
    { id: "ilk1OSrNJ04", title: "煽られたいが故に煽る #7" },
    { id: "-bVFIzSJCbw", title: "【番外編】こころ vs マリーローズ 腹パン合戦" },
    { id: "WeEEKPL_wHE", title: "煽られたいが故に煽る│5" },
    { id: "FlfOApHOC_M", title: "Kokoro Gameplay Highlights" },
    { id: "WW9mB2yU8Hc", title: "煽られたいが故に煽る #6" },
    { id: "2WbzlOPAVtw", title: "煽られたいが故に煽る＃4│マリー初陣" },
    { id: "Ez6yQ7fVU74", title: "煽られたいが故に煽る #3" },
    { id: "0Nryz954-Gk", title: "煽られたいが故に煽る #2" },
    { id: "FvGGjIp9Ocw", title: "煽られたいが故に煽る #1" },
    { id: "yubUtCrNauo", title: "Kokoro│Under Constant Pressure" },
  ];

  /* Build 5 sets on mount: set1 fixed, set2–5 random 6 each (shuffled pool, may repeat across sets) */
  const [sets] = useState(() => {
    const shuffled = shuffleArray(randomPool);
    /* First 12 unique, then reshuffle for remaining */
    const s2 = shuffled.slice(0, 6);
    const s3 = shuffled.slice(6, 12);
    const reshuffled = shuffleArray(randomPool);
    const s4 = reshuffled.slice(0, 6);
    const s5 = reshuffled.slice(6, 12);
    return [fixedVideos, s2, s3, s4, s5];
  });

  const TOTAL_SETS = 5;
  const [currentSet, setCurrentSet] = useState(0);

  const prev = () => setCurrentSet((i) => (i - 1 + TOTAL_SETS) % TOTAL_SETS);
  const next = () => setCurrentSet((i) => (i + 1) % TOTAL_SETS);

  const currentVideos = sets[currentSet];

  return (
    <section id="videos" className="relative py-24 px-6 bg-[#1A1A1A] text-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#FFF9F5] to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FFF9F5] to-transparent z-10" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-[#D4627A]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-60 h-60 bg-[#C9A96E]/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-20 pt-8">
        <RevealSection>
          <div className="text-center mb-16">
            <p className="font-display text-sm tracking-[0.4em] text-[#C9A96E] mb-3">VIDEOS</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-glow-pink">最新動画</h2>
            <div className="gold-line max-w-[60px] mx-auto mt-4" />
            <p className="font-sans text-sm text-white/40 mt-4">
              オンライン対戦・ハイライト・ショートクリップ
            </p>
          </div>
        </RevealSection>

        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-5 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2A2A2A]/90 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-all backdrop-blur-sm"
            aria-label="前のセット"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Right Arrow */}
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-5 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2A2A2A]/90 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-all backdrop-blur-sm"
            aria-label="次のセット"
          >
            <ChevronRight size={20} />
          </button>

          {/* Video Grid */}
          <div className="mx-6 sm:mx-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-500">
              {currentVideos.map((v) => (
                <div key={v.id}>
                  <div className="video-card rounded-xl overflow-hidden bg-[#2A2A2A] border border-white/5">
                    <div className="relative aspect-video overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${v.id}`}
                        title={v.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-sans text-xs sm:text-sm text-white/80 line-clamp-2">{v.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-3 mt-6">
            {sets.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSet(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentSet ? "bg-[#C9A96E] w-8" : "bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`セット ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <RevealSection delay={0.5}>
          <div className="text-center mt-12">
            <a
              href="https://www.youtube.com/@KokoroSakuraClips"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#C9A96E]/30 text-[#C9A96E] rounded-full text-sm hover:bg-[#C9A96E]/10 transition-all"
            >
              すべての動画を見る
              <ExternalLink size={14} />
            </a>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─── Gallery Section ─── */
function GallerySection() {
  const allImages = [
    // Row 1: 和服画像を含む
    { src: "costume-christmas.jpg", label: "クリスマス" },
    { src: "kokoro-kimono-umbrella.jpg", label: "和服・番傘" },
    { src: "costume-bunny.jpg", label: "バニー" },
    { src: "costume-nurse.jpg", label: "ナース" },
    // Row 2
    { src: "costume-maid-official.jpg", label: "メイド" },
    { src: "costume-school-uniform.jpg", label: "制服" },
    { src: "kokoro-sakura-clips.png", label: "桜クリップ" },
    { src: "costume-halloween-fox.jpg", label: "ハロウィン・狐" },
    // Row 3
    { src: "doa-5-lr-kokoro-character-image_5.jpg", label: "拳法服" },
    { src: "costume-swimsuit.jpg", label: "水着" },
    { src: "kokoro-kimono-battle.jpg", label: "和服・対戦" },
    { src: "costume-halloween-2016.jpg", label: "ハロウィン" },
    { src: "costume-high-society.jpg", label: "ドレス" },
    { src: "costume-hot-summer.jpg", label: "ホットサマー" },
    { src: "costume-rodeo.jpg", label: "ロデオ" },
    // Row 4: 和服1つ目 ★
    { src: "kokoro-kimono.jpg", label: "着物" },
    { src: "costume-santa.jpg", label: "サンタ" },
    { src: "costume-cheerleader-official.jpg", label: "チアリーダー" },
    { src: "costume-overalls.jpg", label: "オーバーオール" },
    // Row 5-6: コスチューム
    { src: "dead-or-alive-5-last-round-kokoro-screenshot_4.jpg", label: "対戦" },
    { src: "costume-halloween-2017.jpg", label: "ハロウィン" },
    { src: "costume-halloween-devil.jpg", label: "ハロウィン・デビル" },
    { src: "doa-5-lr-kokoro-character-image_8.jpg", label: "キャラ" },
    { src: "costume-tecmo-50th.jpg", label: "TECMO 50th" },
    { src: "dead-or-alive-5-last-round-kokoro-screenshot_6.jpg", label: "対戦" },
    { src: "costume-ultimate-sexy.jpg", label: "アルティメット" },
    { src: "costume-gym-school.jpg", label: "体操服" },
    // Row 7: 和服2つ目 ★
    { src: "doa-5-lr_3.jpg", label: "DOA5LR" },
    { src: "costume-halloween-2013.jpg", label: "ハロウィン" },
    { src: "doa-5-lr-kokoro-character-image_4.jpg", label: "和服・桜" },
    { src: "doa-5-lr_4.jpg", label: "DOA5LR" },
    { src: "dead-or-alive-5-last-round-kokoro-screenshot_7.jpg", label: "対戦" },
    { src: "costume-christmas-2014.jpg", label: "クリスマス" },
    { src: "doa-5-lr_5.jpg", label: "DOA5LR" },
    { src: "kokoro-valentine.jpg", label: "バレンタイン" },
    { src: "dead-or-alive-5-last-round-kokoro-screenshot_8.jpg", label: "対戦" },
    { src: "costume-warrior-all.jpg", label: "全衣装" },
    { src: "kokoro-main.jpg", label: "メイン" },
    // Row 10: 残り
    { src: "kokoro-sad.jpg", label: "ストーリー" },
    { src: "doa-5-lr_7.jpg", label: "DOA5LR" },
    { src: "doa-5-lr-kokoro-character-image_9.jpg", label: "キャラ" },
    { src: "kokoro-halloween.jpg", label: "ハロウィン" },
    // Row 11: 和服3つ目 ★
    { src: "costume-fighter-portrait.jpg", label: "和服・全身" },
    { src: "doa-5-lr_8.jpg", label: "DOA5LR" },
    { src: "costume-summer-festival.jpg", label: "夏祭り" },
    { src: "costume-collection.jpg", label: "コレクション" },
    // Row 12: 残り
    { src: "kokoro-doa6-render.jpg", label: "DOA6" },
    { src: "doa-5-lr_6.jpg", label: "DOA5LR" },
    { src: "thumbnail-combo-video.jpg", label: "コンボ動画" },
    { src: "thumbnail-story-chapter.jpg", label: "ストーリー" },
    // Row 13: 和服4つ目で締め ★
    { src: "thumbnail-shorts.jpg", label: "ショート" },
    { src: "kokoro-shrine.jpg", label: "巫女" },
    { src: "kokoro-sakura.jpg", label: "桜" },
    { src: "kokoro-fullbody.jpg", label: "全身" },
  ];

  const INITIAL_COUNT = 12;
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const visibleImages = showAll ? allImages : allImages.slice(0, INITIAL_COUNT);

  return (
    <section id="gallery" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <div className="text-center mb-16">
            <p className="font-display text-sm tracking-[0.4em] text-[#C9A96E] mb-3">GALLERY</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2D2D2D]">ギャラリー</h2>
            <div className="gold-line max-w-[60px] mx-auto mt-4" />
            <p className="font-sans text-sm text-[#2D2D2D]/50 mt-4">
              こころの衣装コレクション ─ {allImages.length}枚
            </p>
          </div>
        </RevealSection>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {visibleImages.map((img, i) => (
            <RevealSection key={img.src} delay={Math.min(0.08 * i, 0.8)}>
              <button
                onClick={() => setLightbox(img.src)}
                className="group relative block w-full overflow-hidden rounded-xl cursor-pointer aspect-[4/3]"
              >
                <img
                  src={`/kokoro-images/${img.src}`}
                  alt={`こころ ${img.label}`}
                  className="gallery-img w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute bottom-2 left-2 text-[11px] text-white/90 bg-black/40 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.label}
                </span>
              </button>
            </RevealSection>
          ))}
        </div>

        {/* Show more / less button */}
        <div className="text-center mt-10">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#C9A96E]/40 text-[#C9A96E] rounded-full text-sm hover:bg-[#C9A96E]/10 transition-all"
          >
            {showAll ? (
              <>閉じる <ChevronDown size={14} className="rotate-180" /></>
            ) : (
              <>もっと画像を見る（残り{allImages.length - INITIAL_COUNT}枚） <ChevronDown size={14} /></>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={`/kokoro-images/${lightbox}`}
            alt="こころ"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}

/* ─── SNS Section (Dark) ─── */
function SNSSection() {
  const socials = [
    {
      name: "YouTube",
      handle: "@KokoroSakuraClips",
      url: "https://www.youtube.com/@KokoroSakuraClips",
      desc: "メインチャンネル ─ 3日に1本投稿",
      color: "from-red-500 to-red-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: "ニコニコ動画",
      handle: "user/130677002",
      url: "https://www.nicovideo.jp/user/130677002",
      desc: "ニコニコでも配信中",
      color: "from-gray-700 to-gray-800",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M.4787 7.534v12.5693A2.9054 2.9054 0 0 0 3.371 23.0033h17.258a2.9054 2.9054 0 0 0 2.8923-2.9v-12.536a2.9054 2.9054 0 0 0-2.8923-2.9H3.371a2.9054 2.9054 0 0 0-2.8923 2.8667zm6.084 7.5693L4.8358 17.348V12.54zm10.9186-2.2437L15.754 15.1033v-4.808z" />
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      handle: "@KokoroSclips",
      url: "https://x.com/KokoroSclips",
      desc: "最新情報・お知らせ",
      color: "from-gray-800 to-black",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      handle: "@kokorosakura_clips",
      url: "https://www.instagram.com/kokorosakura_clips",
      desc: "スクリーンショット・画像",
      color: "from-purple-500 via-pink-500 to-orange-400",
      icon: <Instagram size={22} />,
    },
  ];

  return (
    <section id="sns" className="relative py-24 px-6 bg-[#1A1A1A] text-white overflow-hidden">
      {/* No top gradient — Community section above is also dark */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFF9F5] to-transparent" />

      <div className="max-w-4xl mx-auto relative z-10 pt-4">
        <RevealSection>
          <div className="text-center mb-16">
            <p className="font-display text-sm tracking-[0.4em] text-[#C9A96E] mb-3">FOLLOW</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-glow-pink">SNSでつながる</h2>
            <div className="gold-line max-w-[60px] mx-auto mt-4" />
          </div>
        </RevealSection>

        <div className="grid sm:grid-cols-2 gap-4">
          {socials.map((s, i) => (
            <RevealSection key={s.name} delay={0.1 * i}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-5 rounded-xl bg-[#2A2A2A] border border-white/5 hover:border-[#C9A96E]/30 transition-all hover:translate-y-[-2px] hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 text-white group-hover:scale-105 transition-transform`}>
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans font-medium text-white group-hover:text-[#F8B4C8] transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-sm text-white/40 mt-0.5">{s.handle}</p>
                    <p className="text-xs text-white/25 mt-1">{s.desc}</p>
                  </div>
                  <ExternalLink size={14} className="text-white/20 group-hover:text-[#C9A96E] transition-colors ml-auto flex-shrink-0 mt-1" />
                </div>
              </a>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Subscribe CTA Banner ─── */
function SubscribeCTA() {
  return (
    <section className="relative py-20 px-6 bg-gradient-to-br from-[#D4627A] via-[#C04060] to-[#A03050] text-white overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <RevealSection>
          <p className="font-display text-sm tracking-[0.4em] text-white/60 mb-4">SUBSCRIBE</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            チャンネル登録で最新動画をチェック
          </h2>
          <p className="text-white/70 text-sm md:text-base mb-8 max-w-lg mx-auto">
            3日に1本ペースで新しいこころの対戦動画を投稿中。見逃さないようにチャンネル登録＆通知ONがおすすめ！
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://www.youtube.com/@KokoroSakuraClips?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-8 py-4 bg-white text-[#D4627A] rounded-full font-medium hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              チャンネル登録する
            </a>
            <a
              href="https://x.com/intent/tweet?text=DOA5LR%20%E3%81%93%E3%81%93%E3%82%8D%E5%B0%82%E9%96%80%E3%83%81%E3%83%A3%E3%83%B3%E3%83%8D%E3%83%AB%E3%80%8C%E3%81%93%E3%81%93%E3%82%8D%E6%A1%9C%E3%82%AF%E3%83%AA%E3%83%83%E3%83%97%E3%82%B9%E3%80%8D&url=https%3A%2F%2Fkokoro-sakura-clips-web.vercel.app%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 border border-white/30 text-white rounded-full text-sm hover:bg-white/10 transition-all"
            >
              <Share2 size={14} />
              Xで共有する
            </a>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="py-12 px-6 text-center">
      <div className="gold-line max-w-[120px] mx-auto mb-8" />
      <p className="font-display text-lg text-[#D4627A] tracking-wider mb-2">
        こころ桜クリップス
      </p>
      <p className="font-sans text-xs text-[#2D2D2D]/30">
        Kokoro Sakura Clips │ DOA5LR こころ専門チャンネル
      </p>
      <p className="font-sans text-[10px] text-[#2D2D2D]/20 mt-4">
        &copy; {new Date().getFullYear()} Kokoro Sakura Clips. All rights reserved.
      </p>
    </footer>
  );
}

/* ─── Main Home Page ─── */
export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden">
      <SakuraPetals />
      <Navigation />
      <HeroSection />
      <AboutSection />
      <VideosSection />
      <GallerySection />
      <CommunitySection />
      <SNSSection />
      <SubscribeCTA />
      <Footer />
    </div>
  );
}
