(() => {
  const root = document.documentElement;
  const heroVisual = document.querySelector(".hero-visual");
  const pageTurns = Array.from(
    document.querySelectorAll("[data-page-turn]"),
  );
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    root.style.setProperty("--scroll-progress", "1");
    return;
  }

  root.classList.add("motion-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -9% 0px",
      threshold: 0.12,
    },
  );

  revealItems.forEach((item) => observer.observe(item));

  let frame = 0;
  let pointerFrame = 0;

  const updatePageTurns = () => {
    const startLine = window.innerHeight * 0.9;
    const endLine = window.innerHeight * 0.18;
    const travel = Math.max(startLine - endLine, 1);

    pageTurns.forEach((turn) => {
      const rect = turn.getBoundingClientRect();
      const rawProgress = Math.min(
        Math.max((startLine - rect.top) / travel, 0),
        1,
      );
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      const sheetFade =
        rawProgress < 0.76
          ? 1
          : Math.max(1 - (rawProgress - 0.76) / 0.24, 0);
      const creaseY = turn.offsetHeight * (0.84 - easedProgress * 0.69);

      turn.style.setProperty(
        "--turn-angle",
        `${easedProgress * -112}deg`,
      );
      turn.style.setProperty("--turn-lift", `${easedProgress * -18}px`);
      turn.style.setProperty(
        "--turn-sheet-opacity",
        sheetFade.toFixed(3),
      );
      turn.style.setProperty("--turn-crease-y", `${creaseY}px`);
      turn.style.setProperty(
        "--turn-grid-opacity",
        `${easedProgress * 0.72}`,
      );
      turn.style.setProperty(
        "--turn-grid-scale",
        `${0.96 + easedProgress * 0.04}`,
      );
      turn.style.setProperty(
        "--turn-glow-opacity",
        `${easedProgress}`,
      );
      turn.style.setProperty(
        "--turn-glow-y",
        `${(1 - easedProgress) * -28}px`,
      );
      turn.style.setProperty(
        "--turn-crease-opacity",
        `${0.45 + easedProgress * 0.55}`,
      );
      turn.style.setProperty(
        "--turn-hint-opacity",
        `${Math.max(1 - easedProgress * 1.16, 0)}`,
      );
      turn.classList.toggle(
        "is-turning",
        rawProgress > 0.03 && rawProgress < 0.97,
      );
      turn.classList.toggle("is-turned", rawProgress >= 0.97);
    });
  };

  const update = () => {
    const maxScroll = root.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    const heroOffset = Math.min(window.scrollY * 0.045, 34);

    root.style.setProperty(
      "--scroll-progress",
      Math.min(Math.max(progress, 0), 1).toString(),
    );
    root.style.setProperty("--hero-parallax", `${heroOffset}px`);
    updatePageTurns();
    frame = 0;
  };

  const queueUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  const resetHeroPointer = () => {
    if (!heroVisual) return;
    heroVisual.classList.remove("is-interacting");
    heroVisual.style.setProperty("--hero-shift-x", "0px");
    heroVisual.style.setProperty("--hero-shift-y", "0px");
    heroVisual.style.setProperty("--hero-tilt-x", "0deg");
    heroVisual.style.setProperty("--hero-tilt-y", "0deg");
    heroVisual.style.setProperty("--network-shift-x", "0px");
    heroVisual.style.setProperty("--network-shift-y", "0px");
    heroVisual.style.setProperty("--glow-x", "52%");
    heroVisual.style.setProperty("--glow-y", "48%");
  };

  const onHeroPointerMove = (event) => {
    if (!heroVisual || pointerFrame) return;
    pointerFrame = window.requestAnimationFrame(() => {
      const rect = heroVisual.getBoundingClientRect();
      const normalizedX =
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const normalizedY =
        ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;

      heroVisual.classList.add("is-interacting");
      heroVisual.style.setProperty(
        "--hero-shift-x",
        `${normalizedX * 6}px`,
      );
      heroVisual.style.setProperty(
        "--hero-shift-y",
        `${normalizedY * 5}px`,
      );
      heroVisual.style.setProperty(
        "--hero-tilt-x",
        `${normalizedY * -3.5}deg`,
      );
      heroVisual.style.setProperty(
        "--hero-tilt-y",
        `${normalizedX * 4.5}deg`,
      );
      heroVisual.style.setProperty(
        "--network-shift-x",
        `${normalizedX * 9}px`,
      );
      heroVisual.style.setProperty(
        "--network-shift-y",
        `${normalizedY * 8}px`,
      );
      heroVisual.style.setProperty(
        "--glow-x",
        `${((normalizedX + 1) / 2) * 100}%`,
      );
      heroVisual.style.setProperty(
        "--glow-y",
        `${((normalizedY + 1) / 2) * 100}%`,
      );
      pointerFrame = 0;
    });
  };

  update();
  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
  heroVisual?.addEventListener("pointermove", onHeroPointerMove);
  heroVisual?.addEventListener("pointerleave", resetHeroPointer);
})();
