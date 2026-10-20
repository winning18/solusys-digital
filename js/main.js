// Solusys Digital: shared site behavior

document.addEventListener("DOMContentLoaded", () => {
  initIntroSequence();
  initCustomCursor();
  initNavToggle();
  initScrollReveal();
  initLightbox();
  initContactForm();
  initScrollProgress();
  initHeaderScroll();
  initHeroScrollParallax();
  initHeroFloatParallax();
  initHeroWorkCarousel();
  initMagneticButtons();
  initCardSpotlight();
  initStatCounters();
  initFaqAccordion();
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
const hasGSAP = typeof gsap !== "undefined";

/* Mobile nav toggle ================================================== */

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* Scroll reveal ======================================================== */

function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  // Stagger siblings that reveal together inside the same grid, so a row of
  // cards cascades in instead of popping in all at once.
  items.forEach((el) => {
    const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal")) : [];
    const index = siblings.indexOf(el);
    if (index > 0) {
      el.style.transitionDelay = `${Math.min(index * 70, 420)}ms`;
    }
  });

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

/* Scroll progress bar ==================================================== */

function initScrollProgress() {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;

  let ticking = false;

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}

/* Header: background/shadow once scrolled ================================ */

function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  function update() {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }

  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* Preloader + hero reveal ===================================================
   On first visit this session: runs a GSAP timeline (cycling word, 0-100
   counter, progress bar) then wipes away and reveals the hero. On repeat
   views (sessionStorage flag, already set synchronously inline in the HTML
   before this runs) or if GSAP failed to load, skips straight to reveal. */

function initIntroSequence() {
  const preloader = document.getElementById("preloader");
  const heroTargets = document.querySelectorAll(".hero-inner > *");

  function revealHero(delay) {
    if (!hasGSAP) {
      heroTargets.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    } else {
      gsap.to(heroTargets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        delay: delay || 0,
      });
    }
    initHeroFloatEntrance();
  }

  if (!preloader) {
    revealHero(0);
    return;
  }

  const alreadySkipped = preloader.style.display === "none";

  if (prefersReducedMotion || alreadySkipped || !hasGSAP) {
    preloader.style.display = "none";
    document.documentElement.classList.remove("is-preloading");
    try {
      sessionStorage.setItem("solusys-visited", "1");
    } catch (e) {}
    revealHero(prefersReducedMotion || alreadySkipped ? 0 : 0.1);
    return;
  }

  try {
    sessionStorage.setItem("solusys-visited", "1");
  } catch (e) {}

  const words = ["Design", "Build", "Automate", "Secure"];
  const wordEl = document.getElementById("preloader-word");
  const countEl = document.getElementById("preloader-count");
  const barEl = document.getElementById("preloader-bar-fill");

  let wordIndex = 0;
  const wordInterval = setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    if (wordEl) wordEl.textContent = words[wordIndex];
  }, 420);

  function finish() {
    clearInterval(wordInterval);
    preloader.style.display = "none";
    document.documentElement.classList.remove("is-preloading");
    revealHero(0);
  }

  const counter = { value: 0 };
  const tl = gsap.timeline({ onComplete: finish });

  tl.to(counter, {
    value: 100,
    duration: 1.6,
    ease: "power2.inOut",
    onUpdate: () => {
      if (countEl) countEl.textContent = String(Math.round(counter.value));
      if (barEl) barEl.style.width = `${counter.value}%`;
    },
  }).to(
    preloader,
    {
      yPercent: -100,
      duration: 0.7,
      ease: "power3.inOut",
    },
    "+=0.1"
  );

  preloader.addEventListener("click", () => tl.progress(1));
}

/* Custom cursor: dot + lagging ring + ambient glow ========================= */

function initCustomCursor() {
  if (prefersReducedMotion || !hasFinePointer) return;
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  const glow = document.getElementById("cursor-glow");
  if (!dot || !ring || !glow) return;

  document.body.classList.add("has-custom-cursor");

  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    dot.classList.add("active");
    ring.classList.add("active");
    glow.classList.add("active");
  }

  if (hasGSAP) {
    gsap.set([dot, ring, glow], { xPercent: -50, yPercent: -50 });
    const moveDot = { x: gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" }), y: gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" }) };
    const moveRing = { x: gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" }), y: gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" }) };
    const moveGlow = { x: gsap.quickTo(glow, "x", { duration: 0.6, ease: "power3" }), y: gsap.quickTo(glow, "y", { duration: 0.6, ease: "power3" }) };

    window.addEventListener(
      "mousemove",
      (e) => {
        reveal();
        moveDot.x(e.clientX);
        moveDot.y(e.clientY);
        moveRing.x(e.clientX);
        moveRing.y(e.clientY);
        moveGlow.x(e.clientX);
        moveGlow.y(e.clientY);
      },
      { passive: true }
    );
  } else {
    window.addEventListener(
      "mousemove",
      (e) => {
        reveal();
        const t = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        dot.style.transform = t;
        ring.style.transform = t;
        glow.style.transform = t;
      },
      { passive: true }
    );
  }

  document.querySelectorAll("a, button, .btn, .card, summary").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
  });
}

