/* ============================================================
   Дана — Ұзату той
   Все настраиваемые значения собраны в CONFIG ниже.
   ============================================================ */

const CONFIG = {
  /* Дата и время тоя. +05:00 — время Атырауской области (Құлсары). */
  eventDate: '2026-10-17T12:00:00+05:00',

  /* Месяц, который показывает календарь, и выделенный день. */
  calendar: { year: 2026, month: 10, highlight: 17 },

  /* Ссылка на точку на карте.
     Заменить на точную ссылку из 2ГИС: «Поделиться» → «Скопировать ссылку». */
  mapUrl: 'https://2gis.kz/search/%D2%9A%D2%B1%D0%BB%D1%81%D0%B0%D1%80%D1%8B%2C%20205%20%D0%BA%D3%A9%D1%88%D0%B5%2083',

  /* Куда отправлять ответы гостей.
     Пока пусто — ответы сохраняются в браузере гостя.
     Указать номер в формате 77011234567, чтобы ответ уходил в WhatsApp. */
  whatsappPhone: '',

  music: { labelPlay: 'әуенді қосу', labelPause: 'әуенді өшіру' }
};

document.addEventListener('DOMContentLoaded', () => {

  /* ===== КАРТА ===== */

  const mapBtn = document.getElementById('mapBtn');
  if (mapBtn) mapBtn.href = CONFIG.mapUrl;

  /* ===== ӘУЕН (фоновая музыка) ===== */

  const audio = document.getElementById('bgMusic');
  const musicBtn = document.getElementById('musicBtn');
  const musicLabel = document.getElementById('musicLabel');

  if (audio && musicBtn) {
    const setState = (playing) => {
      musicBtn.classList.toggle('is-playing', playing);
      musicBtn.setAttribute('aria-pressed', String(playing));
      musicLabel.textContent = playing ? CONFIG.music.labelPause : CONFIG.music.labelPlay;
    };

    musicBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.volume = 0.7;
        audio.play().then(() => setState(true)).catch(() => setState(false));
      } else {
        audio.pause();
        setState(false);
      }
    });

    audio.addEventListener('ended', () => setState(false));
  }

  /* ===== КАЛЕНДАРЬ ===== */

  const grid = document.getElementById('calendarGrid');
  const monthTitle = document.getElementById('calendarMonth');

  if (grid) {
    const MONTHS_KK = ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
                       'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'];
    const WEEKDAYS_KK = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк'];

    const { year, month, highlight } = CONFIG.calendar;

    if (monthTitle) monthTitle.textContent = `${MONTHS_KK[month - 1]} ${year}`;

    const cell = (text, modifier) => {
      const el = document.createElement('span');
      el.className = 'calendar__cell' + (modifier ? ' calendar__cell--' + modifier : '');
      el.textContent = text;
      return el;
    };

    WEEKDAYS_KK.forEach((day) => grid.appendChild(cell(day, 'head')));

    /* getDay(): 0 — воскресенье. Неделя начинается с понедельника. */
    const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.appendChild(cell('', 'empty'));

    for (let day = 1; day <= daysInMonth; day++) {
      const weekday = (firstDay + day - 1) % 7;
      let modifier = weekday >= 5 ? 'weekend' : '';
      if (day === highlight) modifier = 'target';

      const el = cell(String(day), modifier);
      if (day === highlight) {
        el.setAttribute('aria-label', `${day} ${MONTHS_KK[month - 1]} — той күні`);
      }
      grid.appendChild(el);
    }
  }

  /* ===== КЕРІ САНАҚ (обратный отсчёт) ===== */

  const target = new Date(CONFIG.eventDate).getTime();
  const fields = {
    days: document.getElementById('cdDays'),
    hours: document.getElementById('cdHours'),
    minutes: document.getElementById('cdMinutes'),
    seconds: document.getElementById('cdSeconds')
  };
  const cdGrid = document.getElementById('countdown');
  const cdDone = document.getElementById('countdownDone');

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      if (cdGrid) cdGrid.hidden = true;
      if (cdDone) cdDone.hidden = false;
      clearInterval(timer);
      return;
    }

    const sec = Math.floor(diff / 1000);
    const pad = (n) => String(n).padStart(2, '0');

    if (fields.days)    fields.days.textContent = Math.floor(sec / 86400);
    if (fields.hours)   fields.hours.textContent = pad(Math.floor(sec / 3600) % 24);
    if (fields.minutes) fields.minutes.textContent = pad(Math.floor(sec / 60) % 60);
    if (fields.seconds) fields.seconds.textContent = pad(sec % 60);
  }

  tick();
  const timer = setInterval(tick, 1000);

  /* ===== САУАЛНАМА (RSVP) ===== */

  const form = document.getElementById('rsvpForm');
  const thanks = document.getElementById('rsvpThanks');
  const errorMsg = document.getElementById('rsvpError');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();

      if (!name) {
        if (errorMsg) errorMsg.hidden = false;
        document.getElementById('rsvpName').focus();
        return;
      }
      if (errorMsg) errorMsg.hidden = true;

      const answer = {
        name,
        attendance: data.get('attendance'),
        guests: data.get('guests'),
        sentAt: new Date().toISOString()
      };

      /* Сохраняем ответ локально, чтобы он не потерялся. */
      try {
        const stored = JSON.parse(localStorage.getItem('danaRsvp') || '[]');
        stored.push(answer);
        localStorage.setItem('danaRsvp', JSON.stringify(stored));
      } catch (err) {
        /* приватный режим браузера — просто пропускаем */
      }

      /* Если указан номер — открываем WhatsApp с готовым текстом. */
      if (CONFIG.whatsappPhone) {
        const text = `Сауалнама — Дананың ұзату тойы\nАты-жөні: ${answer.name}\nЖауабы: ${answer.attendance}\nҚонақтар саны: ${answer.guests}`;
        window.open(`https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }

      form.hidden = true;
      if (thanks) thanks.hidden = false;
    });
  }

  /* ===== ПОЯВЛЕНИЕ СЕКЦИЙ ПРИ ПРОКРУТКЕ ===== */

  const revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealables.forEach((el) => observer.observe(el));
});
