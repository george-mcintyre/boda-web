(function () {
  'use strict';

  const ASSET_BASE = '/assets/figurines';
  const FRAME_COUNT = 12;
  const KNOWN_FIGURINE_IDS = new Set([1, 2, 3, 4]);
  const DRAG_PIXELS_PER_FRAME = 18;
  const SUPPORTS_WEBP_PROMISE = detectWebpSupport();

  function detectWebpSupport() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    });
  }

  function isValidFigurineId(id) {
    const n = Number(id);
    return Number.isFinite(n) && KNOWN_FIGURINE_IDS.has(n);
  }

  function frameUrl(figurineId, frameIndex, ext) {
    const padded = String(frameIndex).padStart(2, '0');
    return `${ASSET_BASE}/figurine-${figurineId}/${padded}.${ext}`;
  }

  function thumbUrl(figurineId, ext) {
    return `${ASSET_BASE}/figurine-${figurineId}/thumb.${ext}`;
  }

  function createThumbViewer(figurineId) {
    const root = document.createElement('div');
    root.className = 'figurine-viewer figurine-viewer--thumb';
    root.dataset.figurineId = String(figurineId);

    const img = document.createElement('img');
    img.className = 'figurine-viewer__thumb-image';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';

    SUPPORTS_WEBP_PROMISE.then((supportsWebp) => {
      img.src = thumbUrl(figurineId, supportsWebp ? 'webp' : 'png');
    });
    img.addEventListener('error', () => {
      if (!img.src.endsWith('.png')) {
        img.src = thumbUrl(figurineId, 'png');
      } else {
        root.classList.add('figurine-viewer--errored');
      }
    });
    root.appendChild(img);

    root.figurineViewerDestroy = function () {};
    return root;
  }

  function createDetailViewer(figurineId) {
    const root = document.createElement('div');
    root.className = 'figurine-viewer figurine-viewer--detail figurine-viewer--detail--360';
    root.dataset.figurineId = String(figurineId);
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', 'Rotatable 3D figurine preview');

    const stage = document.createElement('div');
    stage.className = 'figurine-viewer__stage';

    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i += 1) {
      const im = document.createElement('img');
      im.className = 'figurine-viewer__frame';
      im.dataset.frameIndex = String(i);
      im.alt = '';
      im.decoding = 'async';
      im.draggable = false;
      if (i === 0) im.classList.add('is-current');
      stage.appendChild(im);
      frames.push(im);
    }
    root.appendChild(stage);

    const hint = document.createElement('div');
    hint.className = 'figurine-viewer__drag-hint';
    hint.innerHTML = '<i class="fas fa-arrows-alt-h"></i><span>Drag to rotate</span>';
    root.appendChild(hint);

    const progress = document.createElement('div');
    progress.className = 'figurine-viewer__progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'figurine-viewer__progress-bar';
    progress.appendChild(progressBar);
    root.appendChild(progress);

    let currentFrame = 0;
    let loadedCount = 0;
    let allLoaded = false;
    let destroyed = false;

    const setCurrentFrame = (next) => {
      const normalized = ((next % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      if (normalized === currentFrame) return;
      frames[currentFrame].classList.remove('is-current');
      frames[normalized].classList.add('is-current');
      currentFrame = normalized;
    };

    SUPPORTS_WEBP_PROMISE.then((supportsWebp) => {
      if (destroyed) return;
      const ext = supportsWebp ? 'webp' : 'png';
      const updateProgress = () => {
        if (loadedCount === 1) {
          root.classList.add('figurine-viewer--first-frame-loaded');
        }
        if (loadedCount >= FRAME_COUNT) {
          allLoaded = true;
          root.classList.add('figurine-viewer--all-loaded');
        }
        if (progressBar) {
          progressBar.style.transform = `scaleX(${loadedCount / FRAME_COUNT})`;
        }
      };
      const handleFrame = (im, i) => {
        im.src = frameUrl(figurineId, i, ext);
        const decoded = typeof im.decode === 'function'
          ? im.decode().catch(() => {})
          : new Promise((resolve) => {
              im.addEventListener('load', resolve, { once: true });
              im.addEventListener('error', resolve, { once: true });
            });
        return decoded.then(() => {
          if (destroyed) return;
          loadedCount += 1;
          updateProgress();
        }, () => {
          if (destroyed) return;
          if (!im.src.endsWith('.png')) {
            im.src = frameUrl(figurineId, i, 'png');
          }
          loadedCount += 1;
          updateProgress();
        });
      };
      Promise.all(frames.map((im, i) => handleFrame(im, i))).then(() => {
        if (destroyed) return;
        root.classList.add('figurine-viewer--ready');
        startAutoRotate();
      });
    });

    let dragActive = false;
    let dragPending = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartFrame = 0;
    let dragPointerId = -1;
    let lastInteractionTs = 0;
    let autoRotateRaf = 0;
    const DRAG_INTENT_THRESHOLD_PX = 8;

    const startAutoRotate = () => {
      const start = performance.now();
      const baseFrame = currentFrame;
      const tick = (now) => {
        if (destroyed || dragActive) return;
        if (now - lastInteractionTs < 1500) {
          autoRotateRaf = requestAnimationFrame(tick);
          return;
        }
        const elapsed = (now - start) / 1000;
        const advance = (elapsed * FRAME_COUNT) % FRAME_COUNT;
        setCurrentFrame(Math.floor(baseFrame + advance));
        autoRotateRaf = requestAnimationFrame(tick);
      };
      autoRotateRaf = requestAnimationFrame(tick);
    };

    const onPointerDown = (e) => {
      if (!allLoaded && loadedCount < 2) return;
      if (e.pointerType !== 'touch') {
        dragActive = true;
        dragPending = false;
        dragPointerId = e.pointerId;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartFrame = currentFrame;
        lastInteractionTs = performance.now();
        root.classList.add('figurine-viewer--dragging');
        hint.classList.add('figurine-viewer__drag-hint--fade');
        try { root.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
        return;
      }
      dragActive = false;
      dragPending = true;
      dragPointerId = e.pointerId;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartFrame = currentFrame;
      lastInteractionTs = performance.now();
    };
    const onPointerMove = (e) => {
      if (e.pointerId !== dragPointerId) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (dragPending) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx < DRAG_INTENT_THRESHOLD_PX && absDy < DRAG_INTENT_THRESHOLD_PX) {
          return;
        }
        if (absDy > absDx) {
          dragPending = false;
          dragPointerId = -1;
          return;
        }
        dragPending = false;
        dragActive = true;
        root.classList.add('figurine-viewer--dragging');
        hint.classList.add('figurine-viewer__drag-hint--fade');
        try { root.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (!dragActive) return;
      if (e.cancelable) e.preventDefault();
      const frameOffset = Math.round(dx / DRAG_PIXELS_PER_FRAME);
      setCurrentFrame(dragStartFrame + frameOffset);
      lastInteractionTs = performance.now();
    };
    const onPointerUp = (e) => {
      if (e.pointerId !== dragPointerId) return;
      const wasDragging = dragActive;
      dragActive = false;
      dragPending = false;
      dragPointerId = -1;
      if (wasDragging) {
        root.classList.remove('figurine-viewer--dragging');
        try { root.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      lastInteractionTs = performance.now();
    };
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentFrame(currentFrame - 1);
        lastInteractionTs = performance.now();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        setCurrentFrame(currentFrame + 1);
        lastInteractionTs = performance.now();
        e.preventDefault();
      }
    };

    root.tabIndex = 0;
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerUp);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('contextmenu', (e) => e.preventDefault());

    root.figurineViewerDestroy = function () {
      destroyed = true;
      if (autoRotateRaf) cancelAnimationFrame(autoRotateRaf);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerUp);
      root.removeEventListener('keydown', onKeyDown);
      frames.forEach((im) => { im.src = ''; });
    };
    return root;
  }

  function createFigurineViewer(figurineId, opts) {
    const mode = (opts && opts.mode) || 'thumb';
    if (!isValidFigurineId(figurineId)) {
      const empty = document.createElement('div');
      empty.className = `figurine-viewer figurine-viewer--${mode} figurine-viewer--unknown`;
      empty.figurineViewerDestroy = function () {};
      return empty;
    }
    return mode === 'detail'
      ? createDetailViewer(Number(figurineId))
      : createThumbViewer(Number(figurineId));
  }

  window.createFigurineViewer = createFigurineViewer;
  window.FigurineViewer = { create: createFigurineViewer };
})();
