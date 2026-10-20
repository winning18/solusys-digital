// Solusys Digital: shared site behavior

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initScrollReveal();
  initLightbox();
  initContactForm();
  initScrollProgress();
  initHeaderScroll();
  initHeroParallax();
  initMagneticButtons();
  initCardSpotlight();
  initStatCounters();
  initFaqAccordion();
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

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

/* Hero: subtle parallax drift on the grid texture ========================= */

function initHeroParallax() {
  if (prefersReducedMotion) return;
  const hero = document.querySelector(".hero");
  const texture = hero ? hero.querySelector(".grid-texture") : null;
  if (!hero || !texture) return;

  let ticking = false;

  function update() {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      texture.style.transform = `translate3d(0, ${rect.top * -0.08}px, 0)`;
    }
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
