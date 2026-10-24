/*
  신청 폼 처리. 입력값은 어디로도 보내지 않습니다.
  - 폼 입력칸에는 name 속성이 없어서, 스크립트가 꺼져 있어도 값이 주소창·서버로 넘어가지 않습니다.
  - 제출 → 개인정보 안내 팝업 → 동의 → 입력값 즉시 삭제 → result.html 이동.
  - 나중에 폼을 Make·구글시트 등에 연결하면 팝업 문구(index.html의 #privacy-modal)를 반드시 고쳐야 합니다.
*/
(function () {
  var form = document.getElementById('lead-form');
  var modal = document.getElementById('privacy-modal');
  var slides = document.querySelectorAll('[data-hero-slider] .hero-slide');
  var sliderTimer = null;
  var currentSlide = 0;

  function showNextSlide() {
    slides[currentSlide].classList.remove('is-active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('is-active');
  }

  if (slides.length > 1) {
    sliderTimer = window.setInterval(showNextSlide, 3000);
    window.addEventListener('pagehide', function () {
      window.clearInterval(sliderTimer);
      sliderTimer = null;
    }, { once: true });
  }
  var menuSlides = document.querySelectorAll('[data-menu-carousel] .menu-slide');
  var menuDots = document.querySelectorAll('[data-menu-dot]');
  var menuPrev = document.querySelector('[data-menu-prev]');
  var menuNext = document.querySelector('[data-menu-next]');
  var currentMenu = 0;

  function showMenu(index) {
    currentMenu = (index + menuSlides.length) % menuSlides.length;
    menuSlides.forEach(function (slide, slideIndex) {
      slide.hidden = slideIndex !== currentMenu;
    });
    menuDots.forEach(function (dot, dotIndex) {
      var isActive = dotIndex === currentMenu;
      dot.classList.toggle('is-active', isActive);
      if (isActive) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  if (menuSlides.length > 1 && menuPrev && menuNext) {
    menuPrev.addEventListener('click', function () { showMenu(currentMenu - 1); });
    menuNext.addEventListener('click', function () { showMenu(currentMenu + 1); });
    menuDots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () { showMenu(dotIndex); });
    });
    showMenu(0);
  }

  if (!modal) return;
  var agree = document.getElementById('privacy-agree');
  var ok = document.getElementById('privacy-ok');
  var cancel = document.getElementById('privacy-cancel');
  var mode = 'info';

  function wipe() {
    if (!form) return;
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else el.value = '';
    });
    form.reset();
  }

  function open(m) {
    mode = m;
    agree.checked = false;
    ok.disabled = true;
    ok.textContent = m === 'submit' ? '동의하고 완료하기' : '확인했습니다';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    agree.focus();
  }

  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  agree.addEventListener('change', function () { ok.disabled = !agree.checked; });
  cancel.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  ok.addEventListener('click', function () {
    if (mode !== 'submit') { close(); return; }
    wipe();
    // 분석 도구를 붙였다면 여기서 개인정보 없이 이벤트 이름만 보냅니다 (Day 34~35).
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
    location.replace('result.html');
  });

  document.querySelectorAll('[data-privacy-open]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); open('info'); });
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      open('submit');
    });
  }

  // 검토 메모 패널 닫기 (검토용 빌드에만 있음)
  var rp = document.querySelector('.review-panel button');
  if (rp) rp.addEventListener('click', function () { rp.parentNode.remove(); });
})();
