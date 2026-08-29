/* GestMed — interações */
const init = () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const mainMenu = document.querySelector(".main-nav");

  // Cabeçalho ganha presença sutil depois da primeira dobra.
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 16);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Menu mobile acessível.
  const closeMenu = () => {
    menuButton?.setAttribute("aria-expanded", "false");
    mainMenu?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mainMenu.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  mainMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => { if (window.innerWidth > 720) closeMenu(); });

  // Fecha os demais itens do FAQ quando um novo é aberto.
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqItems.forEach((other) => { if (other !== item) other.removeAttribute("open"); });
    });
  });

  // Entrada suave das seções (Reveal on Scroll)
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Animação de contagem dos números (Stats)
  const animateCounter = (el) => {
    if (el.dataset.animated === "true") return;
    el.dataset.animated = "true";

    const target = parseFloat(el.dataset.target) || 0;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = 1800; // 1.8 segundos de animação
    const startTime = performance.now();

    el.textContent = `${prefix}0${suffix}`;
    el.classList.add("is-counting");

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing suave (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * ease);
      el.textContent = `${prefix}${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${prefix}${target}${suffix}`;
        el.classList.remove("is-counting");
      }
    };

    requestAnimationFrame(update);
  };

  // Observer para a seção de estatísticas (Stats Strip)
  const statItems = document.querySelectorAll(".stat-item");
  if ("IntersectionObserver" in window && statItems.length > 0) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          const num = entry.target.querySelector(".stat-number");
          if (num) {
            animateCounter(num);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -20px 0px" });

    statItems.forEach((item) => statsObserver.observe(item));
  } else {
    statItems.forEach((item) => {
      item.classList.add("is-visible");
      const num = item.querySelector(".stat-number");
      if (num) animateCounter(num);
    });
  }

  // Carrossel de depoimentos
  const track = document.querySelector(".testimonials-track");
  const viewport = document.querySelector(".testimonials-viewport");
  const previous = document.querySelector(".carousel-button.previous");
  const next = document.querySelector(".carousel-button.next");
  let activeSlide = 0;
  let touchStartX = 0;
  const testimonials = track ? Array.from(track.children) : [];

  const updateCarousel = () => {
    if (!track || !testimonials.length || window.innerWidth > 720) {
      if (track) track.style.transform = "";
      return;
    }
    const card = testimonials[0];
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const cardWidth = card.getBoundingClientRect().width + gap;
    track.style.transform = `translateX(-${activeSlide * cardWidth}px)`;
  };
  const moveCarousel = (direction) => {
    if (!testimonials.length) return;
    if (window.innerWidth > 720) return;
    activeSlide = (activeSlide + direction + testimonials.length) % testimonials.length;
    updateCarousel();
  };
  previous?.addEventListener("click", () => moveCarousel(-1));
  next?.addEventListener("click", () => moveCarousel(1));
  viewport?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") moveCarousel(-1);
    if (event.key === "ArrowRight") moveCarousel(1);
  });
  viewport?.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  viewport?.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 45) moveCarousel(distance < 0 ? 1 : -1);
  }, { passive: true });
  window.addEventListener("resize", updateCarousel);

  // Validação do formulário de contato
  const form = document.querySelector("#contact-form");
  const feedback = document.querySelector("#form-feedback");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = Array.from(form.querySelectorAll("[required]"));
    let isValid = true;
    fields.forEach((field) => {
      const invalid = !field.value.trim() || (field.type === "email" && !field.validity.valid);
      field.setAttribute("aria-invalid", String(invalid));
      if (invalid) isValid = false;
    });
    if (!isValid) {
      feedback.textContent = "Revise os campos obrigatórios destacados antes de enviar.";
      feedback.classList.remove("success");
      form.querySelector("[aria-invalid=\"true\"]")?.focus();
      return;
    }
    feedback.textContent = "Solicitação registrada nesta demonstração. Integre este formulário ao seu serviço de atendimento antes da publicação.";
    feedback.classList.add("success");
    form.reset();
  });
  form?.querySelectorAll("input, textarea").forEach((field) => field.addEventListener("input", () => field.setAttribute("aria-invalid", "false")));

  const year = document.querySelector("#current-year");
  if (year) year.textContent = new Date().getFullYear();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
