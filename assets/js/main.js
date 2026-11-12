/* ЭРА МИЛОСЕРДИЯ — скрипты сайта: мобильное меню, плеер лекций, видео по щелчку. */
(function () {
  'use strict';

  /* ---------- мобильное меню (каталог выезжает слева) ---------- */
  var sidebar = document.getElementById('sidebar');
  var burger = document.querySelector('.header__burger');
  var closeBtn = document.querySelector('.sidebar__close');
  var backdrop = document.querySelector('.drawer-backdrop');

  function setDrawer(open) {
    if (!sidebar || !burger) return;
    sidebar.classList.toggle('is-open', open);
    document.body.classList.toggle('drawer-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (backdrop) backdrop.hidden = !open;
    if (open && closeBtn) closeBtn.focus();
    if (!open) burger.focus();
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(!sidebar.classList.contains('is-open')); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  if (backdrop) backdrop.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && sidebar && sidebar.classList.contains('is-open')) setDrawer(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1023 && sidebar && sidebar.classList.contains('is-open')) {
      sidebar.classList.remove('is-open');
      document.body.classList.remove('drawer-open');
      burger.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.hidden = true;
    }
  });

  /* ---------- плеер лекций: один звук на страницу ---------- */
  var audio = null;
  var current = null;

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function parts(track) {
    return {
      btn: track.querySelector('.track__play'),
      bar: track.querySelector('.track__bar'),
      seek: track.querySelector('.track__seek'),
      time: track.querySelector('.track__time'),
      error: track.querySelector('.track__error'),
      title: (track.querySelector('.track__title') || {}).textContent || ''
    };
  }
  function setPlaying(track, playing) {
    var p = parts(track);
    track.classList.toggle('is-playing', playing);
    p.btn.setAttribute('aria-label', (playing ? 'Пауза: ' : 'Слушать: ') + p.title);
  }
  function release(track) {
    if (!track) return;
    setPlaying(track, false);
    track.classList.remove('is-current', 'is-loading');
    parts(track).bar.hidden = true;
  }
  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'none';
    audio.addEventListener('timeupdate', function () {
      if (!current) return;
      var p = parts(current);
      if (current.classList.contains('is-loading') && audio.currentTime === 0) return;
      if (isFinite(audio.duration) && audio.duration > 0) {
        if (!p.seek.matches(':active')) p.seek.value = String(audio.currentTime / audio.duration * 100);
        p.time.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
      } else {
        p.time.textContent = fmt(audio.currentTime);
      }
    });
    audio.addEventListener('play', function () { if (current) setPlaying(current, true); });
    audio.addEventListener('waiting', function () { if (current) current.classList.add('is-loading'); });
    audio.addEventListener('playing', function () { if (current) current.classList.remove('is-loading'); });
    audio.addEventListener('pause', function () { if (current) setPlaying(current, false); });
    audio.addEventListener('ended', function () {
      if (!current) return;
      var next = current.nextElementSibling;
      release(current);
      current = null;
      if (next && next.classList.contains('track')) start(next);
    });
    audio.addEventListener('error', function () {
      if (!current) return;
      var p = parts(current);
      setPlaying(current, false);
      current.classList.remove('is-loading');
      p.bar.hidden = true;
      p.error.hidden = false;
    });
    return audio;
  }
  function start(track) {
    var a = ensureAudio();
    var p = parts(track);
    if (current && current !== track) release(current);
    if (current !== track) {
      current = track;
      a.src = track.getAttribute('data-audio');
      p.seek.value = '0';
      p.time.textContent = 'Загрузка…';
      track.classList.add('is-loading');
    }
    p.error.hidden = true;
    p.bar.hidden = false;
    track.classList.add('is-current');
    var promise = a.play();
    if (promise && promise.catch) promise.catch(function () { /* ошибку покажет событие error */ });
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('.track__play') : null;
    if (btn) {
      var track = btn.closest('.track');
      if (track === current && audio && !audio.paused) audio.pause();
      else start(track);
      return;
    }
    /* ---------- видео: рамка YouTube появляется только по щелчку ---------- */
    var thumb = ev.target.closest ? ev.target.closest('.video__thumb') : null;
    if (thumb) {
      var card = thumb.closest('.video');
      var id = card.getAttribute('data-yt');
      if (audio && !audio.paused) audio.pause();
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      frame.title = thumb.getAttribute('aria-label') || 'Видео';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      thumb.replaceWith(frame);
    }
  });

  document.addEventListener('input', function (ev) {
    var seek = ev.target;
    if (!seek.classList || !seek.classList.contains('track__seek')) return;
    var track = seek.closest('.track');
    if (track !== current || !audio || !isFinite(audio.duration)) return;
    audio.currentTime = audio.duration * (parseFloat(seek.value) / 100);
  });
})();
