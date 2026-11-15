(() => {
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".primary-nav");
  const backToTop = document.querySelector(".back-to-top-floating");
  const contactForm = document.querySelector("#contact-form");
  const formStatus = document.querySelector("#form-status");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js-ready");

  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "باز کردن منو");
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "باز کردن منو" : "بستن منو");
    navigation.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  });

  const updateScrollState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
    backToTop.classList.toggle("is-visible", window.scrollY > 550);
  };
  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  const revealElements = document.querySelectorAll(
    ".section-heading, .about-copy, .about-facts, .skill-card, .timeline-entry, .project-card, .education-item, .certificate-card, .contact-copy, .contact-form"
  );

  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal", "is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

    revealElements.forEach((element) => {
      element.classList.add("reveal");
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const data = new FormData(contactForm);
    const name = data.get("name").toString().trim();
    const email = data.get("email").toString().trim();
    const message = data.get("message").toString().trim();
    const subject = encodeURIComponent(`پیام از وب‌سایت: ${name}`);
    const body = encodeURIComponent(`${message}\n\nنام: ${name}\nایمیل: ${email}`);

    formStatus.textContent = "برنامهٔ ایمیل شما با پیام آماده باز می‌شود…";
    window.location.href = `mailto:your.email@example.com?subject=${subject}&body=${body}`;
  });
})();
