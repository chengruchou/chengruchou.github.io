(() => {
  const root = document.documentElement;
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
  const update = () => {
    const maxScroll = root.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    const heroOffset = Math.min(window.scrollY * 0.045, 34);

    root.style.setProperty(
      "--scroll-progress",
      Math.min(Math.max(progress, 0), 1).toString(),
    );
    root.style.setProperty("--hero-parallax", `${heroOffset}px`);
    frame = 0;
  };

  const queueUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
})();
