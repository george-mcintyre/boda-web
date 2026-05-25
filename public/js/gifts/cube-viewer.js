(function () {
  'use strict';

  const FACE_KEYS = ['front', 'back', 'top', 'bottom', 'left', 'right'];

  function isImageUrl(value) {
    return typeof value === 'string' && value.startsWith('/');
  }

  function isMirror(value) { return value === 'mirror'; }
  function isWhite(value) { return value === 'white' || value == null; }

  function pickThumbnailOrientation(faces) {
    const leftIsImage = isImageUrl(faces.left);
    const rightIsImage = isImageUrl(faces.right);
    if (leftIsImage && !rightIsImage) return 'top-left-front';
    if (rightIsImage && !leftIsImage) return 'top-right-front';
    return 'top-left-front';
  }

  function buildFaceElement(faceKey, value, options) {
    const face = document.createElement('div');
    face.className = `cube-viewer__face cube-viewer__face--${faceKey}`;
    face.dataset.faceKey = faceKey;
    const pocket = document.createElement('div');
    pocket.className = 'cube-viewer__pocket';
    if (isMirror(value)) {
      pocket.dataset.mirror = 'true';
      if (options && options.glassyMirror) {
        pocket.classList.add('cube-viewer__pocket--glassy');
        const gloss = document.createElement('div');
        gloss.className = 'cube-viewer__gloss';
        pocket.appendChild(gloss);
      }
    } else if (isImageUrl(value)) {
      pocket.style.backgroundImage = `url("${value}")`;
    } else {
      pocket.dataset.blank = 'true';
    }
    face.appendChild(pocket);
    return face;
  }

  // Local-space basis for each face, in CSS coords (+X right, +Y down, +Z toward viewer).
  // n = outward normal, r = ribbon's local "right" axis, u = ribbon's semantic "up" axis.
  // For top/bottom (horizontal faces) world-up is undefined in-plane, so u is chosen by convention
  // (top: -Z = toward back of scene; bottom: +Z = toward viewer) — singularity fallback handles it.
  const FACE_BASIS = {
    front:  { n: { x:  0, y:  0, z:  1 }, r: { x:  1, y:  0, z:  0 }, u: { x:  0, y: -1, z:  0 } },
    back:   { n: { x:  0, y:  0, z: -1 }, r: { x: -1, y:  0, z:  0 }, u: { x:  0, y: -1, z:  0 } },
    right:  { n: { x:  1, y:  0, z:  0 }, r: { x:  0, y:  0, z: -1 }, u: { x:  0, y: -1, z:  0 } },
    left:   { n: { x: -1, y:  0, z:  0 }, r: { x:  0, y:  0, z:  1 }, u: { x:  0, y: -1, z:  0 } },
    top:    { n: { x:  0, y: -1, z:  0 }, r: { x:  1, y:  0, z:  0 }, u: { x:  0, y:  0, z: -1 } },
    bottom: { n: { x:  0, y:  1, z:  0 }, r: { x:  1, y:  0, z:  0 }, u: { x:  0, y:  0, z:  1 } },
  };

  // Phi (degrees): in-plane rotation that aligns the ribbon's local right axis with a
  // WORLD-anchored right axis projected onto the face plane. Anchoring to world directions
  // (not face-local) means the reflection content stays stationary as the cube spins —
  // the ribbon counter-rotates exactly as much as the face spins around its own normal.
  // Anchor seed: world-up (0,-1,0); singular-fallback: world-forward (0,0,1).
  function computeAnchorPhiDeg(faceR, faceU, faceN, rotXdeg, rotYdeg) {
    const SING_EPS = 0.18;
    const r = rotateNormal(faceR, rotXdeg, rotYdeg);
    const u = rotateNormal(faceU, rotXdeg, rotYdeg);
    const n = rotateNormal(faceN, rotXdeg, rotYdeg);
    let sx = 0, sy = -1, sz = 0;
    let dot = sx * n.x + sy * n.y + sz * n.z;
    let px = sx - dot * n.x;
    let py = sy - dot * n.y;
    let pz = sz - dot * n.z;
    let mag2 = px * px + py * py + pz * pz;
    if (mag2 < SING_EPS * SING_EPS) {
      sx = 0; sy = 0; sz = 1;
      dot = sx * n.x + sy * n.y + sz * n.z;
      px = sx - dot * n.x;
      py = sy - dot * n.y;
      pz = sz - dot * n.z;
      mag2 = px * px + py * py + pz * pz;
    }
    const invMag = 1 / Math.sqrt(mag2);
    const uwX = px * invMag, uwY = py * invMag, uwZ = pz * invMag;
    const rwX = n.y * uwZ - n.z * uwY;
    const rwY = n.z * uwX - n.x * uwZ;
    const rwZ = n.x * uwY - n.y * uwX;
    const a = rwX * r.x + rwY * r.y + rwZ * r.z;
    const b = rwX * u.x + rwY * u.y + rwZ * u.z;
    return -Math.atan2(b, a) * 180 / Math.PI;
  }

  // Apply rotateX(a) then rotateY(b) to a vector. CSS composes left-to-right, so the
  // resulting transform on a vector is Rx(a) * Ry(b) * v.
  function rotateNormal(n, rotXdeg, rotYdeg) {
    const ax = rotXdeg * Math.PI / 180;
    const ay = rotYdeg * Math.PI / 180;
    const cy = Math.cos(ay), sy = Math.sin(ay);
    const cx = Math.cos(ax), sx = Math.sin(ax);
    // First Ry: (x,y,z) -> (cy*x + sy*z, y, -sy*x + cy*z)
    const x1 = cy * n.x + sy * n.z;
    const y1 = n.y;
    const z1 = -sy * n.x + cy * n.z;
    // Then Rx: (x,y,z) -> (x, cx*y - sx*z, sx*y + cx*z)
    const x2 = x1;
    const y2 = cx * y1 - sx * z1;
    const z2 = sx * y1 + cx * z1;
    return { x: x2, y: y2, z: z2 };
  }

  function buildScene(faces, options) {
    const scene = document.createElement('div');
    scene.className = 'cube-viewer__scene';
    for (const key of FACE_KEYS) {
      scene.appendChild(buildFaceElement(key, faces[key], options));
    }
    return scene;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setupReflections(scene, mirrorPockets, reflectionRoot) {
    if (!reflectionRoot || !mirrorPockets.length) return null;

    const aboveSources = reflectionRoot.querySelectorAll('[data-reflection-zone="above"]');
    const belowSources = reflectionRoot.querySelectorAll('[data-reflection-zone="below"]');
    if (!aboveSources.length && !belowSources.length) return null;

    const entries = [];
    for (let i = 0; i < mirrorPockets.length; i += 1) {
      const pocket = mirrorPockets[i];
      const face = pocket.parentNode;
      const faceKey = face && face.dataset ? face.dataset.faceKey : null;
      if (!faceKey || !FACE_BASIS[faceKey]) continue;

      const layer = document.createElement('div');
      layer.className = 'cube-viewer__reflection';
      const stage = document.createElement('div');
      stage.className = 'cube-viewer__reflection-stage';
      const ribbon = document.createElement('div');
      ribbon.className = 'cube-viewer__reflection-ribbon';
      const aboveSlot = document.createElement('div');
      aboveSlot.className = 'cube-viewer__reflection-slot cube-viewer__reflection-slot--above';
      const spacer = document.createElement('div');
      spacer.className = 'cube-viewer__reflection-spacer';
      const belowSlot = document.createElement('div');
      belowSlot.className = 'cube-viewer__reflection-slot cube-viewer__reflection-slot--below';
      ribbon.appendChild(aboveSlot);
      ribbon.appendChild(spacer);
      ribbon.appendChild(belowSlot);
      stage.appendChild(ribbon);
      layer.appendChild(stage);
      pocket.appendChild(layer);

      entries.push({ pocket, faceKey, ribbon, aboveSlot, belowSlot });
    }
    if (!entries.length) return null;

    let syncRafId = null;
    function syncNow() {
      syncRafId = null;
      const aboveHtml = collectHtml(aboveSources);
      const belowHtml = collectHtml(belowSources);
      for (let i = 0; i < entries.length; i += 1) {
        entries[i].aboveSlot.innerHTML = aboveHtml;
        entries[i].belowSlot.innerHTML = belowHtml;
      }
      patchClones(reflectionRoot, entries);
    }
    function scheduleSync() {
      if (syncRafId != null) return;
      syncRafId = window.requestAnimationFrame(syncNow);
    }

    const observer = new MutationObserver(scheduleSync);
    const allSources = [];
    aboveSources.forEach(el => allSources.push(el));
    belowSources.forEach(el => allSources.push(el));
    for (let i = 0; i < allSources.length; i += 1) {
      observer.observe(allSources[i], {
        childList: true, subtree: true, attributes: true, characterData: true,
      });
    }

    function onInput() { scheduleSync(); }
    reflectionRoot.addEventListener('input', onInput, true);
    reflectionRoot.addEventListener('change', onInput, true);

    syncNow();

    function updateOrientation(rotX, rotY) {
      for (let i = 0; i < entries.length; i += 1) {
        const e = entries[i];
        const basis = FACE_BASIS[e.faceKey];
        const n = rotateNormal(basis.n, rotX, rotY);
        const phi = computeAnchorPhiDeg(basis.r, basis.u, basis.n, rotX, rotY);
        e.pocket.style.setProperty('--reflect-pan', (-n.y).toFixed(4));
        e.pocket.style.setProperty('--reflect-anchor-phi', phi.toFixed(3) + 'deg');
      }
    }

    return {
      updateOrientation,
      destroy() {
        observer.disconnect();
        reflectionRoot.removeEventListener('input', onInput, true);
        reflectionRoot.removeEventListener('change', onInput, true);
        if (syncRafId != null) window.cancelAnimationFrame(syncRafId);
        for (let i = 0; i < entries.length; i += 1) {
          const layer = entries[i].pocket.querySelector('.cube-viewer__reflection');
          if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
        }
      },
    };
  }

  function collectHtml(nodeList) {
    let html = '';
    for (let i = 0; i < nodeList.length; i += 1) html += nodeList[i].outerHTML;
    // Strip name= from radio/checkbox inputs before the HTML is reparsed into the
    // reflection clones. Setting innerHTML on the clone slots reparses these inputs
    // synchronously into the same document; if they share a name group with the
    // live radios, the browser enforces "only one checked per group" at parse time,
    // silently unchecking the user's just-clicked live radio. patchClones removes
    // names after the fact, but by then the live state has already been clobbered.
    return html.replace(/(<input\b[^>]*?)\sname="[^"]*"/gi, '$1');
  }

  function patchClones(reflectionRoot, entries) {
    const sourceAreas = reflectionRoot.querySelectorAll('[data-reflection-zone] textarea');
    const sourceRadios = reflectionRoot.querySelectorAll('[data-reflection-zone] input[type="radio"]');
    for (let e = 0; e < entries.length; e += 1) {
      const entry = entries[e];
      const liveMarkers = [
        ...entry.aboveSlot.querySelectorAll('[data-live]'),
        ...entry.belowSlot.querySelectorAll('[data-live]'),
      ];
      for (let i = 0; i < liveMarkers.length; i += 1) liveMarkers[i].removeAttribute('data-live');
      // textarea.outerHTML omits the live .value, so copy it across to the clones explicitly.
      const cloneAreas = [
        ...entry.aboveSlot.querySelectorAll('textarea'),
        ...entry.belowSlot.querySelectorAll('textarea'),
      ];
      for (let i = 0; i < sourceAreas.length && i < cloneAreas.length; i += 1) {
        cloneAreas[i].value = sourceAreas[i].value;
        cloneAreas[i].textContent = sourceAreas[i].value;
      }
      // Cloned radios must not share a name group with the live ones, otherwise selecting
      // the live radio would deselect siblings inside the cloned reflection (and vice versa).
      // Also: setting clone.innerHTML reparses radios with the SAME name group as the source,
      // which causes the browser to unselect the previously-checked source radio. We restore
      // the live source's checked state from its `checked` HTML attribute if nothing in the
      // group is selected after this clone pass.
      const cloneRadios = [
        ...entry.aboveSlot.querySelectorAll('input[type="radio"]'),
        ...entry.belowSlot.querySelectorAll('input[type="radio"]'),
      ];
      for (let i = 0; i < cloneRadios.length; i += 1) {
        cloneRadios[i].removeAttribute('name');
        cloneRadios[i].removeAttribute('id');
        cloneRadios[i].tabIndex = -1;
      }
      const sourceGroupsRestored = new Set();
      for (let i = 0; i < sourceRadios.length; i += 1) {
        const src = sourceRadios[i];
        const groupName = src.getAttribute('name');
        if (groupName && !sourceGroupsRestored.has(groupName)) {
          const group = reflectionRoot.querySelectorAll(`[data-reflection-zone] input[type="radio"][name="${groupName}"]`);
          let anyChecked = false;
          for (let g = 0; g < group.length; g += 1) {
            if (group[g].checked) { anyChecked = true; break; }
          }
          if (!anyChecked) {
            for (let g = 0; g < group.length; g += 1) {
              if (group[g].hasAttribute('checked')) {
                group[g].checked = true;
                break;
              }
            }
          }
          sourceGroupsRestored.add(groupName);
        }
      }
      for (let i = 0; i < sourceRadios.length && i < cloneRadios.length; i += 1) {
        cloneRadios[i].checked = sourceRadios[i].checked;
      }
      const cloneLabels = [
        ...entry.aboveSlot.querySelectorAll('label[for]'),
        ...entry.belowSlot.querySelectorAll('label[for]'),
      ];
      for (let i = 0; i < cloneLabels.length; i += 1) cloneLabels[i].removeAttribute('for');
    }
  }

  function attachDetailInteractions(viewerEl, scene, opts) {
    const state = {
      autoRotate: !prefersReducedMotion(),
      rotY: -25,
      rotX: -15,
      lastTime: 0,
      rafId: null,
      isDragging: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
      idleTimer: null,
    };

    const REVOLUTION_MS = 6000;
    const DEG_PER_MS = 360 / REVOLUTION_MS;
    const IDLE_RESUME_MS = 3000;
    const TILT_TOP_VIEW = 90;
    const TILT_BOTTOM_VIEW = 30;
    const DRAG_SENSITIVITY = 0.5;

    const mirrorPockets = scene.querySelectorAll('.cube-viewer__pocket--glassy');
    const reflection = setupReflections(scene, mirrorPockets, opts && opts.reflectionRoot);

    function applyTransform() {
      scene.style.transform = `rotateX(${state.rotX}deg) rotateY(${state.rotY}deg)`;
      updateMirrorShimmer();
      if (reflection) reflection.updateOrientation(state.rotX, state.rotY);
    }

    function updateMirrorShimmer() {
      if (!mirrorPockets.length) return;
      const yawRad = state.rotY * Math.PI / 180;
      const angle = 160 + Math.sin(yawRad) * 60;
      const shimmer = 0.28 + Math.abs(Math.sin(yawRad * 2)) * 0.32;
      const tint = 0.45 + Math.cos(yawRad) * 0.15;
      const angleStr = `${angle.toFixed(1)}deg`;
      const shimmerStr = shimmer.toFixed(3);
      const tintStr = tint.toFixed(3);
      for (let i = 0; i < mirrorPockets.length; i += 1) {
        const m = mirrorPockets[i];
        m.style.setProperty('--mirror-angle', angleStr);
        m.style.setProperty('--mirror-shimmer', shimmerStr);
        m.style.setProperty('--mirror-tint', tintStr);
      }
    }

    function tick(timestamp) {
      if (!state.lastTime) state.lastTime = timestamp;
      const dt = timestamp - state.lastTime;
      state.lastTime = timestamp;
      if (state.autoRotate && !state.isDragging) {
        state.rotY = (state.rotY + DEG_PER_MS * dt) % 360;
        applyTransform();
      }
      state.rafId = window.requestAnimationFrame(tick);
    }

    function startAnimation() {
      if (state.rafId != null) return;
      viewerEl.classList.add('is-animating');
      state.lastTime = 0;
      state.rafId = window.requestAnimationFrame(tick);
    }

    function stopAnimation() {
      if (state.rafId != null) {
        window.cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
      viewerEl.classList.remove('is-animating');
    }

    function scheduleResume() {
      if (state.idleTimer) window.clearTimeout(state.idleTimer);
      state.idleTimer = window.setTimeout(() => {
        if (!state.isDragging && !prefersReducedMotion()) {
          state.autoRotate = true;
          startAnimation();
        }
      }, IDLE_RESUME_MS);
    }

    function onPointerDown(ev) {
      if (state.pointerId !== null) return;
      state.pointerId = ev.pointerId;
      state.isDragging = true;
      state.lastX = ev.clientX;
      state.lastY = ev.clientY;
      state.autoRotate = false;
      viewerEl.classList.add('is-dragging');
      try { viewerEl.setPointerCapture(ev.pointerId); } catch (e) {}
      if (state.idleTimer) {
        window.clearTimeout(state.idleTimer);
        state.idleTimer = null;
      }
      ev.preventDefault();
    }

    function onPointerMove(ev) {
      if (!state.isDragging || ev.pointerId !== state.pointerId) return;
      const dx = ev.clientX - state.lastX;
      const dy = ev.clientY - state.lastY;
      state.lastX = ev.clientX;
      state.lastY = ev.clientY;
      state.rotY = (state.rotY + dx * DRAG_SENSITIVITY) % 360;
      state.rotX = clamp(state.rotX - dy * DRAG_SENSITIVITY, -TILT_TOP_VIEW, TILT_BOTTOM_VIEW);
      applyTransform();
    }

    function onPointerUp(ev) {
      if (ev.pointerId !== state.pointerId) return;
      state.isDragging = false;
      state.pointerId = null;
      viewerEl.classList.remove('is-dragging');
      try { viewerEl.releasePointerCapture(ev.pointerId); } catch (e) {}
      scheduleResume();
    }

    viewerEl.addEventListener('pointerdown', onPointerDown);
    viewerEl.addEventListener('pointermove', onPointerMove);
    viewerEl.addEventListener('pointerup', onPointerUp);
    viewerEl.addEventListener('pointercancel', onPointerUp);

    applyTransform();
    if (state.autoRotate) startAnimation();

    return {
      destroy() {
        stopAnimation();
        if (state.idleTimer) window.clearTimeout(state.idleTimer);
        viewerEl.removeEventListener('pointerdown', onPointerDown);
        viewerEl.removeEventListener('pointermove', onPointerMove);
        viewerEl.removeEventListener('pointerup', onPointerUp);
        viewerEl.removeEventListener('pointercancel', onPointerUp);
        if (reflection) reflection.destroy();
      },
    };
  }

  function createCubeViewer(faces, opts) {
    const options = Object.assign(
      { mode: 'thumb', sold: false, soldLabel: 'Sold' },
      opts || {}
    );

    const el = document.createElement('div');
    el.className = `cube-viewer cube-viewer--${options.mode}`;
    if (options.sold) el.classList.add('cube-viewer--sold');

    if (options.mode === 'thumb') {
      const orientation = pickThumbnailOrientation(faces);
      if (orientation === 'top-right-front') {
        el.classList.add('cube-viewer--orient-tr');
      } else {
        el.classList.add('cube-viewer--orient-tl');
      }
    }

    const sceneOptions = {
      glassyMirror: options.mode === 'detail' && !options.sold,
    };
    const scene = buildScene(faces, sceneOptions);
    el.appendChild(scene);

    if (options.sold) {
      const badge = document.createElement('div');
      badge.className = 'cube-viewer__sold-badge';
      const span = document.createElement('span');
      span.textContent = options.soldLabel;
      badge.appendChild(span);
      el.appendChild(badge);
    }

    let interactionHandle = null;
    if (options.mode === 'detail' && !options.sold) {
      interactionHandle = attachDetailInteractions(el, scene, options);
    }

    el.cubeViewerDestroy = function () {
      if (interactionHandle) interactionHandle.destroy();
    };

    return el;
  }

  window.createCubeViewer = createCubeViewer;
  window.CubeViewer = { create: createCubeViewer, pickThumbnailOrientation };
})();
