/* GestMed — interações sem dependências externas */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const mainMenu = document.querySelector(".main-nav");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cabeçalho ganha presença sutil depois da primeira dobra.
  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 16);
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

  // Fecha os demais itens do FAQ quando um novo é aberto, mantendo a leitura objetiva.
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqItems.forEach((other) => { if (other !== item) other.removeAttribute("open"); });
    });
  });

  // Entrada discreta de seções conforme entram no viewport.
  const revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: "0px 0px -20px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Contagem dos indicadores com efeito visual aprimorado.
  const statNumbers = document.querySelectorAll(".stat-number");
  const animateStat = (element, delay) => {
    if (element.dataset.animated === "true") return;
    element.dataset.animated = "true";
    const target = Number(element.dataset.target);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    if (reduceMotion) {
      element.textContent = `${prefix}${target}${suffix}`;
      return;
    }
    element.textContent = `${prefix}0${suffix}`;
    setTimeout(() => {
      element.classList.add("is-counting");
      const duration = 1800;
      const start = performance.now();
      const updateNumber = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        // easeOutExpo for a dramatic fast-start, slow-finish effect
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        element.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          element.classList.remove("is-counting");
        }
      };
      requestAnimationFrame(updateNumber);
    }, delay);
  };

  if ("IntersectionObserver" in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Animate stat items entrance with stagger
          const items = entry.target.querySelectorAll(".stat-item");
          items.forEach((item, i) => {
            setTimeout(() => item.classList.add("is-visible"), i * 150);
          });
          // Animate numbers with stagger after items appear
          entry.target.querySelectorAll(".stat-number").forEach((num, i) => {
            animateStat(num, i * 200 + 300);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .25 });
    const strip = document.querySelector(".stats-strip");
    if (strip) statsObserver.observe(strip);
  } else {
    document.querySelectorAll(".stat-item").forEach(item => item.classList.add("is-visible"));
    statNumbers.forEach((num) => animateStat(num, 0));
  }

  // Carrossel de depoimentos: controles e gesto horizontal em telas pequenas.
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

  // Validação de front-end. Integre o envio a uma API/serviço de e-mail aqui futuramente.
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
});
