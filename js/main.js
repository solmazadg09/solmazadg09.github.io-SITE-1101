// Main JavaScript entry point for shared UI behaviors.
(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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
})();
