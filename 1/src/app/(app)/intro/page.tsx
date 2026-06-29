"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BookOpen,
  Gamepad2,
  Heart,
  MessageSquare,
  Sparkles,
  Timer,
} from "lucide-react";
import { markOnboardingSeen } from "@/lib/onboarding";
import { EASE } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const features = [
  {
    icon: MessageSquare,
    title: "Trợ lý gợi ý sách AI",
    desc: "Chat với AI, gửi ảnh bìa sách để nhận gợi ý sách phù hợp với sở thích của bạn.",
    color: "from-violet-500 to-purple-600",
    accent: "violet",
  },
  {
    icon: Heart,
    title: "Chia sẻ cộng đồng",
    desc: "Viết bài, tim, lưu và bình luận.",
    color: "from-rose-500 to-pink-600",
    accent: "rose",
  },
  {
    icon: Timer,
    title: "Đồng hồ đọc sách",
    desc: "Khóa màn hình, gắn nhạc nền Youtube, tập trung đọc và mở khóa thành tựu.",
    color: "from-emerald-500 to-teal-600",
    accent: "emerald",
  },
  {
    icon: Gamepad2,
    title: "Karuta",
    desc: "Ghép ngẫu nhiên hoặc tạo phòng",
    color: "from-amber-500 to-orange-600",
    accent: "amber",
  },
];

const floatingBooks = ["📖", "📚", "✨", "🌸", "🎴", "⏳"];

