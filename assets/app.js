(function () {
  var root = document.body.dataset.root || '';
  var page = document.body.dataset.page || '';
  var lessonId = document.body.dataset.lesson || '';
  var lessons = window.LESSONS || [];
  var Store = window.Store;

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
  var nav, userBox;
  if (header) {
    var links = [
      { id: 'home', label: 'Lessons', href: 'index.html' },
      { id: 'tutorials', label: 'Tutorials', href: 'tutorials.html' },
      { id: 'assignments', label: 'Assignments', href: 'assignments.html' },
      { id: 'editor', label: 'App Inventor ↗', href: 'https://ai2.appinventor.mit.edu/' }
    ];
    nav = el('nav', { class: 'site-nav' }, links.map(function (link) {
      var active = link.id === page || (link.id === 'home' && page === 'lesson');
      var attrs = { href: resolve(link.href), class: active ? 'active' : '', text: link.label };
      if (link.id === 'editor') {
        attrs.target = '_blank';
        attrs.rel = 'noopener';
      }
      return el('a', attrs);
    }));
    userBox = el('div', { class: 'user-box' });
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
    header.appendChild(el('div', { class: 'inner' }, [brand, nav, userBox, toggle]));
  }

  /* ---------- Lesson sidebar + previous / next ---------- */
  var sidebarLinks = {};
  var sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.className = 'sidebar';
    sidebar.appendChild(el('h4', { text: 'Lessons' }));
    sidebar.appendChild(el('ol', {}, lessons.map(function (lesson) {
      sidebarLinks[lesson.id] = el('a', {
        href: root + lesson.file,
        class: lesson.id === lessonId ? 'active' : '',
        text: lesson.title
      });
      return el('li', {}, [sidebarLinks[lesson.id]]);
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
  var cardTags = {};
  var lessonCards = document.getElementById('lesson-cards');
  if (lessonCards) {
    lessons.forEach(function (lesson, i) {
      cardTags[lesson.id] = el('span', { class: 'tag', text: 'Lesson ' + (i + 1) });
      lessonCards.appendChild(el('a', { class: 'card', href: root + lesson.file }, [
        cardTags[lesson.id],
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

  /* ---------- Student progress + lesson locking ---------- */
  // Lesson pages start hidden (class "gated" on <body>) until we know the
  // student may read them.
  function openPage() {
    document.body.classList.remove('gated');
  }

  function showMessage(className, children) {
    if (header) header.parentNode.insertBefore(el('div', { class: className + ' page-message' }, children), header.nextSibling);
  }

  // A lesson is complete when the best quiz score reaches the KKM; only then
  // does the next lesson open.
  function renderProgress(session) {
    var summary = Store.summarize(session.attempts);
    var done = 0;
    var lockedBy = null;
    var nextUp = null;

    lessons.forEach(function (lesson, i) {
      var result = summary[lesson.id];
      var before = lessons[i - 1];
      var locked = !!before && !Store.passed(summary[before.id]);
      var passed = Store.passed(result);
      var label = result
        ? result.best + '% · ' + (passed ? 'Complete' : 'Below KKM')
        : (locked ? 'Locked' : 'Not started');
      var state = result ? (passed ? 'good' : 'low') : (locked ? 'locked' : 'todo');
      if (passed) done += 1;
      else if (!nextUp && !locked) nextUp = { lesson: lesson, number: i + 1, result: result };
      if (locked && lesson.id === lessonId) lockedBy = before;

      var link = sidebarLinks[lesson.id];
      if (link) {
        var old = link.querySelector('.status');
        if (old) link.removeChild(old);
        link.appendChild(el('span', { class: 'status ' + state, text: result ? result.best + '%' : label }));
      }
      var tag = cardTags[lesson.id];
      if (tag) {
        tag.textContent = 'Lesson ' + (i + 1) + ' · ' + label;
        tag.className = 'tag ' + state;
        tag.parentNode.classList.toggle('locked', locked);
      }
    });

    var progress = document.getElementById('progress-summary');
    if (progress) progress.textContent = done + ' of ' + lessons.length + ' complete';

    var next = document.getElementById('next-lesson');
    if (next) {
      next.textContent = '';
      next.className = 'panel next-lesson';
      if (!nextUp) {
        next.appendChild(el('h2', { class: 'plain', text: 'All lessons complete' }));
        next.appendChild(el('p', { text: 'Well done. You reached the KKM in every lesson.' }));
      } else {
        next.appendChild(el('span', { class: 'eyebrow', text: nextUp.result ? 'Finish this lesson' : 'Your next lesson' }));
        next.appendChild(el('h2', { class: 'plain', text: 'Lesson ' + nextUp.number + ': ' + nextUp.lesson.title }));
        next.appendChild(el('p', { text: nextUp.result
          ? 'Your best quiz score is ' + nextUp.result.best + '%. You need ' + Store.KKM + '% to complete it. Read the lesson again, then retake the quiz.'
          : nextUp.lesson.summary }));
        next.appendChild(el('a', { class: 'btn', href: root + nextUp.lesson.file, text: nextUp.result ? 'Continue lesson' : 'Start lesson' }));
      }
    }
    return lockedBy;
  }

  function start(session) {
    var needsLogin = page === 'home' || page === 'lesson';

    if (!session.configured) {
      if (needsLogin) {
        showMessage('warn', [el('p', { text: 'Progress tracking is not set up yet, so quiz results are not saved.' })]);
      }
      return openPage();
    }

    if (session.role === 'teacher') {
      nav.appendChild(el('a', { href: root + 'admin.html', class: page === 'admin' ? 'active' : '', text: 'Dashboard' }));
      userBox.appendChild(el('span', { text: 'Teacher preview' }));
      return openPage();
    }

    if (session.role !== 'student') {
      if (needsLogin) location.replace(root + 'login.html');
      else if (page !== 'login' && page !== 'admin') userBox.appendChild(el('a', { href: root + 'login.html', text: 'Join your class' }));
      return;
    }

    var switchButton = el('button', { class: 'link-button', type: 'button', text: 'Log out' });
    switchButton.addEventListener('click', function () {
      Store.leave().then(function () { location.href = root + 'login.html'; });
    });
    userBox.appendChild(el('span', { text: session.student.name + ' · ' + session.student.className }));
    userBox.appendChild(switchButton);

    var lockedBy = renderProgress(session);
    if (page === 'lesson' && lockedBy) {
      var content = document.querySelector('main.content');
      content.parentNode.insertBefore(el('main', { class: 'content lock-notice' }, [
        el('h1', { text: 'This lesson is locked' }),
        el('p', { class: 'lead', text: 'Score at least ' + Store.KKM + '% in the quiz of "' + lockedBy.title + '" first.' }),
        el('a', { class: 'btn', href: root + lockedBy.file, text: 'Go to ' + lockedBy.title })
      ]), content);
      return;
    }
    openPage();
  }

  if (Store) {
    Array.prototype.forEach.call(document.querySelectorAll('.kkm'), function (node) {
      node.textContent = Store.KKM;
    });
  }

  window.App = { el: el, root: root, renderProgress: renderProgress };

  if (Store) Store.ready().then(start);
  else openPage();
})();
