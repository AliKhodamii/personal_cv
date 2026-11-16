(() => {
  const root = document.documentElement;
  root.classList.add("js-views");

  const views = Array.from(document.querySelectorAll(".view"));
  const navLinks = Array.from(
    document.querySelectorAll('.primary-nav a[href^="#"]')
  );
  const viewAnchors = Array.from(
    document.querySelectorAll('a[href^="#"]')
  ).filter((a) => views.some((v) => v.id === a.getAttribute("href").slice(1)));
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".primary-nav");
  const backToTop = document.querySelector(".back-to-top-floating");
  const contactForm = document.querySelector("#contact-form");
  const formStatus = document.querySelector("#form-status");

  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "باز کردن منو");
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  const currentId = () => {
    const hash = decodeURIComponent(location.hash.slice(1));
    return views.some((v) => v.id === hash) ? hash : "home";
  };

  const showView = (id) => {
    views.forEach((v) => {
      const active = v.id === id;
      v.classList.toggle("is-active", active);
      v.setAttribute("aria-hidden", String(!active));
    });

    navLinks.forEach((a) => {
      if (a.getAttribute("href") === "#" + id) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });

    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (_) {
      window.scrollTo(0, 0);
    }
    closeMenu();
  };

  // Mobile menu toggle
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "باز کردن منو" : "بستن منو");
    navigation.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menuToggle.focus();
    }
  });

  // Panel switching (no-JS keeps anchors working natively)
  viewAnchors.forEach((a) => {
    a.addEventListener("click", (event) => {
      const id = a.getAttribute("href").slice(1);
      event.preventDefault();
      if (location.hash !== "#" + id) {
        try {
          history.pushState(null, "", "#" + id);
        } catch (_) {
          location.hash = id;
        }
      }
      showView(id);
    });
  });

  window.addEventListener("hashchange", () => showView(currentId()));
  window.addEventListener("popstate", () => showView(currentId()));

  // "Back to top" links scroll up without leaving the current view
  document.querySelectorAll('a[href="#top"]').forEach((a) => {
    a.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // Init
  showView(currentId());

  // Floating back-to-top visibility
  const updateScroll = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 550);
  };
  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  // Contact form -> mail client
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
    window.location.href = `mailto:s.alikhodami@gmail.com?subject=${subject}&body=${body}`;
  });
})();
