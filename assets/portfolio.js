(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const narrowViewport = window.matchMedia("(max-width: 51.25rem)");
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const header = document.querySelector("[data-site-header]");
  const story = document.querySelector("[data-story]");
  const archive = document.querySelector(".archive");

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const onMediaChange = (query, listener) => {
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
    } else {
      query.addListener(listener);
    }
  };
  const smoothstep = (value) => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };

  const setupReveal = () => {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );

    items.forEach((item) => observer.observe(item));
  };

  const setupMobileNavigation = () => {
    const menu = document.querySelector(".mobile-nav");
    if (!menu) return;

    menu.addEventListener("toggle", () => {
      document.body.classList.toggle("is-menu-open", menu.open);
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.open = false;
      });
    });

    onMediaChange(narrowViewport, (event) => {
      if (!event.matches) {
        menu.open = false;
        document.body.classList.remove("is-menu-open");
      }
    });
  };

  const setupCursor = () => {
    const halo = document.querySelector(".cursor-halo");
    if (!halo || coarsePointer.matches || reducedMotion.matches) return;

    let x = -100;
    let y = -100;
    let renderedX = x;
    let renderedY = y;
    let frame = 0;

    const render = () => {
      renderedX += (x - renderedX) * 0.22;
      renderedY += (y - renderedY) * 0.22;
      halo.style.left = `${renderedX}px`;
      halo.style.top = `${renderedY}px`;

      if (Math.abs(x - renderedX) > 0.1 || Math.abs(y - renderedY) > 0.1) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        x = event.clientX;
        y = event.clientY;
        halo.classList.add("is-visible");
        if (!frame) frame = requestAnimationFrame(render);
      },
      { passive: true },
    );

    document.addEventListener("pointerleave", () => halo.classList.remove("is-visible"));

    document.querySelectorAll("a, summary").forEach((element) => {
      element.addEventListener("pointerenter", () => halo.classList.add("is-link"));
      element.addEventListener("pointerleave", () => halo.classList.remove("is-link"));
    });
  };

  const setupHeaderTheme = () => {
    if (!header || !archive) return;

    const darkSurfaces = [
      story,
      ...document.querySelectorAll(".selected-work, .path, .contact"),
    ].filter(Boolean);
    let pending = false;
    const update = () => {
      const sampleY = header.offsetHeight * 0.5;
      const isOverDark = darkSurfaces.some((surface) => {
        const rect = surface.getBoundingClientRect();
        return rect.top <= sampleY && rect.bottom >= sampleY;
      });
      header.classList.toggle("is-over-light", !isOverDark);
      pending = false;
    };

    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    update();
  };

  const loadImage = (source) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });

  const setupStory = async () => {
    const canvas = document.querySelector("[data-story-canvas]");
    const scenes = [...document.querySelectorAll("[data-scene]")];
    const railItems = [...document.querySelectorAll("[data-rail-item]")];
    const railProgress = document.querySelector("[data-rail-progress]");

    if (!story || !canvas || scenes.length < 2) return;

    let accessibleSceneIndex = -1;
    const setAccessibleScene = (activeIndex) => {
      if (activeIndex === accessibleSceneIndex) return;
      accessibleSceneIndex = activeIndex;
      scenes.forEach((scene, index) => {
        const isActive = index === activeIndex;
        scene.setAttribute("aria-hidden", String(!isActive));
        scene.toggleAttribute("inert", !isActive);
      });
    };
    const useStaticStory = () => {
      document.body.classList.add("story-static");
      accessibleSceneIndex = -1;
      scenes.forEach((scene) => {
        scene.removeAttribute("aria-hidden");
        scene.removeAttribute("inert");
      });
    };
    const reloadForStoryMode = () => window.location.reload();

    [reducedMotion, coarsePointer, narrowViewport].forEach((query) => {
      onMediaChange(query, reloadForStoryMode);
    });

    if (reducedMotion.matches || coarsePointer.matches || narrowViewport.matches || saveData) {
      useStaticStory();
      return;
    }

    setAccessibleScene(0);

    const sources = [
      "./assets/scene-perception.webp",
      "./assets/scene-spatiotemporal.webp",
      "./assets/scene-energy.webp",
    ];

    let assets;
    try {
      assets = await Promise.all(sources.map(loadImage));
    } catch (error) {
      useStaticStory();
      return;
    }

    const images = [assets[0], assets[1], assets[0], assets[2], assets[1]];
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      useStaticStory();
      return;
    }

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let pixelRatio = 1;
    let targetProgress = 0;
    let renderedProgress = 0;
    let animationFrame = 0;

    const resizeCanvas = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      const requestedRatio = Math.min(window.devicePixelRatio || 1, 1.6);
      const fourMegapixelRatio = Math.sqrt(4_000_000 / (viewportWidth * viewportHeight));
      pixelRatio = Math.min(requestedRatio, fourMegapixelRatio);
      canvas.width = Math.round(viewportWidth * pixelRatio);
      canvas.height = Math.round(viewportHeight * pixelRatio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const coverDimensions = (image, scale = 1) => {
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const viewportRatio = viewportWidth / viewportHeight;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;
      let sourceX = 0;
      let sourceY = 0;

      if (imageRatio > viewportRatio) {
        sourceWidth = image.naturalHeight * viewportRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = image.naturalWidth / viewportRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }

      const drawWidth = viewportWidth * scale;
      const drawHeight = viewportHeight * scale;
      return {
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        drawX: (viewportWidth - drawWidth) / 2,
        drawY: (viewportHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
      };
    };

    const drawCover = (image, alpha, scale = 1, offsetX = 0, offsetY = 0) => {
      const dimensions = coverDimensions(image, scale);
      context.globalAlpha = alpha;
      context.drawImage(
        image,
        dimensions.sourceX,
        dimensions.sourceY,
        dimensions.sourceWidth,
        dimensions.sourceHeight,
        dimensions.drawX + offsetX,
        dimensions.drawY + offsetY,
        dimensions.drawWidth,
        dimensions.drawHeight,
      );
    };

    const drawRefracted = (image, alpha, phase) => {
      const sliceCount = 10;
      const sliceWidth = viewportWidth / sliceCount;
      const intensity = Math.sin(Math.PI * phase);

      for (let index = 0; index < sliceCount; index += 1) {
        const x = index * sliceWidth;
        const direction = index % 2 === 0 ? 1 : -1;
        const wave = Math.sin(index * 1.45 + phase * Math.PI * 2);
        const offsetX = direction * intensity * (8 + Math.abs(wave) * 12);
        const offsetY = wave * intensity * 18;

        context.save();
        context.beginPath();
        context.rect(x - 1, 0, sliceWidth + 2, viewportHeight);
        context.clip();
        drawCover(image, alpha, 1.045 - phase * 0.025, offsetX, offsetY);
        context.restore();
      }
    };

    const render = (progress) => {
      const scenePosition = progress * (scenes.length - 1);
      const currentIndex = Math.min(Math.floor(scenePosition), scenes.length - 1);
      const nextIndex = Math.min(currentIndex + 1, scenes.length - 1);
      const phase = scenePosition - currentIndex;
      const easedPhase = smoothstep(phase);

      context.globalAlpha = 1;
      context.fillStyle = "#08090a";
      context.fillRect(0, 0, viewportWidth, viewportHeight);
      drawCover(images[currentIndex], 1, 1.015 + easedPhase * 0.025);

      if (nextIndex !== currentIndex && easedPhase > 0.002) {
        drawRefracted(images[nextIndex], easedPhase, easedPhase);
      }

      context.globalAlpha = 1;

      scenes.forEach((scene, index) => {
        const delta = index - scenePosition;
        const distance = Math.abs(delta);
        const opacity = clamp(1 - distance * 1.55);
        const translateY = clamp(delta, -1, 1) * 2.2;
        const blur = Math.min(distance * 0.75, 0.75);

        scene.style.opacity = opacity.toFixed(3);
        scene.style.transform = `translate3d(0, ${translateY.toFixed(3)}rem, 0)`;
        scene.style.filter = `blur(${blur.toFixed(3)}rem)`;
      });

      const activeIndex = Math.round(scenePosition);
      scenes.forEach((scene, index) => scene.classList.toggle("is-active", index === activeIndex));
      setAccessibleScene(activeIndex);
      railItems.forEach((item, index) => item.classList.toggle("is-active", index === activeIndex));
      if (railProgress) railProgress.style.height = `${(progress * 100).toFixed(2)}%`;
    };

    const tick = () => {
      renderedProgress += (targetProgress - renderedProgress) * 0.11;
      if (Math.abs(targetProgress - renderedProgress) < 0.00015) {
        renderedProgress = targetProgress;
      }

      render(renderedProgress);

      if (renderedProgress !== targetProgress) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        animationFrame = 0;
      }
    };

    const updateTarget = () => {
      const start = story.offsetTop;
      const distance = Math.max(1, story.offsetHeight - window.innerHeight);
      targetProgress = clamp((window.scrollY - start) / distance);
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    };

    const handleResize = () => {
      resizeCanvas();
      updateTarget();
      render(renderedProgress);
    };

    resizeCanvas();
    updateTarget();
    render(0);

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

  };

  setupReveal();
  setupMobileNavigation();
  setupCursor();
  setupHeaderTheme();
  setupStory();
})();
