/**
 * ==========================================================================
 * SISTEMA INTERACTIVO DE PREVISUALIZACIÓN DE VIDEOS - ESTILO GÓTICO NEÓN
 * Ingeniería J&M / INVIAS - Rodando la Vía
 * ==========================================================================
 */

(function () {
  'use strict';

  // Extraer ID de YouTube y timestamp de una URL
  function parseYouTubeUrl(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    const videoId = match ? match[1] : null;

    let startTime = 0;
    const timeMatch = url.match(/[?&]t=(\d+)s?/i);
    if (timeMatch) {
      startTime = parseInt(timeMatch[1], 10) || 0;
    }

    return videoId ? { id: videoId, startTime: startTime } : null;
  }

  // Extraer mes y año a partir del texto del enlace
  function extractDateInfo(text) {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const lower = text.toLowerCase();
    let month = '';
    let year = '';

    for (const m of months) {
      if (lower.includes(m)) {
        month = m.charAt(0).toUpperCase() + m.slice(1);
        break;
      }
    }

    const yearMatch = text.match(/\b(202\d)\b/);
    if (yearMatch) {
      year = yearMatch[1];
    }

    return {
      month: month || 'Registro',
      year: year || 'General',
      fullDate: month && year ? `${month} ${year}` : text
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    const rawList = document.querySelector('ul.raw-video-list, ul:not(.gothic-nav-links):not(.modal-nav-btns)');
    const targetGrid = document.getElementById('videosGrid');

    // Lista de datos de videos
    let videosData = [];

    // Si existe una lista clásica de enlaces (ul > li > a), transformarla dinámicamente
    if (rawList && targetGrid && targetGrid.children.length === 0) {
      const links = rawList.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]');
      let index = 1;

      links.forEach((a) => {
        const href = a.getAttribute('href');
        const text = a.textContent.trim();
        const ytInfo = parseYouTubeUrl(href);

        if (ytInfo) {
          const dateInfo = extractDateInfo(text);
          videosData.push({
            id: ytInfo.id,
            startTime: ytInfo.startTime,
            title: text,
            month: dateInfo.month,
            year: dateInfo.year,
            originalUrl: href,
            seq: index++
          });
        }
      });

      // Ocultar la lista cruda ya que tenemos la cuadrícula gótica
      rawList.style.display = 'none';

      // Renderizar las tarjetas
      renderCards(videosData, targetGrid);
    } else if (targetGrid) {
      // Recopilar información de las tarjetas pre-renderizadas en el DOM
      const cardElements = targetGrid.querySelectorAll('.video-card');
      cardElements.forEach((card, idx) => {
        const ytId = card.getAttribute('data-video-id');
        const title = card.querySelector('.video-title')?.textContent.trim() || `Video ${idx + 1}`;
        const year = card.getAttribute('data-year') || '';
        const month = card.getAttribute('data-month') || '';
        const originalUrl = card.querySelector('.btn-yt')?.getAttribute('href') || `https://www.youtube.com/watch?v=${ytId}`;
        const startTime = parseInt(card.getAttribute('data-start') || '0', 10);

        if (ytId) {
          videosData.push({
            id: ytId,
            startTime: startTime,
            title: title,
            month: month,
            year: year,
            originalUrl: originalUrl,
            seq: idx + 1
          });
        }
      });
    }

    // Inicializar Modal de Previsualización
    initPreviewModal(videosData);

    // Inicializar Filtros y Búsqueda
    initFiltersAndSearch(videosData);
  });

  // Renderizar las tarjetas en la cuadrícula
  function renderCards(videos, container) {
    container.innerHTML = '';

    videos.forEach((video, idx) => {
      const card = document.createElement('article');
      card.className = 'video-card';
      card.setAttribute('data-video-id', video.id);
      card.setAttribute('data-year', video.year);
      card.setAttribute('data-month', video.month.toLowerCase());
      card.setAttribute('data-start', video.startTime);
      card.setAttribute('data-index', idx);

      const thumbUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;

      card.innerHTML = `
        <div class="video-thumb-container" role="button" aria-label="Reproducir previsualización de ${video.title}">
          <img class="video-thumb" src="${thumbUrl}" alt="${video.title}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${video.id}/mqdefault.jpg'">
          <div class="play-overlay">
            <div class="play-circle">▶</div>
          </div>
          <span class="video-badge-year">${video.year}</span>
          <span class="video-badge-seq">#${video.seq}</span>
        </div>
        <div class="video-info">
          <div class="video-month-tag">
            <span>📅</span> ${video.month} ${video.year}
          </div>
          <h3 class="video-title">${video.title}</h3>
          <div class="video-actions">
            <button type="button" class="btn-preview" data-index="${idx}">
              <span>▶</span> Previsualizar
            </button>
            <a href="${video.originalUrl}" target="_blank" rel="noopener noreferrer" class="btn-yt" title="Abrir en YouTube">
              <span>↗ YouTube</span>
            </a>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    updateCounter(videos.length, videos.length);
  }

  // Inicializar el Modal / Lightbox de Video
  function initPreviewModal(videos) {
    let modalBackdrop = document.getElementById('videoPreviewModal');

    // Si no existe el modal en el DOM, crearlo
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'videoPreviewModal';
      modalBackdrop.className = 'video-modal-backdrop';
      modalBackdrop.setAttribute('role', 'dialog');
      modalBackdrop.setAttribute('aria-modal', 'true');
      modalBackdrop.innerHTML = `
        <div class="video-modal-container">
          <div class="modal-header">
            <h3 class="modal-title" id="modalVideoTitle">
              <span>⚡</span> <span class="title-text">Previsualización de Video</span>
            </h3>
            <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Cerrar reproductor">✕</button>
          </div>
          <div class="modal-player-wrap">
            <iframe id="modalIframe" src="" title="Reproductor de Video YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <div class="modal-footer">
            <div class="modal-nav-btns">
              <button type="button" class="modal-nav-btn" id="modalPrevBtn">◀ Anterior</button>
              <button type="button" class="modal-nav-btn" id="modalNextBtn">Siguiente ▶</button>
            </div>
            <a href="#" target="_blank" rel="noopener noreferrer" class="modal-yt-link" id="modalExternalLink">
              Abrir video en YouTube ↗
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(modalBackdrop);
    }

    const modalTitleText = modalBackdrop.querySelector('.title-text');
    const modalIframe = document.getElementById('modalIframe');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalPrevBtn = document.getElementById('modalPrevBtn');
    const modalNextBtn = document.getElementById('modalNextBtn');
    const modalExternalLink = document.getElementById('modalExternalLink');

    let currentVideoIndex = -1;

    // Abrir modal con el video en el índice indicado
    function openModal(index) {
      if (index < 0 || index >= videos.length) return;
      currentVideoIndex = index;
      const video = videos[currentVideoIndex];

      modalTitleText.textContent = video.title;
      modalExternalLink.href = video.originalUrl;

      // URL de embed segura con autoplay
      let embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
      if (video.startTime > 0) {
        embedUrl += `&start=${video.startTime}`;
      }

      modalIframe.src = embedUrl;

      // Estado de botones de navegación
      modalPrevBtn.disabled = currentVideoIndex === 0;
      modalNextBtn.disabled = currentVideoIndex === videos.length - 1;

      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // Bloquear scroll del fondo
    }

    // Cerrar modal y limpiar iframe
    function closeModal() {
      modalBackdrop.classList.remove('active');
      modalIframe.src = '';
      document.body.style.overflow = '';
      currentVideoIndex = -1;
    }

    // Navegar al video previo o siguiente
    modalPrevBtn.addEventListener('click', () => {
      if (currentVideoIndex > 0) openModal(currentVideoIndex - 1);
    });

    modalNextBtn.addEventListener('click', () => {
      if (currentVideoIndex < videos.length - 1) openModal(currentVideoIndex + 1);
    });

    modalCloseBtn.addEventListener('click', closeModal);

    // Cerrar al hacer clic en el fondo oscuro fuera del contenedor
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });

    // Control por teclado (ESC para salir, Flechas para navegar)
    document.addEventListener('keydown', (e) => {
      if (!modalBackdrop.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft' && currentVideoIndex > 0) {
        openModal(currentVideoIndex - 1);
      } else if (e.key === 'ArrowRight' && currentVideoIndex < videos.length - 1) {
        openModal(currentVideoIndex + 1);
      }
    });

    // Delegación de eventos para clics en la miniatura o botón de previsualizar
    document.addEventListener('click', (e) => {
      const previewBtn = e.target.closest('.btn-preview');
      const thumbWrap = e.target.closest('.video-thumb-container');

      if (previewBtn) {
        e.preventDefault();
        const card = previewBtn.closest('.video-card');
        const idx = getCardIndex(card);
        if (idx !== -1) openModal(idx);
      } else if (thumbWrap) {
        e.preventDefault();
        const card = thumbWrap.closest('.video-card');
        const idx = getCardIndex(card);
        if (idx !== -1) openModal(idx);
      }
    });

    function getCardIndex(card) {
      if (!card) return -1;
      const idxAttr = card.getAttribute('data-index');
      if (idxAttr !== null) return parseInt(idxAttr, 10);
      const ytId = card.getAttribute('data-video-id');
      return videos.findIndex(v => v.id === ytId);
    }
  }

  // Inicializar barra de búsqueda y filtros por año
  function initFiltersAndSearch(videos) {
    const searchInput = document.getElementById('videoSearch');
    const pillButtons = document.querySelectorAll('.pill-btn');
    const cards = document.querySelectorAll('.video-card');

    let activeYear = 'all';
    let currentQuery = '';

    function applyFilters() {
      let visibleCount = 0;
      const query = currentQuery.toLowerCase().trim();

      cards.forEach((card) => {
        const cardYear = card.getAttribute('data-year') || '';
        const cardText = (card.textContent || '').toLowerCase();

        const matchesYear = activeYear === 'all' || cardYear === activeYear;
        const matchesSearch = query === '' || cardText.includes(query);

        if (matchesYear && matchesSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Mostrar u ocultar mensaje de no resultados
      let noResultsMsg = document.getElementById('noResultsMessage');
      const container = document.getElementById('videosGrid');

      if (visibleCount === 0) {
        if (!noResultsMsg && container) {
          noResultsMsg = document.createElement('div');
          noResultsMsg.id = 'noResultsMessage';
          noResultsMsg.className = 'no-results';
          noResultsMsg.innerHTML = `
            <h3>No se encontraron videos</h3>
            <p>Intenta con otro mes, año o término de búsqueda.</p>
          `;
          container.appendChild(noResultsMsg);
        } else if (noResultsMsg) {
          noResultsMsg.style.display = 'block';
        }
      } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
      }

      updateCounter(visibleCount, videos.length);
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentQuery = e.target.value;
        applyFilters();
      });
    }

    pillButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        pillButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeYear = btn.getAttribute('data-year') || 'all';
        applyFilters();
      });
    });
  }

  // Actualizar contador numérico de videos
  function updateCounter(visible, total) {
    const counterEl = document.getElementById('videosCount');
    if (counterEl) {
      if (visible === total) {
        counterEl.textContent = `Total: ${total} videos`;
      } else {
        counterEl.textContent = `Mostrando: ${visible} de ${total} videos`;
      }
    }
  }

})();