/* Hero: scroll-linked parallax on the grid texture (GSAP ScrollTrigger) ==== */

function initHeroScrollParallax() {
  if (prefersReducedMotion || !hasGSAP || typeof ScrollTrigger === "undefined") return;
  const hero = document.querySelector(".hero");
  const texture = hero ? hero.querySelector(".grid-texture") : null;
  if (!hero || !texture) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.to(texture, {
    y: 60,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });
}

/* Hero: floating project-screenshot stack — cursor parallax + entrance ==== */

function initHeroFloatParallax() {
  if (prefersReducedMotion || !hasFinePointer || !hasGSAP) return;
  const hero = document.querySelector(".hero");
  const cards = document.querySelectorAll(".hero-float-card");
  if (!hero || !cards.length) return;

  const movers = Array.from(cards).map((card, i) => {
    const depth = (i + 1) * 6;
    return {
      x: gsap.quickTo(card, "x", { duration: 0.5, ease: "power3" }),
      y: gsap.quickTo(card, "y", { duration: 0.5, ease: "power3" }),
      depth,
    };
  });

  hero.addEventListener(
    "mousemove",
    (e) => {
      const rect = hero.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      movers.forEach((m) => {
        m.x(relX * m.depth * 2);
        m.y(relY * m.depth * 2);
      });
    },
    { passive: true }
  );
}

function initHeroFloatEntrance() {
  if (!hasGSAP) {
    document.querySelectorAll(".hero-float-card, .hero-work-card").forEach((el) => {
      el.style.opacity = "1";
    });
    return;
  }
  const cards = document.querySelectorAll(".hero-float-card");
  const workCard = document.getElementById("hero-work-card");
  if (cards.length) {
    gsap.to(cards, { opacity: 1, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.3 });
  }
  if (workCard) {
    gsap.fromTo(workCard, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.6 });
  }
}

/* Hero: "Recent Work" card auto-advancing carousel ========================= */

function initHeroWorkCarousel() {
  const slidesContainer = document.getElementById("hero-work-slides");
  const dotsContainer = document.getElementById("hero-work-dots");
  if (!slidesContainer || !dotsContainer) return;

  const slides = Array.from(slidesContainer.querySelectorAll(".hero-work-slide"));
  if (!slides.length) return;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "hero-work-dot" + (i === 0 ? " active" : "");
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.children);

  let active = 0;
  setInterval(() => {
    const next = (active + 1) % slides.length;
    slides[active].classList.remove("active");
    dots[active].classList.remove("active");
    slides[next].classList.add("active");
    dots[next].classList.add("active");
    active = next;
  }, 3200);
}

/* Magnetic buttons ========================================================= */

function initMagneticButtons() {
  if (prefersReducedMotion || !hasFinePointer) return;
  const buttons = document.querySelectorAll(".btn");
  if (!buttons.length) return;

  const strength = 0.25;
  const maxOffset = 8;

  buttons.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-maxOffset, Math.min(maxOffset, relX * strength));
      const y = Math.max(-maxOffset, Math.min(maxOffset, relY * strength));
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

/* Card spotlight: cursor-tracked gradient border =========================== */

function initCardSpotlight() {
  if (!hasFinePointer) return;
  const cards = document.querySelectorAll(".card");
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });
}

/* Stats: count up when scrolled into view ================================= */

function initStatCounters() {
  const values = document.querySelectorAll(".stats .stat-value");
  if (!values.length) return;

  function animateValue(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\d+)(.*)$/);
    if (!match) return;

    const target = parseInt(match[1], 10);
    const suffix = match[2];

    if (prefersReducedMotion) {
      el.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const current = Math.round(target * eased);
      el.textContent = `${current}${suffix}`;
      if (elapsed < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (!("IntersectionObserver" in window)) {
    values.forEach(animateValue);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  values.forEach((el) => observer.observe(el));
}

/* FAQ accordion: animated open/close instead of the native jump ===========
   <details> content is forced display:none by the browser whenever the
   `open` attribute is absent, no author CSS can override that. So closing
   has to happen in two steps: remove the `.open` class first (animates the
   content closed while `open` is still present and content still rendered),
   then remove the `open` attribute once that transition finishes. */

function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const summary = item.querySelector("summary");
    const answer = item.querySelector("p");
    if (!summary || !answer) return;

    summary.addEventListener("click", (e) => {
      e.preventDefault();

      if (item.open) {
        item.classList.remove("open");
        const onEnd = (ev) => {
          if (ev.target !== answer) return;
          item.open = false;
          answer.removeEventListener("transitionend", onEnd);
        };
        answer.addEventListener("transitionend", onEnd);
      } else {
        item.open = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => item.classList.add("open"));
        });
      }
    });
  });
}

