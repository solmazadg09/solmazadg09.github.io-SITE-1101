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

  // ---------------------------------------------------------
  // PROJECT DETAILS MODAL: open card for full details
  // ---------------------------------------------------------
  const modal = document.getElementById("projectModal");
  const modalClose = document.getElementById("projectModalClose");
  const modalTitle = document.getElementById("projectModalTitle");
  const modalDescription = document.getElementById("projectModalDescription");
  const modalImages = document.getElementById("projectModalImages");
  const modalDetails = document.getElementById("projectModalDetails");
  const projectCards = document.querySelectorAll(".project-card");

  if (modal && modalClose && modalTitle && modalDescription && modalImages && modalDetails && projectCards.length) {
    const projectData = {
      project1: {
        title: "Portfolio Website",
        description:
          "A multi-page portfolio built with semantic HTML, modern CSS, and JavaScript interactions.",
        images: ["Home Hero Preview", "Responsive Layout Preview"],
        details: [
          "Includes shared responsive navbar and footer across all pages.",
          "Features smooth hover interactions, card animations, and clean spacing rhythm.",
          "Designed to remain stable and readable on desktop, tablet, and mobile.",
        ],
      },
      hourOfCode: {
        title: "Hour of Code",
        description:
          "A practice-focused project where I applied JavaScript basics to small interactive tasks.",
        images: ["Logic Exercise Screenshot", "UI Output Screenshot"],
        details: [
          "Focused on conditionals, loops, and event-driven interactions.",
          "Used small milestones to validate logic and improve debugging workflow.",
          "Built to reinforce coding fundamentals with practical examples.",
        ],
      },
      robotics: {
        title: "Robotics",
        description:
          "A robotics activity combining hands-on prototyping and software logic for control flow.",
        images: ["Prototype Build Photo", "Control Logic Diagram"],
        details: [
          "Documented build steps, experiments, and final behavior outcomes.",
          "Combined iterative testing with problem solving for reliability.",
          "Highlights teamwork, STEM thinking, and practical implementation.",
        ],
      },
    };

    const closeModal = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    const openModal = (projectId) => {
      const data = projectData[projectId];
      if (!data) return;

      modalTitle.textContent = data.title;
      modalDescription.textContent = data.description;
      modalImages.innerHTML = data.images
        .map((label) => `<div class="detail-image" role="img" aria-label="${label}">${label}</div>`)
        .join("");
      modalDetails.innerHTML = data.details.map((item) => `<li>${item}</li>`).join("");

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    projectCards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      card.addEventListener("click", () => openModal(card.dataset.project));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(card.dataset.project);
        }
      });
    });

    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }
})();
