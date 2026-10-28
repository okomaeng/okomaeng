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
  var menuIds = ['seafood_okonomiyaki', 'osaka_okonomiyaki', 'beef_yakisoba', 'seafood_yakisoba'];

  function track(eventName, params) {
    if (typeof window.okomaengTrack === 'function') window.okomaengTrack(eventName, params);
  }

  function menuData(index, method) {
    var title = menuSlides[index].querySelector('h3');
    var menuName = title ? title.textContent.trim() : menuIds[index];
    return {
      item_list_id: 'recommended_menu',
      item_list_name: '추천 메뉴',
      menu_name: menuName,
      menu_index: index + 1,
      interaction_method: method,
      items: [{ item_id: menuIds[index], item_name: menuName, index: index }]
    };
  }

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
    menuPrev.addEventListener('click', function () {
      showMenu(currentMenu - 1);
      track('menu_carousel_click', menuData(currentMenu, 'previous'));
    });
    menuNext.addEventListener('click', function () {
      showMenu(currentMenu + 1);
      track('menu_carousel_click', menuData(currentMenu, 'next'));
    });
    menuDots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showMenu(dotIndex);
        track('select_item', menuData(currentMenu, 'dot'));
      });
    });
    showMenu(0);
  }

  if (!modal) return;
  var agree = document.getElementById('privacy-agree');
  var ok = document.getElementById('privacy-ok');
  var cancel = document.getElementById('privacy-cancel');
  var mode = 'info';
  var modalSource = 'unknown';
  var formStarted = false;

  function wipe() {
    if (!form) return;
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else el.value = '';
    });
    form.reset();
  }

  function open(m, source) {
    mode = m;
    modalSource = source || 'unknown';
    agree.checked = false;
    ok.disabled = true;
    ok.textContent = m === 'submit' ? '동의하고 완료하기' : '확인했습니다';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    agree.focus();
    track('privacy_modal_open', { modal_mode: mode, modal_source: modalSource });
  }

  function close(method) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    track('privacy_modal_close', { modal_mode: mode, modal_source: modalSource, close_method: method });
  }

  agree.addEventListener('change', function () {
    ok.disabled = !agree.checked;
    track('privacy_consent_change', { modal_mode: mode, consent_state: agree.checked ? 'checked' : 'unchecked' });
  });
  cancel.addEventListener('click', function () { close('cancel'); });
  modal.addEventListener('click', function (e) { if (e.target === modal) close('backdrop'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) close('escape');
  });

  ok.addEventListener('click', function () {
    track('privacy_modal_confirm', { modal_mode: mode, modal_source: modalSource });
    if (mode !== 'submit') { close('confirm'); return; }
    wipe();
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead');

    var navigated = false;
    function finish() {
      if (navigated) return;
      navigated = true;
      location.replace('result.html');
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        form_id: 'lead-form',
        lead_source: 'website_open_notice',
        event_callback: finish,
        event_timeout: 900
      });
      window.setTimeout(finish, 1000);
    } else {
      finish();
    }
  });

  document.querySelectorAll('[data-privacy-open]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      open('info', b.dataset.modalSource || 'unknown');
    });
  });

  if (form) {
    form.addEventListener('focusin', function (e) {
      if (formStarted || !e.target.matches('input, select, textarea')) return;
      formStarted = true;
      track('lead_form_start', { form_id: 'lead-form', form_name: 'open_notice' });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        var invalidField = form.querySelector(':invalid');
        if (invalidField) {
          track('form_validation_error', {
            form_id: 'lead-form',
            field_name: invalidField.id === 'f-name' ? 'name' : 'contact',
            validation_reason: invalidField.validity.valueMissing ? 'required' : 'pattern'
          });
        }
        track('lead_form_attempt', { form_id: 'lead-form', validation_state: 'invalid' });
        form.reportValidity();
        return;
      }
      track('lead_form_attempt', { form_id: 'lead-form', validation_state: 'valid' });
      open('submit', 'form_submit');
    });
  }

  // 검토 메모 패널 닫기 (검토용 빌드에만 있음)
  var rp = document.querySelector('.review-panel button');
  if (rp) rp.addEventListener('click', function () { rp.parentNode.remove(); });
})();
