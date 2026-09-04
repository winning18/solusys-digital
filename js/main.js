// Solusys Digital: shared site behavior

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initScrollReveal();
  initLightbox();
  initContactForm();
});

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

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const honeypot = form.querySelector("#website");

  const phoneField = form.querySelector("#phone");
  phoneField.addEventListener("input", () => {
    const digits = phoneField.value.replace(/\D/g, "").slice(0, 10);
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean);
    phoneField.value = parts.join("-");
  });

  form.addEventListener("submit", (e) => {
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

    const subject = `New enquiry from ${name}`;
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      `Service: ${service}`,
      budget ? `Budget: ${budget}` : null,
      "",
      message,
    ].filter((line) => line !== null);
    const body = bodyLines.join("\n");
    const mailtoLink = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.textContent = "Opening your email app to send this to Solusys Digital...";
    status.classList.add("show", "success");
    window.location.href = mailtoLink;
    form.reset();
  });
}
