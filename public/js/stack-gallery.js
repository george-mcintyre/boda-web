(function(){
  function clamp(v, min, max){ return v < min ? min : v > max ? max : v; }

  function sectionInView(el){
    const rect = el.getBoundingClientRect();
    const h = window.innerHeight || document.documentElement.clientHeight;
    return rect.top <= h * 0.4 && rect.bottom >= h * 0.4; // middle of viewport is within section
  }

  function initWowStack(gallery){
    const section = gallery.closest('.stack-section') || gallery.parentElement;
    const viewport = gallery.querySelector('.stack-viewport');
    const cards = Array.from(gallery.querySelectorAll('.stack-card'));
    if (!viewport || cards.length === 0) return;

    // Prepare cards: first visible, rest off-screen bottom
    cards.forEach((card, i) => {
      card.style.willChange = 'transform, opacity';
      card.style.transition = 'none';
      card.style.zIndex = String(10 + i);
      if (i === 0){
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(100%)';
        // mark for wow/animate.css
        card.classList.add('wow');
      }
    });
    // Ensure WOW watches any newly marked elements
    if (window._wowInstance && typeof window._wowInstance.sync === 'function'){
      window._wowInstance.sync();
    }

    let index = 0; // currently visible top-most index
    let busy = false;
    let completed = false;

    function animateNext(){
      if (busy) return;
      if (index >= cards.length - 1){
        completed = true;
        // Do not unlock here; keep listeners so user can reverse with scroll up
        return;
      }
      busy = true;
      const next = cards[index + 1];
      // Ensure visibility and start animation
      next.style.opacity = '1';
      next.style.transform = 'translateY(0)';
      // Use animate.css via WOW-compatible classes
      next.classList.add('animate__animated', 'animate__slideInUp');
      // Optionally faster animation
      next.classList.add('animate__faster');

      function onEnd(){
        next.removeEventListener('animationend', onEnd);
        // Clean up animate classes to avoid re-triggering
        next.classList.remove('animate__slideInUp', 'animate__faster');
        index++;
        busy = false;
        if (index >= cards.length - 1){
          completed = true;
        }
      }
      next.addEventListener('animationend', onEnd);
    }

    function animatePrev(){
      if (busy) return;
      if (index <= 0) return;
      // If we had completed, re-lock because we are reversing within hero
      if (completed){
        completed = false;
        if (sectionInView(section)) lockScroll();
      }
      busy = true;
      const current = cards[index];
      // Animate current out down to reveal the previous beneath
      current.classList.add('animate__animated', 'animate__slideOutDown');
      current.classList.add('animate__faster');

      function onEnd(){
        current.removeEventListener('animationend', onEnd);
        // Hide current off-screen again for future forward animations
        current.classList.remove('animate__slideOutDown', 'animate__faster');
        current.style.opacity = '0';
        current.style.transform = 'translateY(100%)';
        index--;
        busy = false;
      }
      current.addEventListener('animationend', onEnd);
    }

    // Scroll lock mechanics while in hero and sequence not completed
    let touchStartY = 0;
    let releasedTop = false; // allow natural page scroll when at top and user keeps scrolling up
    function wheelHandler(e){
      if (!sectionInView(section)) return;
      const lastIndex = cards.length - 1;

      // If we're released at the top, allow default scrolling until user reverses (scrolls down)
      if (releasedTop) {
        if (e.deltaY > 6) { // user reversed direction (down)
          releasedTop = false;
          if (!completed && index < lastIndex) {
            e.preventDefault();
            animateNext();
            return;
          }
        }
        // Continue letting the page scroll naturally
        return;
      }

      // Reverse (scroll up) within the stack when not at the first card
      if (e.deltaY < -6) {
        if (index > 0) {
          e.preventDefault();
          animatePrev();
          return;
        } else {
          // At the top with further up-scroll: release the page
          releasedTop = true;
          return; // do not preventDefault → allow normal page scroll
        }
      }

      // Forward (scroll down) only while not completed and not at last card
      if (!completed && e.deltaY > 6 && index < lastIndex){
        e.preventDefault();
        animateNext();
        return;
      }
      // Otherwise, if the hero sequence isn't completed, keep page from scrolling
      if (!completed) {
        e.preventDefault();
      }
    }
    function touchStart(e){ touchStartY = (e.touches && e.touches[0] ? e.touches[0].clientY : 0); }
    function touchMove(e){
      if (!sectionInView(section)) return;
      const y = (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      const dy = touchStartY - y; // swipe up => positive, swipe down => negative

      // If released at top: allow natural scroll while swiping down (dy < -10)
      if (releasedTop) {
        if (dy > 10) { // user reversed (swipe up → scroll down)
          releasedTop = false;
          if (!busy && !completed && index < cards.length - 1){
            e.preventDefault();
            animateNext();
            return;
          }
        }
        // keep allowing default while continuing to swipe down
        return;
      }

      // Forward only if not completed and we have a next card
      if (dy > 10 && !busy && !completed && index < cards.length - 1){
        e.preventDefault();
        animateNext();
      // Reverse allowed whenever not at first card
      } else if (dy < -10 && !busy){
        if (index > 0){
          e.preventDefault();
          animatePrev();
        } else {
          // At top and swiping down: release to allow page to scroll
          releasedTop = true;
          // do not preventDefault
        }
      } else if (!completed) {
        // Keep page from scrolling while the hero sequence is active
        e.preventDefault();
      }
    }

    function keyHandler(e){
      if (!sectionInView(section)) return;
      const nextKeys = ['ArrowDown','PageDown','Space',' '];
      const prevKeys = ['ArrowUp','PageUp'];
      const lastIndex = cards.length - 1;
      if (prevKeys.includes(e.key) && index > 0){
        e.preventDefault();
        animatePrev();
      } else if (nextKeys.includes(e.key) && !busy && !completed && index < lastIndex){
        e.preventDefault();
        animateNext();
      } else if (nextKeys.includes(e.key) || prevKeys.includes(e.key)){
        // No animation possible: allow normal behavior
      }
    }

    function lockScroll(){
      window.addEventListener('wheel', wheelHandler, { passive: false });
      window.addEventListener('touchstart', touchStart, { passive: true });
      window.addEventListener('touchmove', touchMove, { passive: false });
      window.addEventListener('keydown', keyHandler, { passive: false });
    }
    function unlockScroll(){
      window.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('keydown', keyHandler);
    }

    // Lock scroll initially while hero is in view
    lockScroll();

    // If the user scrolls away somehow, unlock; if they come back and not completed, re-lock
    document.addEventListener('scroll', () => {
      if (completed) return;
      if (sectionInView(section)) lockScroll(); else unlockScroll();
    }, { passive: true });
  }

  function initParallaxStack(gallery){
    const section = gallery.closest('.stack-section') || gallery.parentElement;
    const viewport = gallery.querySelector('.stack-viewport');
    const cards = Array.from(gallery.querySelectorAll('.stack-card'));
    if (!viewport || cards.length === 0) return;

    const base = 28; // px offset between cards

    function setSectionHeight(){
      const vh = viewport.clientHeight || 480;
      const minH = vh + base * (cards.length - 1) + 160;
      section.style.minHeight = minH + 'px';
    }

    let ticking = false;
    function update(){
      const rect = section.getBoundingClientRect();
      const stickyH = viewport.clientHeight;
      const totalScroll = (rect.height - stickyH) || 1;
      const progressed = clamp((0 - rect.top) / totalScroll, 0, 1);
      for (let i = 0; i < cards.length; i++){
        const card = cards[i];
        const y = (i * base) * (1 - progressed);
        const scale = (1 - i * 0.01) + progressed * (i * 0.01);
        card.style.transform = `translateY(${y}px) scale(${scale})`;
        card.style.zIndex = String(cards.length - i);
        card.style.opacity = '1';
      }
      ticking = false;
    }

    function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }

    setSectionHeight();
    update();

    window.addEventListener('resize', () => { setSectionHeight(); update(); }, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });

    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        const vis = entries.some(e => e.isIntersecting);
        if (vis) update();
      }, { root: null, threshold: [0, 0.1, 1] });
      io.observe(section);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stack-gallery').forEach(gallery => {
      if (gallery.classList.contains('wow-stack')){
        initWowStack(gallery);
      } else {
        initParallaxStack(gallery);
      }
    });
  });
})();
