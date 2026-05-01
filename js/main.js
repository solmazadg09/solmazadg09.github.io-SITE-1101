// Main JavaScript entry point for shared UI behaviors.
(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------------------------------------------
  // NAVBAR: white + shadow on scroll, mobile menu
  // ---------------------------------------------
  const header = document.querySelector(".site-header");
  const setScrolled = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    const setOpen = (open) => {
      navMenu.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.classList.toggle("open", open);

      const lines = navToggle.querySelectorAll(".nav-toggle-lines span");
      if (lines.length === 3) {
        lines[0].style.top = open ? "5px" : "0";
        lines[1].style.opacity = open ? "0" : "1";
        lines[2].style.top = open ? "5px" : "10px";
        lines[0].style.transform = open ? "rotate(45deg)" : "rotate(0deg)";
        lines[2].style.transform = open ? "rotate(-45deg)" : "rotate(0deg)";
      }
    };

    navToggle.addEventListener("click", () => setOpen(!navMenu.classList.contains("open")));

    // Close when clicking a menu link (mobile)
    navMenu.addEventListener("click", (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.closest("a")) setOpen(false);
    });

    // Close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // ---------------------------------------------------------
  // HERO: typing animation cycling through a list of titles
  // ---------------------------------------------------------
  // Typing animation (optional per page)
  const typingEl = document.getElementById("typing");
  if (typingEl) {
    const raw = typingEl.getAttribute("data-words") || "";
    let words = [];
    try {
      words = JSON.parse(raw);
    } catch {
      words = ["Student", "Web Developer", "Creator"];
    }

    let wordIdx = 0;
    let charIdx = 0;
    let deleting = false;

    const tick = () => {
      const word = String(words[wordIdx] ?? "");
      const target = deleting ? word.slice(0, Math.max(0, charIdx - 1)) : word.slice(0, charIdx + 1);
      typingEl.textContent = target;

      if (!deleting) {
        charIdx++;
        if (charIdx >= word.length) {
          deleting = true;
          setTimeout(tick, 900);
          return;
        }
      } else {
        charIdx--;
        if (charIdx <= 0) {
          deleting = false;
          wordIdx = (wordIdx + 1) % words.length;
        }
      }

      const delay = deleting ? 55 : 75;
      setTimeout(tick, delay);
    };

    tick();
  }

  // ---------------------------------------------------------
  // HERO: text scramble on name (1.5s resolve)
  // ---------------------------------------------------------
  const heroName = document.getElementById("heroName");
  if (heroName) {
    const finalText = heroName.getAttribute("data-text") || heroName.textContent || "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=?";
    const durationMs = 1500;
    const frameMs = 30;

    const startAt = performance.now();
    const len = finalText.length;

    const scrambleFrame = (now) => {
      const t = Math.min(1, (now - startAt) / durationMs);
      const revealCount = Math.floor(t * len);

      let out = "";
      for (let i = 0; i < len; i++) {
        if (i < revealCount) out += finalText[i];
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      heroName.textContent = out;

      if (t < 1) requestAnimationFrame(scrambleFrame);
      else heroName.textContent = finalText;
    };

    requestAnimationFrame(scrambleFrame);
  }

  // ---------------------------------------------------------
  // MAGNETIC BUTTONS: hero CTAs gently follow cursor
  // ---------------------------------------------------------
  const magneticButtons = document.querySelectorAll(".magnetic");
  magneticButtons.forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;

    const max = 15;
    const onMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      const tx = Math.max(-max, Math.min(max, (dx / rect.width) * max * 2));
      const ty = Math.max(-max, Math.min(max, (dy / rect.height) * max * 2));

      btn.style.transition = "transform 0.15s ease";
      btn.style.transform = `translate(${tx}px, ${ty}px)`;
    };

    const onLeave = () => {
      btn.style.transition = "transform 0.5s ease";
      btn.style.transform = "translate(0px, 0px)";
    };

    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
  });

  // ---------------------------------------------------------
  // PROJECT CARD SPOTLIGHT: radial glow follows the cursor
  // ---------------------------------------------------------
  const spotlightCards = document.querySelectorAll(".card");
  spotlightCards.forEach((card) => {
    if (!(card instanceof HTMLElement)) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });

  // ---------------------------------------------------------
  // SMOOTH SCROLL REVEAL: fade in + slide up on enter viewport
  // ---------------------------------------------------------
  const revealTargets = [
    ...document.querySelectorAll(".section, .section-header, .section-title, h1, h2, h3, .card, .skill-pill, .ring-photo, .hero-actions"),
  ].filter((el) => el instanceof HTMLElement);

  revealTargets.forEach((el) => el.classList.add("reveal"));

  // Stagger cards by 100ms inside each .cards group
  document.querySelectorAll(".cards").forEach((cardsEl) => {
    const cards = cardsEl.querySelectorAll(".card");
    cards.forEach((c, i) => {
      if (c instanceof HTMLElement) c.style.transitionDelay = `${i * 100}ms`;
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!(entry.target instanceof HTMLElement)) return;
        if (entry.isIntersecting) entry.target.classList.add("in-view");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  revealTargets.forEach((el) => io.observe(el));
})();
