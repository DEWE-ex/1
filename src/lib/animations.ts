import gsap from "gsap";

gsap.defaults({ ease: "power2.out", duration: 0.45 });

export const EASE = {
  smooth: "power2.out",
  bounce: "back.out(1.4)",
  snap: "power4.out",
  elastic: "elastic.out(1, 0.6)",
} as const;

export function fadeInUp(
  targets: gsap.TweenTarget,
  opts?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, ...opts }
  );
}

export function fadeInScale(
  targets: gsap.TweenTarget,
  opts?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.fromTo(
    targets,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, ...opts }
  );
}

export function fadeOutScale(
  targets: gsap.TweenTarget,
  opts?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.to(targets, {
    opacity: 0,
    scale: 0.95,
    duration: 0.25,
    ease: "power2.in",
    ...opts,
  });
}

export function staggerCards(
  targets: gsap.TweenTarget,
  opts?: gsap.TweenVars
): gsap.core.Tween {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 24, rotateX: 10 },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      stagger: 0.06,
      ease: EASE.smooth,
      ...opts,
    }
  );
}

export function slideStep(
  outEl: gsap.TweenTarget,
  inEl: gsap.TweenTarget,
  direction: 1 | -1 = 1
): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(outEl, {
    opacity: 0,
    x: -24 * direction,
    duration: 0.22,
    ease: "power2.in",
  }).fromTo(
    inEl,
    { opacity: 0, x: 24 * direction },
    { opacity: 1, x: 0, duration: 0.32, ease: EASE.smooth },
    "-=0.08"
  );
  return tl;
}

export function openModal(
  backdrop: gsap.TweenTarget,
  panel: gsap.TweenTarget
): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2 })
    .fromTo(
      panel,
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: EASE.bounce },
      "-=0.1"
    );
  return tl;
}

export function closeModal(
  backdrop: gsap.TweenTarget,
  panel: gsap.TweenTarget,
  onComplete?: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete });
  tl.to(panel, {
    opacity: 0,
    scale: 0.95,
    y: 12,
    duration: 0.22,
    ease: "power2.in",
  }).to(backdrop, { opacity: 0, duration: 0.18 }, "-=0.1");
  return tl;
}

export function matchmakingRadar(
  rings: gsap.TweenTarget
): gsap.core.Timeline {
  return gsap.timeline({ repeat: -1 }).to(rings, {
    scale: 2.2,
    opacity: 0,
    duration: 2,
    stagger: 0.65,
    ease: "power1.out",
  });
}

export function scorePop(target: gsap.TweenTarget): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { scale: 1 },
    { scale: 1.18, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }
  );
}

export function themeCrossfade(
  overlay: gsap.TweenTarget,
  onSwap: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(overlay, { opacity: 1, duration: 0.22, ease: "power2.in" })
    .call(onSwap)
    .to(overlay, { opacity: 0, duration: 0.38, ease: "power2.out" });
  return tl;
}

export function themeIconSpin(target: gsap.TweenTarget): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { rotate: -90, scale: 0.6, opacity: 0 },
    { rotate: 0, scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" }
  );
}

export function cardRemove(target: gsap.TweenTarget): gsap.core.Tween {
  return gsap.to(target, {
    opacity: 0,
    scale: 0.6,
    y: -16,
    duration: 0.35,
    ease: "power2.in",
  });
}

export function cardFlip(
  target: gsap.TweenTarget,
  highlight: "correct" | "wrong"
): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { scale: 1 },
    {
      scale: highlight === "correct" ? 1.05 : 0.95,
      duration: 0.25,
      yoyo: true,
      repeat: 1,
      ease: highlight === "correct" ? EASE.bounce : "power2.in",
    }
  );
}
