  /* =========================================================
    FOR CHERRY — script.js
    PIN lock • ambient particles • scroll reveals • cake •
    memory slider • phrase reveal • music toggle • parallax
    ========================================================= */

  (() => {
    "use strict";

    const correctPassword = "2005";
    let enteredPin = "";

    /* Lock scroll immediately */
    document.body.style.overflow = "hidden";

    /* ---------------------------------------------------------
      1. AMBIENT PARTICLE SYSTEM (hearts, petals, dust, stars)
      --------------------------------------------------------- */
    const canvas = document.getElementById("ambient-canvas");
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function makeParticle() {
      const types = ["heart", "petal", "dust", "star"];
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        type,
        x: rand(0, canvas.width),
        y: rand(canvas.height * 0.2, canvas.height * 1.2),
        size: type === "dust" || type === "star" ? rand(1, 3) : rand(8, 20),
        speed: rand(0.15, 0.6),
        drift: rand(-0.35, 0.35),
        opacity: rand(0.15, 0.65),
        rotation: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.01, 0.01),
        blur: Math.random() < 0.4,
        phase: rand(0, Math.PI * 2),
      };
    }

    const PARTICLE_COUNT = window.innerWidth < 700 ? 55 : 110;
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(makeParticle());

    function drawHeart(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      if (p.blur) ctx.filter = "blur(2px)";
      const s = p.size / 20;
      ctx.fillStyle = "rgba(232,166,176,0.9)";
      ctx.beginPath();
      ctx.moveTo(0, 4 * s);
      ctx.bezierCurveTo(-10 * s, -6 * s, -18 * s, 4 * s, 0, 16 * s);
      ctx.bezierCurveTo(18 * s, 4 * s, 10 * s, -6 * s, 0, 4 * s);
      ctx.fill();
      ctx.restore();
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity * 0.8;
      if (p.blur) ctx.filter = "blur(1.5px)";
      ctx.fillStyle = "rgba(216,120,150,0.75)";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.5, p.size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawDust(p) {
      ctx.save();
      ctx.globalAlpha = p.opacity * 0.5;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawStar(p) {
      ctx.save();
      const tw = 0.5 + Math.sin(p.phase) * 0.5;
      ctx.globalAlpha = p.opacity * tw;
      ctx.fillStyle = "rgba(255,240,220,0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift + mouseX * 0.02;
        p.rotation += p.rotSpeed;
        p.phase += 0.03;

        if (p.y < -30) {
          p.y = canvas.height + 20;
          p.x = rand(0, canvas.width);
        }
        if (p.x < -30) p.x = canvas.width + 30;
        if (p.x > canvas.width + 30) p.x = -30;

        if (p.type === "heart") drawHeart(p);
        else if (p.type === "petal") drawPetal(p);
        else if (p.type === "dust") drawDust(p);
        else drawStar(p);
      }

      requestAnimationFrame(animateParticles);
    }
    animateParticles();

    window.addEventListener("mousemove", (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    /* subtle automatic drift on mobile instead of mouse parallax */
    if (window.matchMedia("(pointer: coarse)").matches) {
      let t = 0;
      setInterval(() => {
        t += 0.02;
        targetMouseX = Math.sin(t) * 0.4;
        targetMouseY = Math.cos(t * 0.7) * 0.4;
      }, 50);
    }

    /* ---------------------------------------------------------
      2. PIN SCREEN LOGIC
      --------------------------------------------------------- */
    const landing = document.getElementById("landing");
    const pinScreen = document.getElementById("pin-screen");
    const openBtn = document.getElementById("open-surprise");
    const pinDots = document.getElementById("pin-dots");
    const dots = pinDots.querySelectorAll(".dot");
    const pinMessage = document.getElementById("pin-message");
    const keypad = document.getElementById("keypad");
    const unlockOverlay = document.getElementById("unlock-overlay");
    const mainSite = document.getElementById("main-site");
    const musicToggleBtn = document.getElementById("music-toggle");

    openBtn.addEventListener("click", () => {
      landing.classList.add("hidden-screen");
      setTimeout(() => {
        pinScreen.classList.remove("hidden-screen");
      }, 250);
    });

    function updateDots() {
      dots.forEach((dot, i) => {
        dot.classList.toggle("filled", i < enteredPin.length);
      });
    }

    function resetPin(withError) {
      if (withError) {
        pinDots.classList.add("shake", "error");
        pinMessage.textContent = "Not quite... try again ❤️";
        setTimeout(() => {
          pinDots.classList.remove("shake", "error");
        }, 500);
      }
      enteredPin = "";
      updateDots();
    }

    function handleKey(key) {
      if (key === "del") {
        enteredPin = enteredPin.slice(0, -1);
        updateDots();
        return;
      }
      if (enteredPin.length >= 4) return;
      enteredPin += key;
      updateDots();

      if (enteredPin.length === 4) {
        if (enteredPin === correctPassword) {
          pinMessage.textContent = "";
          setTimeout(playUnlockSequence, 250);
        } else {
          setTimeout(() => resetPin(true), 220);
        }
      }
    }

    keypad.addEventListener("click", (e) => {
      const btn = e.target.closest(".key");
      if (!btn || btn.disabled) return;
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 140);
      handleKey(btn.dataset.key);
    });

    /* allow physical keyboard too */
    window.addEventListener("keydown", (e) => {
      if (pinScreen.classList.contains("hidden-screen")) return;
      if (/^[0-9]$/.test(e.key)) handleKey(e.key);
      if (e.key === "Backspace") handleKey("del");
    });

    function playUnlockSequence() {
      unlockOverlay.classList.add("playing");

      setTimeout(() => {
        pinScreen.classList.add("hidden-screen");
      }, 500);

      setTimeout(() => {
        mainSite.classList.add("visible");
        document.body.classList.add("unlocked");
        document.body.style.overflow = "auto";
        musicToggleBtn.classList.add("visible");
        initScrollReveal();
      }, 1300);

      setTimeout(() => {
        unlockOverlay.classList.remove("playing");
      }, 1900);
    }

    /* ---------------------------------------------------------
      3. SCROLL REVEAL (Intersection Observer)
      --------------------------------------------------------- */
    function initScrollReveal() {
      const roots = document.querySelectorAll("[data-reveal-root]");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
            }
          });
        },
        { threshold: 0.22 }
      );
      roots.forEach((root) => observer.observe(root));

      initTypewriter();
      initPhraseReveal();
    }

    /* ---------------------------------------------------------
      4. CAKE — MAKE A WISH
      --------------------------------------------------------- */
    const wishBtn = document.getElementById("wish-btn");
    const wishResult = document.getElementById("wish-result");
    const flames = ["flame-1", "flame-2", "flame-3"].map((id) => document.getElementById(id));

    wishBtn.addEventListener("click", () => {
      if (wishBtn.disabled) return;
      wishBtn.disabled = true;
      flames.forEach((f, i) => {
        setTimeout(() => f.classList.add("blown"), i * 180);
      });
      setTimeout(() => {
        wishResult.classList.add("show");
        burstHearts(wishBtn.getBoundingClientRect());
      }, 750);
    });

    function burstHearts(rect) {
      for (let i = 0; i < 18; i++) {
        particles.push({
          type: "heart",
          x: rect.left + rect.width / 2 + rand(-40, 40),
          y: rect.top + rand(-10, 10),
          size: rand(10, 18),
          speed: rand(0.8, 1.6),
          drift: rand(-0.6, 0.6),
          opacity: rand(0.6, 0.95),
          rotation: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.02, 0.02),
          blur: false,
          phase: 0,
        });
      }
      /* trim back down after a while so the field doesn't grow forever */
      setTimeout(() => { particles = particles.slice(-PARTICLE_COUNT * 2); }, 6000);
    }

    /* ---------------------------------------------------------
      5. TYPEWRITER LETTER
      --------------------------------------------------------- */
    function initTypewriter() {
      const lines = document.querySelectorAll(".typewriter-line");
      if (!lines.length) return;
      let started = false;

      const letterSection = document.querySelector(".letter-section");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            typeSequentially(Array.from(lines), 0);
          }
        });
      }, { threshold: 0.3 });
      observer.observe(letterSection);
    }

    function typeSequentially(lines, index) {
      if (index >= lines.length) return;
      const el = lines[index];
      const text = el.dataset.text;
      let i = 0;
      el.innerHTML = "";
      const cursor = document.createElement("span");
      cursor.className = "tw-cursor";
      cursor.textContent = "\u00A0";

      function step() {
        if (i <= text.length) {
          el.innerHTML = text.slice(0, i);
          el.appendChild(cursor);
          i += 2;
          requestAnimationFrame(() => setTimeout(step, 12));
        } else {
          el.innerHTML = text;
          setTimeout(() => typeSequentially(lines, index + 1), 260);
        }
      }
      step();
    }

    /* ---------------------------------------------------------
      6. MEMORY SLIDER (single image, side-slide)
      --------------------------------------------------------- */
    const slides = Array.from(document.querySelectorAll(".slide"));
    const sliderNext = document.getElementById("slider-next");
    const sDots = Array.from(document.querySelectorAll(".s-dot"));
    const slideCurrent = document.getElementById("slide-current");
    let currentSlide = 0;
    let sliderAnimating = false;

    function goToSlide(nextIndex) {
      if (sliderAnimating || nextIndex === currentSlide) return;
      sliderAnimating = true;

      const current = slides[currentSlide];
      const next = slides[nextIndex];

      current.classList.remove("active");
      current.classList.add("leaving");
      next.classList.add("entering");

      requestAnimationFrame(() => {
        next.classList.remove("entering");
        next.classList.add("active");
      });

      setTimeout(() => {
        current.classList.remove("leaving");
      }, 900);

      sDots.forEach((d, i) => d.classList.toggle("active", i === nextIndex));
      slideCurrent.textContent = nextIndex + 1;
      currentSlide = nextIndex;

      setTimeout(() => { sliderAnimating = false; }, 900);
    }

    sliderNext.addEventListener("click", () => {
      goToSlide((currentSlide + 1) % slides.length);
    });

    sDots.forEach((dot, i) => {
      dot.addEventListener("click", () => goToSlide(i));
    });

    /* swipe support */
    const slider = document.getElementById("slider");
    let touchStartX = 0;
    slider.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    slider.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) {
        goToSlide((currentSlide + 1) % slides.length);
      } else {
        goToSlide((currentSlide - 1 + slides.length) % slides.length);
      }
    }, { passive: true });

    /* ---------------------------------------------------------
      7. FULL-SCREEN PHRASE REVEAL
      --------------------------------------------------------- */
    function initPhraseReveal() {
      const phrases = Array.from(document.querySelectorAll(".phrase"));
      const section = document.getElementById("phrase-reveal");
      if (!phrases.length) return;
      let started = false;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            cyclePhrases(phrases, 0);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(section);
    }

    function cyclePhrases(phrases, i) {
      if (i > 0) phrases[i - 1].classList.remove("show");
      if (i >= phrases.length) return;
      phrases[i].classList.add("show");
      setTimeout(() => cyclePhrases(phrases, i + 1), 1500);
    }

    /* ---------------------------------------------------------
      8. MUSIC TOGGLE
      --------------------------------------------------------- */
    const music = document.getElementById("bg-music");
    let musicPlaying = false;

    musicToggleBtn.addEventListener("click", () => {
      if (musicPlaying) {
        music.pause();
        musicToggleBtn.classList.remove("playing");
      } else {
        music.play().catch(() => {
          /* file may be missing locally — fail silently */
        });
        musicToggleBtn.classList.add("playing");
      }
      musicPlaying = !musicPlaying;
    });

    /* ---------------------------------------------------------
      9. CARD / CAKE MOUSE PARALLAX (desktop only)
      --------------------------------------------------------- */
    if (!window.matchMedia("(pointer: coarse)").matches) {
      const cake = document.getElementById("cake");
      window.addEventListener("mousemove", (e) => {
        const relX = (e.clientX / window.innerWidth - 0.5) * 2;
        const relY = (e.clientY / window.innerHeight - 0.5) * 2;
        if (cake) {
          cake.style.transform = `rotateY(${relX * 10}deg) rotateX(${-relY * 4}deg)`;
        }
      });
    }
  })();
