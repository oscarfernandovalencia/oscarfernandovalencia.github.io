/**
 * Oscar Fernando Valencia — Ingeniero Civil
 * Pure Vanilla JavaScript (Zero Frameworks, High Performance)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- 1. Sticky Navbar & Mobile Toggle ---
  const siteNav = document.querySelector('.site-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky navbar shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      siteNav.classList.add('scrolled');
    } else {
      siteNav.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('bi-list');
        icon.classList.toggle('bi-x');
      }
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = navToggle.querySelector('i');
        if (icon) {
          icon.classList.add('bi-list');
          icon.classList.remove('bi-x');
        }
      });
    });
  }

  // --- 2. Active Link on Scroll (Intersection Observer) ---
  const sections = document.querySelectorAll('section[id], header[id]');
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => navObserver.observe(sec));

  // --- 3. Portfolio Category Filtering (Vanilla JS) ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterBtns.length > 0 && projectCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Active button style
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        projectCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filterValue === '*' || category.includes(filterValue)) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 250);
          }
        });
      });
    });
  }

  // --- 4. Pure Vanilla Lightbox Modal ---
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const zoomBtns = document.querySelectorAll('.project-zoom-btn');

  if (lightboxModal && lightboxImg && lightboxClose) {
    zoomBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const imgUrl = btn.getAttribute('data-img');
        const caption = btn.getAttribute('data-caption') || '';

        lightboxImg.src = imgUrl;
        lightboxCaption.textContent = caption;
        lightboxModal.classList.add('show');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeModal = () => {
      lightboxModal.classList.remove('show');
      lightboxImg.src = '';
      document.body.style.overflow = '';
    };

    lightboxClose.addEventListener('click', closeModal);

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('show')) {
        closeModal();
      }
    });
  }

  // --- 5. Pure Animated Metric Counters ---
  const metricNumbers = document.querySelectorAll('.metric-number');
  let animated = false;

  const animateCounters = () => {
    metricNumbers.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'), 10);
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 1500;
      const stepTime = 25;
      const steps = duration / stepTime;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target + suffix;
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current) + suffix;
        }
      }, stepTime);
    });
  };

  const metricsSection = document.querySelector('.metrics-grid');
  if (metricsSection) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateCounters();
        }
      });
    }, { threshold: 0.2 });

    counterObserver.observe(metricsSection);
  }
});