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

  /* Куда уходят ответы гостей — Google Форма.
     action  — ссылка вида https://docs.google.com/forms/d/e/<ID>/formResponse
     entries — номера полей формы (entry.XXXXXXXXX).
     Пока пусто, ответы только сохраняются в браузере гостя. */
  googleForm: {
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSctQs7ZIjb3O7rmZZM-8EugHEcgkVcznvuWmgCv7braQ00DUg/formResponse',
    entries: {
      name: 'entry.1839734041',
      attendance: 'entry.1981387846',
      guests: 'entry.1414147150'
    }
  },

  /* Сообщения формы. */
  rsvpText: {
    sending: 'Жіберілуде…',
    submit: 'Растау',
    noName: 'Есіміңізді жазыңызшы'
  },

  /* startAt — с какой секунды трека начинать (75 = 1 мин 15 сек). */
  music: { startAt: 75, volume: 0.7, labelPlay: 'әуенді қосу', labelPause: 'әуенді өшіру' }
};

document.addEventListener('DOMContentLoaded', () => {

  /* ===== КАРТА ===== */

  const mapBtn = document.getElementById('mapBtn');
  if (mapBtn) mapBtn.href = CONFIG.mapUrl;

  /* ===== ӘУЕН (фоновая музыка) ===== */

  const audio = document.getElementById('bgMusic');
  const musicBtn = document.getElementById('musicBtn');


  if (audio && musicBtn) {
    const START_AT = CONFIG.music.startAt || 0;
    audio.volume = CONFIG.music.volume;

    const setState = (playing) => {
      const label = playing ? CONFIG.music.labelPause : CONFIG.music.labelPlay;
      musicBtn.classList.toggle('is-playing', playing);
      musicBtn.setAttribute('aria-pressed', String(playing));
      musicBtn.setAttribute('aria-label', label);
      musicBtn.setAttribute('title', label);
    };

    /* Перемотка на нужную секунду. Работает только после загрузки метаданных. */
    const seekToStart = () => {
      if (audio.readyState < 1) return false;
      try {
        audio.currentTime = START_AT;
        return true;
      } catch (err) {
        return false;
      }
    };

    /* Трек играет по кругу и каждый раз начинается с той же секунды. */
    audio.addEventListener('ended', () => {
      seekToStart();
      audio.play().then(() => setState(true)).catch(() => setState(false));
    });

    /* Браузеры блокируют звук до первого действия пользователя.
       Поэтому: пробуем включить сразу, а если не вышло — при первом
       касании, клике или прокрутке страницы. */
    const KICK_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'scroll'];

    function detachKick() {
      KICK_EVENTS.forEach((name) => window.removeEventListener(name, kick));
    }

    function kick(e) {
      if (e && e.target && musicBtn.contains(e.target)) return;
      if (!audio.paused) { detachKick(); return; }
      if (audio.currentTime < 1) seekToStart();
      audio.play().then(() => {
        setState(true);
        detachKick();
      }).catch(() => {});
    }

    KICK_EVENTS.forEach((name) => window.addEventListener(name, kick, { passive: true }));

    const autostart = () => {
      seekToStart();
      audio.play().then(() => {
        setState(true);
        detachKick();
      }).catch(() => setState(false));
    };

    if (audio.readyState >= 1) {
      autostart();
    } else {
      audio.addEventListener('loadedmetadata', autostart, { once: true });
    }

    musicBtn.addEventListener('click', () => {
      if (audio.paused) {
        if (audio.currentTime < 1) seekToStart();
        audio.play().then(() => {
          setState(true);
          detachKick();
        }).catch(() => setState(false));
      } else {
        audio.pause();
        setState(false);
      }
    });
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
  const submitBtn = document.getElementById('rsvpSubmit');
  const guestsField = document.getElementById('rsvpGuestsField');

  /* Гостю, который не сможет прийти, поле «сколько человек» не нужно. */
  const CANNOT_COME = 'Келе алмаймын';

  if (form) {
    const attendanceInputs = form.querySelectorAll('input[name="attendance"]');

    const syncGuestsField = () => {
      const checked = form.querySelector('input[name="attendance"]:checked');
      const coming = !checked || checked.value !== CANNOT_COME;
      if (guestsField) guestsField.hidden = !coming;
    };

    attendanceInputs.forEach((input) => input.addEventListener('change', syncGuestsField));
    syncGuestsField();

    const showError = (text) => {
      if (!errorMsg) return;
      errorMsg.textContent = text;
      errorMsg.hidden = false;
    };

    /* Отправка в Google Форму.
       Обычный fetch эта форма отклоняет (400) — Google принимает только
       настоящую отправку формы. Поэтому подставляем скрытую форму и шлём
       её в скрытый iframe: так запрос неотличим от отправки со страницы
       самой Google Формы. Ответ iframe прочитать нельзя (чужой домен),
       поэтому событие load — единственный признак, что запрос дошёл. */
    const sendToGoogleForm = (answer) => new Promise((resolve) => {
      const { action, entries } = CONFIG.googleForm;
      if (!action || !entries.name) { resolve(false); return; }

      const frame = document.createElement('iframe');
      frame.name = 'rsvp-sink-' + Date.now();
      frame.src = 'about:blank';
      frame.hidden = true;
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('tabindex', '-1');

      const proxy = document.createElement('form');
      proxy.method = 'POST';
      proxy.action = action;
      proxy.target = frame.name;
      proxy.hidden = true;

      const add = (name, value) => {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        field.value = value;
        proxy.appendChild(field);
      };

      add(entries.name, answer.name);
      add(entries.attendance, answer.attendance);
      /* Служебное поле вопроса с вариантами: без него ответ не принимается. */
      add(entries.attendance + '_sentinel', '');
      if (entries.guests) add(entries.guests, answer.guests);
      add('fvv', '1');
      add('pageHistory', '0');

      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        proxy.remove();
        setTimeout(() => frame.remove(), 0);
        resolve(ok);
      };

      const timer = setTimeout(() => finish(false), 8000);

      /* Первый load — это пустая страница about:blank, его пропускаем. */
      frame.addEventListener('load', function onBlank() {
        frame.removeEventListener('load', onBlank);
        frame.addEventListener('load', () => finish(true), { once: true });
        document.body.appendChild(proxy);
        proxy.submit();
      });

      document.body.appendChild(frame);
    });

    const saveLocally = (answer) => {
      try {
        const stored = JSON.parse(localStorage.getItem('danaRsvp') || '[]');
        stored.push(answer);
        localStorage.setItem('danaRsvp', JSON.stringify(stored));
      } catch (err) {
        /* приватный режим браузера — просто пропускаем */
      }
    };

    let sending = false;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sending) return;

      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();

      if (!name) {
        showError(CONFIG.rsvpText.noName);
        document.getElementById('rsvpName').focus();
        return;
      }
      if (errorMsg) errorMsg.hidden = true;

      const attendance = String(data.get('attendance') || '');
      const answer = {
        name,
        attendance,
        guests: attendance === CANNOT_COME ? '0' : String(data.get('guests') || '1'),
        sentAt: new Date().toISOString()
      };

      saveLocally(answer);

      sending = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = CONFIG.rsvpText.sending;
      }

      sendToGoogleForm(answer).finally(() => {
        sending = false;
        form.hidden = true;
        if (thanks) thanks.hidden = false;
      });
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
