/**
 * We Travelled - Carousel Controller
 * Ashwa Racing - Brakes & Logistics Subsystem
 */

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.travel-slide');
  const dots = document.querySelectorAll('.travel-dot');
  const btnPrev = document.getElementById('travel-prev');
  const btnNext = document.getElementById('travel-next');
  const container = document.getElementById('travel-carousel');

  if (!slides.length) return;

  let activeIndex = 0;
  const total = slides.length;
  let autoplayTimer = null;
  const FALLBACK_IMG = "https://assets.ashwaracing.org/cdn-cgi/image/width=900,format=jpeg/images/prototypes/RZ-X8-H/event/10.jpg";

  // Attach fallback to all images
  slides.forEach(slide => {
    const img = slide.querySelector('.travel-img');
    if (img) {
      img.onerror = () => {
        img.src = FALLBACK_IMG;
      };
    }
  });

  function showSlide(index) {
    // Normalise index
    activeIndex = (index + total) % total;

    slides.forEach((slide, i) => {
      if (i === activeIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    dots.forEach((dot, i) => {
      if (i === activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function nextSlide() {
    showSlide(activeIndex + 1);
  }

  function prevSlide() {
    showSlide(activeIndex - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, 6000);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // Button listeners
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      nextSlide();
      startAutoplay();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      prevSlide();
      startAutoplay();
    });
  }

  // Dot listeners
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.to, 10);
      if (!isNaN(target)) {
        showSlide(target);
        startAutoplay();
      }
    });
  });

  // Pause on hover
  if (container) {
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
  }

  // Keyboard navigation when section is in view
  document.addEventListener('keydown', (e) => {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowRight') {
      nextSlide();
      startAutoplay();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
      startAutoplay();
    }
  });

  // Start
  showSlide(0);
  startAutoplay();
});