/* Lightbox ================================================================ */

function initLightbox() {
  const lightbox = document.querySelector("#lightbox");
  if (!lightbox) return;

  const lightboxImage = lightbox.querySelector(".lightbox-image");
  const lightboxVideo = lightbox.querySelector(".lightbox-video");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  const prevBtn = lightbox.querySelector(".lightbox-prev");
  const nextBtn = lightbox.querySelector(".lightbox-next");

  const thumbs = Array.from(document.querySelectorAll(".project-card"))
    .filter((card) => card.tagName !== "A")
    .map((card) => card.querySelector(".project-thumb"))
    .filter(Boolean);

  const media = thumbs.map((thumb) => {
    if (thumb.dataset.video) {
      return { type: "video", src: thumb.dataset.video, thumb };
    }
    const img = thumb.querySelector("img");
    return img ? { type: "image", src: img.src, alt: img.alt, thumb } : null;
  }).filter(Boolean);

  if (!media.length) return;

  media.forEach((item) => item.thumb.classList.add("lightbox-enabled"));

  let currentIndex = 0;

  function show(index) {
    lightboxVideo.pause();
    currentIndex = (index + media.length) % media.length;
    const item = media[currentIndex];

    if (item.type === "video") {
      lightboxImage.hidden = true;
      lightboxVideo.hidden = false;
      lightboxVideo.src = item.src;
      lightboxVideo.play();
    } else {
      lightboxVideo.hidden = true;
      lightboxVideo.removeAttribute("src");
      lightboxImage.hidden = false;
      lightboxImage.src = item.src;
      lightboxImage.alt = item.alt;
    }
  }

  function open(index) {
    show(index);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lightboxVideo.pause();
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  media.forEach((item, index) => {
    item.thumb.addEventListener("click", () => open(index));
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(currentIndex - 1));
  nextBtn.addEventListener("click", () => show(currentIndex + 1));

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") show(currentIndex + 1);
    if (e.key === "ArrowLeft") show(currentIndex - 1);
  });
}

/* Contact form validation =============================================== */

const BUSINESS_EMAIL = "info@solusysdigital.com";
const WEB3FORMS_ACCESS_KEY = "c6008d3a-efb3-4c4c-bb79-d7769f072250";

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const honeypot = form.querySelector("#website");
  const submitBtn = form.querySelector('button[type="submit"]');

  const phoneField = form.querySelector("#phone");
  phoneField.addEventListener("input", () => {
    const digits = phoneField.value.replace(/\D/g, "").slice(0, 10);
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean);
    phoneField.value = parts.join("-");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (honeypot && honeypot.value) {
      return;
    }

    let valid = true;
    let firstInvalidField = null;
    const missingLabels = [];

    function fieldLabel(field) {
      const label = field.closest(".field").querySelector("label");
      return label ? label.textContent.replace("*", "").trim() : field.name;
    }

    form.querySelectorAll("[data-required]").forEach((field) => {
      const wrapper = field.closest(".field");
      const value = field.value.trim();
      let fieldValid = value.length > 0;

      if (field.type === "tel" && value) {
        fieldValid = /^\d{3}-\d{3}-\d{4}$/.test(value);
      }

      wrapper.classList.toggle("invalid", !fieldValid);
      if (!fieldValid) {
        valid = false;
        missingLabels.push(fieldLabel(field));
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    const emailField = form.querySelector("#email");
    const emailValue = emailField.value.trim();
    if (emailValue) {
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
      emailField.closest(".field").classList.toggle("invalid", !emailValid);
      if (!emailValid) {
        valid = false;
        missingLabels.push(fieldLabel(emailField));
        if (!firstInvalidField) firstInvalidField = emailField;
      }
    } else {
      emailField.closest(".field").classList.remove("invalid");
    }

    if (!valid) {
      status.textContent = `Please fill in: ${missingLabels.join(", ")}.`;
      status.classList.remove("success");
      status.classList.add("show");
      firstInvalidField.focus();
      firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const name = form.querySelector("#name").value.trim();
    const email = form.querySelector("#email").value.trim();
    const phone = form.querySelector("#phone").value.trim();
    const serviceField = form.querySelector("#service");
    const service = serviceField.options[serviceField.selectedIndex].text;
    const budgetField = form.querySelector("#budget");
    const budget = budgetField.value ? budgetField.options[budgetField.selectedIndex].text : "";
    const message = form.querySelector("#message").value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    status.classList.remove("show", "success");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New enquiry from ${name}`,
          from_name: name,
          name,
          email,
          phone,
          service,
          budget,
          message,
        }),
      });
      const result = await response.json();

      if (result.success) {
        status.textContent = "Thanks! Your message has been sent. We'll get back to you shortly.";
        status.classList.add("show", "success");
        form.reset();
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (err) {
      status.textContent = `Something went wrong sending your message. Please email us directly at ${BUSINESS_EMAIL}.`;
      status.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
}
