(function () {
  var root = document.body.dataset.root || '';
  var page = document.body.dataset.page || '';
  var lessonId = document.body.dataset.lesson || '';
  var lessons = window.LESSONS || [];

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'text') node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  // Links inside data files are written relative to the site root.
  function resolve(path) {
    return /^https?:\/\//.test(path) ? path : root + path;
  }

  function formatDate(value) {
    var date = new Date(value + 'T00:00');
    if (isNaN(date)) return value;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ---------- Theme ---------- */
  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  function applyTheme(theme) {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  }
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  applyTheme(storedTheme());

  /* ---------- Header ---------- */
  var header = document.getElementById('site-header');
  if (header) {
    var links = [
      { id: 'home', label: 'Lessons', href: 'index.html' },
      { id: 'tutorials', label: 'Tutorials', href: 'tutorials.html' },
      { id: 'assignments', label: 'Assignments', href: 'assignments.html' }
    ];
    var nav = el('nav', { class: 'site-nav' }, links.map(function (link) {
      var active = link.id === page || (link.id === 'home' && page === 'lesson');
      return el('a', { href: root + link.href, class: active ? 'active' : '', text: link.label });
    }));
    var toggle = el('button', { class: 'theme-toggle', type: 'button', text: 'Light / Dark' });
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* theme just won't be remembered */ }
    });
    var brand = el('a', { class: 'brand', href: root + 'index.html' });
    brand.appendChild(document.createTextNode('App Inventor '));
    brand.appendChild(el('span', { text: 'Class Notes' }));
    header.className = 'site-header';
    header.appendChild(el('div', { class: 'inner' }, [brand, nav, toggle]));
  }

  /* ---------- Lesson sidebar + previous / next ---------- */
  var sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.className = 'sidebar';
    sidebar.appendChild(el('h4', { text: 'Lessons' }));
    sidebar.appendChild(el('ol', {}, lessons.map(function (lesson) {
      return el('li', {}, [el('a', {
        href: root + lesson.file,
        class: lesson.id === lessonId ? 'active' : '',
        text: lesson.title
      })]);
    })));
  }

  var pager = document.getElementById('pager');
  if (pager) {
    var index = lessons.findIndex(function (lesson) { return lesson.id === lessonId; });
    var prev = lessons[index - 1];
    var next = lessons[index + 1];
    pager.className = 'pager';
    pager.appendChild(prev
      ? el('a', { href: root + prev.file, text: '← ' + prev.title })
      : el('span'));
    pager.appendChild(next
      ? el('a', { href: root + next.file, text: next.title + ' →' })
      : el('span', { class: 'muted', text: 'More lessons coming soon' }));
  }

  /* ---------- Home: lesson cards ---------- */
  var lessonCards = document.getElementById('lesson-cards');
  if (lessonCards) {
    lessons.forEach(function (lesson, i) {
      lessonCards.appendChild(el('a', { class: 'card', href: root + lesson.file }, [
        el('span', { class: 'tag', text: 'Lesson ' + (i + 1) }),
        el('h3', { text: lesson.title }),
        el('p', { text: lesson.summary })
      ]));
    });
  }

  /* ---------- Assignments / tutorials ---------- */
  function renderItems(containerId, items, emptyText) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (!items || !items.length) {
      container.appendChild(el('div', { class: 'empty', text: emptyText }));
      return;
    }
    var grid = el('div', { class: 'cards' });
    items.forEach(function (item) {
      var actions = el('div', { class: 'actions' }, [
        item.file ? el('a', { class: 'btn', href: resolve(item.file), target: '_blank', rel: 'noopener', text: 'Open file' }) : null,
        item.link ? el('a', { class: 'btn', href: resolve(item.link), target: '_blank', rel: 'noopener', text: 'Open link' }) : null
      ]);
      var tag = item.due ? 'Due ' + formatDate(item.due) : (item.date ? formatDate(item.date) : '');
      grid.appendChild(el('div', { class: 'card' }, [
        tag ? el('span', { class: 'tag', text: tag }) : null,
        el('h3', { text: item.title }),
        item.description ? el('p', { text: item.description }) : null,
        actions
      ]));
    });
    container.appendChild(grid);
  }

  renderItems('assignment-list', window.ASSIGNMENTS, 'No assignments have been posted yet.');
  renderItems('tutorial-list', window.TUTORIALS, 'No tutorials have been posted yet.');
})();
