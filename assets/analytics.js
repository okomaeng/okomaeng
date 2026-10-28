/* 오코맹 GA4 이벤트. 폼 입력값은 읽거나 분석 도구로 전송하지 않습니다. */
(function () {
  'use strict';

  var pageType = /\/result\.html$/.test(location.pathname) ? 'result' : 'landing';

  function track(eventName, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, Object.assign({ page_type: pageType }, params || {}));
  }

  window.okomaengTrack = track;

  document.querySelectorAll('[data-track]').forEach(function (element) {
    element.addEventListener('click', function () {
      var params = {
        element_id: element.id || undefined,
        element_text: (element.textContent || '').trim().replace(/\s+/g, ' '),
        element_location: element.dataset.location,
        destination: element.dataset.destination
      };

      if (element.dataset.track === 'click_map') {
        params.store_name = 'hyehwa';
        params.address_id = 'daemyeonggil_14';
      }

      track(element.dataset.track, params);
    });
  });

  if (pageType === 'result') {
    track('lead_confirmation_view', { form_id: 'lead-form' });
  }
})();
