(function () {
  'use strict';

  const FIGURINE_ICONS = {
    1: 'fa-female',
    2: 'fa-male',
    3: 'fa-umbrella-beach',
    4: 'fa-umbrella-beach',
  };

  function createFigurineViewer(figurineId, opts) {
    opts = opts || {};
    const mode = opts.mode || 'thumb';

    const root = document.createElement('div');
    root.className = `figurine-viewer figurine-viewer--${mode}`;
    root.dataset.figurineId = String(figurineId);

    const stage = document.createElement('div');
    stage.className = 'figurine-viewer__stage';
    root.appendChild(stage);

    const pedestal = document.createElement('div');
    pedestal.className = 'figurine-viewer__pedestal';
    stage.appendChild(pedestal);

    const figure = document.createElement('div');
    figure.className = 'figurine-viewer__figure';
    const icon = document.createElement('i');
    icon.className = `fas ${FIGURINE_ICONS[figurineId] || 'fa-user'} figurine-viewer__icon`;
    figure.appendChild(icon);
    stage.appendChild(figure);

    const label = document.createElement('div');
    label.className = 'figurine-viewer__placeholder-label';
    label.textContent = '3D';
    stage.appendChild(label);

    if (mode === 'detail') {
      attachDetailInteractions(root, stage);
    }

    root.figurineViewerDestroy = function () {};
    return root;
  }

  function attachDetailInteractions(root, stage) {
    let rafId = null;
    let rotY = 0;
    function tick() {
      rotY += 0.3;
      stage.style.transform = `rotateX(-12deg) rotateY(${rotY}deg)`;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    root.figurineViewerDestroy = function () {
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }

  window.createFigurineViewer = createFigurineViewer;
})();