export default function IntroPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const orbRefs = useRef<HTMLDivElement[]>([]);
  const particleRefs = useRef<HTMLSpanElement[]>([]);
  const featureRefs = useRef<HTMLDivElement[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  const finish = () => {
    markOnboardingSeen();
    router.replace("/");
  };

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !rootRef.current) return;

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: EASE.smooth } });

        tl.fromTo(
          orbRefs.current,
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power3.out" }
        )
          .fromTo(
            titleRef.current?.querySelectorAll(".intro-char") ?? [],
            { opacity: 0, y: 60, rotateX: -90 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.7,
              stagger: 0.04,
              ease: EASE.elastic,
            },
            "-=0.6"
          )
          .fromTo(
            subtitleRef.current,
            { opacity: 0, y: 24, filter: "blur(8px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6 },
            "-=0.3"
          )

        const badge = heroRef.current?.querySelector(".intro-hero-badge");
        if (badge) {
          tl.fromTo(
            badge,
            { scale: 0, rotation: -20 },
            { scale: 1, rotation: 0, duration: 0.5, ease: EASE.bounce },
            "-=0.4"
          );
        }

        gsap.to(orbRefs.current, {
          y: "+=18",
          x: "+=12",
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 0.5, from: "random" },
        });

        particleRefs.current.forEach((el, i) => {
          gsap.set(el, { x: gsap.utils.random(-40, 40), y: gsap.utils.random(-20, 20) });
          gsap.to(el, {
            y: `+=${gsap.utils.random(30, 80)}`,
            x: `+=${gsap.utils.random(-30, 30)}`,
            rotation: gsap.utils.random(-30, 30),
            duration: gsap.utils.random(3, 6),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.2,
          });
        });

        featureRefs.current.forEach((card, i) => {
          const icon = card?.querySelector(".intro-feature-icon");
          const text = card?.querySelectorAll(".intro-feature-text");

          gsap.fromTo(
            card,
            { opacity: 0, y: 80, rotateY: i % 2 === 0 ? -12 : 12 },
            {
              opacity: 1,
              y: 0,
              rotateY: 0,
              duration: 0.8,
              ease: EASE.snap,
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );

          if (icon) {
            gsap.fromTo(
              icon,
              { scale: 0, rotation: -180 },
              {
                scale: 1,
                rotation: 0,
                duration: 0.6,
                ease: EASE.bounce,
                scrollTrigger: {
                  trigger: card,
                  start: "top 80%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          if (text?.length) {
            gsap.fromTo(
              text,
              { opacity: 0, x: i % 2 === 0 ? -24 : 24 },
              {
                opacity: 1,
                x: 0,
                duration: 0.5,
                stagger: 0.08,
                scrollTrigger: {
                  trigger: card,
                  start: "top 78%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }
        });

        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, scale: 0.9, y: 40 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.7,
            ease: EASE.bounce,
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );

        const ctaGlow = ctaRef.current?.querySelector(".intro-cta-glow");
        if (ctaGlow) {
          gsap.to(ctaGlow, {
            scale: 1.08,
            opacity: 0.6,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef }
  );

  const title = "BookFinder";
  const titleChars = title.split("");

  return (
    <div ref={rootRef} className="intro-page relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={(el) => {
            if (el) orbRefs.current[0] = el;
          }}
          className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"
        />
        <div
          ref={(el) => {
            if (el) orbRefs.current[1] = el;
          }}
          className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl"
        />
        <div
          ref={(el) => {
            if (el) orbRefs.current[2] = el;
          }}
          className="absolute bottom-32 left-1/4 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl"
        />
        {floatingBooks.map((emoji, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) particleRefs.current[i] = el;
            }}
            className="absolute text-2xl opacity-40 md:text-3xl"
            style={{
              left: `${10 + i * 14}%`,
              top: `${12 + (i % 3) * 22}%`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-16 text-center"
      >
        <div className="intro-hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-4 py-1.5 text-xs font-semibold text-violet-700 backdrop-blur-md dark:border-cold-border dark:bg-cold-glass/60 dark:text-cold-300">
          <Sparkles className="h-3.5 w-3.5" />
          Không gian đọc sách & chơi cùng bạn bè
        </div>

        <h1
          ref={titleRef}
          className="perspective-[800px] text-5xl font-black tracking-tight text-stone-900 dark:text-white md:text-7xl"
          style={{ perspective: 800 }}
        >
          {titleChars.map((char, i) => (
            <span
              key={i}
              className="intro-char inline-block bg-gradient-to-br from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent"
            >
              {char}
            </span>
          ))}
        </h1>

        <p
          ref={subtitleRef}
          className="mt-5 max-w-lg text-base leading-relaxed text-stone-600 dark:text-slate-300 md:text-lg"
        >
          Gợi ý sách thông minh, cộng đồng chia sẻ, đồng hồ tập trung và game
          Karuta — tất cả trong một ứng dụng.
        </p>

        <div className="mt-10 animate-bounce text-stone-400">
          <span className="text-xs uppercase tracking-[0.3em]">Cuộn xuống</span>
          <div className="mx-auto mt-2 h-8 w-5 rounded-full border-2 border-stone-300 p-1 dark:border-slate-600">
            <div className="mx-auto h-1.5 w-1 rounded-full bg-violet-500" />
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-2xl space-y-8 px-4 pb-12">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              ref={(el) => {
                if (el) featureRefs.current[i] = el;
              }}
              className="glass-strong group relative overflow-hidden rounded-3xl p-6 md:p-8"
            >
              <div
                className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.color} opacity-10 blur-2xl transition group-hover:opacity-20`}
              />
              <div className="relative flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                <div
                  className={`intro-feature-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="intro-feature-text text-xl font-bold text-stone-900 dark:text-white">
                    {feature.title}
                  </h2>
                  <p className="intro-feature-text mt-2 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="relative px-4 pb-20 pt-4">
        <div
          ref={ctaRef}
          className="glass-strong relative mx-auto max-w-md overflow-hidden rounded-3xl p-8 text-center"
        >
          <div className="intro-cta-glow pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/20 via-rose-500/10 to-cyan-500/20" />
          <div className="relative">
            <BookOpen className="mx-auto h-12 w-12 text-violet-500" />
            <h2 className="mt-4 text-2xl font-bold text-stone-900 dark:text-white">
              Sẵn sàng khám phá?
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-slate-300">
              Đăng nhập Google để lưu lịch sử, hoặc dùng thử 1 giờ với tư cách
              khách.
            </p>
            <button
              type="button"
              onClick={finish}
              className="btn-primary mt-6 w-full text-base"
            >
              <BookOpen className="mr-2 inline h-5 w-5" />
              Bắt đầu hành trình
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
