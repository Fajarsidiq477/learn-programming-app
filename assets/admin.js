// Teacher dashboard: progress per class, students who need help, weak questions,
// and class / roster management.
(function () {
  var box = document.getElementById('admin');
  var Store = window.Store;
  var el = window.App.el;
  var lessons = window.LESSONS || [];
  var quizzes = window.QUIZZES || {};

  var tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attention', label: 'Needs attention' },
    { id: 'questions', label: 'Question analysis' },
    { id: 'classes', label: 'Class & roster' }
  ];

  var state = {
    classes: [],
    codes: {},
    classId: null,   // null = the "new class" form
    tab: 'overview',
    lessonId: lessons.length ? lessons[0].id : '',
    students: [],
    claimed: {},      // studentId → true when the student has set a password
    results: {}      // studentId → { lessonId: { first, best, count, firstAttempt } }
  };

  function show(children) {
    box.textContent = '';
    children.forEach(function (child) { if (child) box.appendChild(child); });
  }

  function button(text, className, onClick) {
    var node = el('button', { type: 'button', class: className, text: text });
    node.addEventListener('click', onClick);
    return node;
  }

  function fail(error) {
    var denied = error && error.code === 'permission-denied';
    show([
      el('p', { class: 'form-error', role: 'alert', text: 'Could not load data: ' + (error && error.message ? error.message : 'unknown error') }),
      denied ? el('p', { text: 'The database rules are missing or out of date. In the Firebase console open Firestore → Rules, replace everything with the content of firestore.rules from this project, press Publish, then reload this page.' }) : null
    ]);
  }

  function pill(pct) {
    return el('span', { class: 'pill ' + Store.band(pct), text: pct + '%' });
  }

  function average(numbers) {
    if (!numbers.length) return null;
    return Math.round(numbers.reduce(function (a, b) { return a + b; }, 0) / numbers.length);
  }

  function currentClass() {
    return state.classes.filter(function (item) { return item.id === state.classId; })[0];
  }

  /* ---------- Loading ---------- */
  function loadClasses() {
    return Promise.all([Store.listClasses(), Store.classCodes()]).then(function (loaded) {
      state.classes = loaded[0];
      state.codes = loaded[1];
      if (!currentClass()) state.classId = state.classes.length ? state.classes[0].id : null;
      if (!state.classId) state.tab = 'classes';
    });
  }

  function loadClassData() {
    state.students = [];
    state.claimed = {};
    state.results = {};
    if (!state.classId) return Promise.resolve();
    return Promise.all([
      Store.listStudents(state.classId),
      Store.classAttempts(state.classId),
      Store.listClaimed(state.classId)
    ]).then(function (loaded) {
      state.claimed = loaded[2];
      var byStudent = {};
      loaded[1].forEach(function (attempt) {
        (byStudent[attempt.studentId] = byStudent[attempt.studentId] || []).push(attempt);
      });
      state.students = loaded[0];
      state.students.forEach(function (student) {
        state.results[student.id] = Store.summarize(byStudent[student.id] || []);
      });
    });
  }

  function reload() {
    show([el('p', { class: 'muted', text: 'Loading…' })]);
    loadClasses().then(loadClassData).then(render, fail);
  }

  function selectClass(classId) {
    state.classId = classId;
    if (!classId) state.tab = 'classes';
    show([el('p', { class: 'muted', text: 'Loading…' })]);
    loadClassData().then(render, fail);
  }

  /* ---------- Overview ---------- */
  function overview() {
    if (!state.students.length) {
      return el('div', { class: 'empty', text: 'This class has no students yet. Add them in "Class & roster".' });
    }
    var head = el('tr', {}, [el('th', { text: '#' }), el('th', { text: 'Student' })].concat(
      lessons.map(function (lesson) { return el('th', { text: lesson.title }); }),
      [el('th', { text: 'Complete' })]
    ));
    var rows = state.students.map(function (student, i) {
      var mine = state.results[student.id];
      var done = 0;
      var cells = lessons.map(function (lesson) {
        var result = mine[lesson.id];
        if (!result) return el('td', {}, [el('span', { class: 'pill todo', text: 'Not started' })]);
        if (Store.passed(result)) done += 1;
        var reset = button('Reset', 'link-button small', function () {
          if (!window.confirm('Delete all ' + lesson.title + ' quiz results of ' + student.name + '? This cannot be undone. The lesson goes back to "Not started" for this student.')) return;
          Store.resetProgress(state.classId, student.id, lesson.id).then(reload, fail);
        });
        return el('td', {}, [
          pill(result.first),
          el('span', { class: 'muted small', text: ' best ' + result.best + '% · ' + result.count + (result.count === 1 ? ' try ' : ' tries ') }),
          reset
        ]);
      });
      return el('tr', {}, [el('td', { text: String(i + 1) }), el('td', { text: student.name })].concat(
        cells, [el('td', { text: done + ' / ' + lessons.length })]
      ));
    });
    var foot = el('tr', { class: 'total' }, [el('td'), el('td', { text: 'Class average (first attempt)' })].concat(
      lessons.map(function (lesson) {
        var firsts = state.students
          .map(function (student) { return state.results[student.id][lesson.id]; })
          .filter(Boolean)
          .map(function (result) { return result.first; });
        var avg = average(firsts);
        return el('td', {}, avg === null
          ? [el('span', { class: 'muted', text: 'No results yet' })]
          : [pill(avg), el('span', { class: 'muted small', text: ' ' + firsts.length + ' of ' + state.students.length + ' started' })]);
      }),
      [el('td')]
    ));
    return el('div', {}, [
      el('p', { class: 'muted', text: 'The coloured score is the first attempt, which shows what the student understood from reading. A lesson is complete when the best score reaches the KKM of ' + Store.KKM + '%; "Complete" counts those lessons. "Reset" deletes a student\'s results for that lesson so they start it again.' }),
      el('div', { class: 'table-wrap' }, [el('table', { class: 'dash' }, [head].concat(rows, [foot]))])
    ]);
  }

  /* ---------- Needs attention ---------- */
  function attention() {
    if (!state.students.length) {
      return el('div', { class: 'empty', text: 'This class has no students yet.' });
    }
    return el('div', {}, lessons.map(function (lesson) {
      var low = [];
      var missing = [];
      state.students.forEach(function (student) {
        var result = state.results[student.id][lesson.id];
        if (!result) missing.push(student);
        else if (!Store.passed(result)) low.push({ student: student, result: result });
      });
      low.sort(function (a, b) { return a.result.best - b.result.best; });

      function group(title, items) {
        return el('div', { class: 'card' }, [
          el('h3', { text: title + ' (' + items.length + ')' }),
          items.length ? el('ul', { class: 'plain-list' }, items) : el('p', { text: 'Nobody.' })
        ]);
      }
      return el('section', {}, [
        el('h2', { text: lesson.title }),
        el('div', { class: 'cards' }, [
          group('Below KKM (best score under ' + Store.KKM + '%)', low.map(function (item) {
            return el('li', {}, [
              pill(item.result.best),
              document.createTextNode(' ' + item.student.name),
              el('span', { class: 'muted small', text: ' (first attempt ' + item.result.first + '%, ' + item.result.count + (item.result.count === 1 ? ' try)' : ' tries)') })
            ]);
          })),
          group('Not started', missing.map(function (student) {
            return el('li', { text: student.name });
          }))
        ])
      ]);
    }));
  }

  /* ---------- Question analysis ---------- */
  function plain(text) {
    return text.replace(/`/g, '');
  }

  function questionAnalysis() {
    var quiz = quizzes[state.lessonId] || [];
    var firsts = state.students
      .map(function (student) { return (state.results[student.id][state.lessonId] || {}).firstAttempt; })
      .filter(Boolean);

    var picker = el('div', { class: 'tabs small-tabs' }, lessons.map(function (lesson) {
      return button(lesson.title, lesson.id === state.lessonId ? 'active' : '', function () {
        state.lessonId = lesson.id;
        render();
      });
    }));
    if (!firsts.length) {
      return el('div', {}, [picker, el('div', { class: 'empty', text: 'No student in this class has done this quiz yet.' })]);
    }

    // Each student gets a different set of questions, so every question is
    // measured against the students who were actually asked it.
    var stats = quiz.map(function (question) {
      var wrong = {};
      var right = 0;
      var seen = 0;
      firsts.forEach(function (attempt) {
        var position = Store.asked(attempt).indexOf(question);
        if (position === -1) return;
        var answer = attempt.answers[position];
        seen += 1;
        if (answer === question.answer) right += 1;
        else wrong[answer] = (wrong[answer] || 0) + 1;
      });
      var common = Object.keys(wrong).sort(function (a, b) { return wrong[b] - wrong[a]; })[0];
      return {
        question: question,
        seen: seen,
        right: right,
        pct: seen ? Math.round(right / seen * 100) : 0,
        common: common === undefined || !question.options[common] ? '' : plain(question.options[common]) + ' (' + wrong[common] + ')'
      };
    }).filter(function (item) { return item.seen; })
      .sort(function (a, b) { return a.pct - b.pct || b.seen - a.seen; });

    var head = el('tr', {}, ['Question', 'Concept', 'Answered correctly', 'Most common wrong answer'].map(function (title) {
      return el('th', { text: title });
    }));
    var rows = stats.map(function (item) {
      var bar = el('span', { class: 'bar' }, [el('span', { class: 'fill ' + Store.band(item.pct), style: 'width:' + item.pct + '%' })]);
      return el('tr', {}, [
        el('td', { text: plain(item.question.q) }),
        el('td', { text: item.question.concept || '' }),
        el('td', { class: 'nowrap' }, [bar, document.createTextNode(' ' + item.pct + '% (' + item.right + ' of ' + item.seen + ')')]),
        el('td', { text: item.common || 'None' })
      ]);
    });
    return el('div', {}, [
      picker,
      el('p', { class: 'muted', text: 'First attempts of ' + firsts.length + ' students, hardest question first. Each student gets a different set of questions, so "3 of 5" means 5 students were asked it and 3 were right. Questions at the top are the concepts to teach again.' }),
      el('div', { class: 'table-wrap' }, [el('table', { class: 'dash' }, [head].concat(rows))])
    ]);
  }

  /* ---------- Class & roster ---------- */
  function classForm() {
    var current = currentClass();
    var name = el('input', { id: 'class-name', type: 'text', required: '', placeholder: '10 STAN', value: current ? current.name : '' });
    var code = el('input', { id: 'class-code', type: 'text', required: '', minlength: '4', autocomplete: 'off', value: current ? (state.codes[current.id] || '') : '' });
    var status = el('span', { class: 'muted small', role: 'status' });
    var form = el('form', { class: 'form' }, [
      el('label', { for: 'class-name', text: 'Class name' }), name,
      el('label', { for: 'class-code', text: 'Class code (students type this to join; not case-sensitive)' }), code,
      el('div', {}, [el('button', { class: 'btn', type: 'submit', text: current ? 'Save class' : 'Create class' }), status])
    ]);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.textContent = ' Saving…';
      Store.saveClass({
        id: current ? current.id : null,
        order: current ? current.order : null,
        name: name.value.trim(),
        code: code.value
      }).then(function (id) {
        state.classId = id;
        reload();
      }, function (error) { status.textContent = ' Could not save: ' + error.message; });
    });
    return form;
  }

  function roster() {
    var names = el('textarea', { id: 'roster-names', rows: '8', placeholder: 'One name per line' });
    var status = el('span', { class: 'muted small', role: 'status' });
    var add = el('form', { class: 'form' }, [
      el('label', { for: 'roster-names', text: 'Add students (paste one name per line)' }), names,
      el('div', {}, [el('button', { class: 'btn', type: 'submit', text: 'Add students' }), status])
    ]);
    add.addEventListener('submit', function (event) {
      event.preventDefault();
      var list = names.value.split('\n').map(function (line) { return line.trim(); }).filter(Boolean);
      if (!list.length) return;
      var last = state.students.reduce(function (max, student) { return Math.max(max, student.number || 0); }, 0);
      status.textContent = ' Saving…';
      Store.addStudents(state.classId, list, last + 1).then(reload, function (error) {
        status.textContent = ' Could not save: ' + error.message;
      });
    });

    var rows = state.students.map(function (student, i) {
      var remove = button('Remove', 'link-button', function () {
        if (!window.confirm('Remove ' + student.name + ' from the roster? Their quiz results stay in the database but will no longer be shown.')) return;
        Store.removeStudent(state.classId, student.id).then(reload, fail);
      });
      var hasPassword = state.claimed[student.id];
      var reset = hasPassword ? button('Reset password', 'link-button', function () {
        if (!window.confirm('Reset the password of ' + student.name + '? They will choose a new password the next time they log in. Their quiz results are kept.')) return;
        Store.resetPassword(state.classId, student.id).then(reload, fail);
      }) : null;
      return el('tr', {}, [
        el('td', { text: String(i + 1) }),
        el('td', { text: student.name }),
        el('td', {}, [el('span', { class: 'pill ' + (hasPassword ? 'good' : 'todo'), text: hasPassword ? 'Password set' : 'Not logged in yet' })]),
        el('td', { class: 'row-actions' }, [reset, remove])
      ]);
    });
    return el('div', {}, [
      el('h2', { text: 'Roster (' + state.students.length + ' students)' }),
      rows.length ? el('div', { class: 'table-wrap' }, [el('table', { class: 'dash' }, rows)]) : el('p', { class: 'muted', text: 'No students yet.' }),
      rows.length ? button('Remove all students', 'btn danger', function () {
        var name = currentClass().name;
        if (!window.confirm('Remove all ' + state.students.length + ' students from ' + name + '? This also deletes their passwords and ALL their quiz results. This cannot be undone.')) return;
        show([el('p', { class: 'muted', text: 'Removing students…' })]);
        Store.removeAllStudents(state.classId).then(reload, fail);
      }) : null,
      add
    ]);
  }

  function classSettings() {
    return el('div', { class: 'narrow-col' }, [
      el('h2', { class: 'plain', text: currentClass() ? 'Class settings' : 'New class' }),
      classForm(),
      currentClass() ? roster() : null
    ]);
  }

  /* ---------- Frame ---------- */
  function render() {
    var classRow = el('div', { class: 'tabs' }, state.classes.map(function (item) {
      return button(item.name, item.id === state.classId ? 'active' : '', function () { selectClass(item.id); });
    }).concat([button('+ New class', state.classId ? '' : 'active', function () { selectClass(null); })]));

    var tabRow = state.classId ? el('div', { class: 'tabs small-tabs' }, tabs.map(function (tab) {
      return button(tab.label, tab.id === state.tab ? 'active' : '', function () {
        state.tab = tab.id;
        render();
      });
    })) : null;

    var views = { overview: overview, attention: attention, questions: questionAnalysis, classes: classSettings };
    show([
      el('div', { class: 'dash-bar' }, [
        el('span', { class: 'muted small', text: 'Signed in as ' + state.email }),
        button('Refresh', 'link-button', reload),
        button('Sign out', 'link-button', function () { Store.signOut().then(function () { location.reload(); }); })
      ]),
      classRow,
      tabRow,
      views[state.tab]()
    ]);
  }

  function signInCard(message) {
    var error = el('div');
    show([
      el('div', { class: 'panel' }, [
        el('p', { text: message }),
        button('Sign in with Google', 'btn', function () {
          Store.adminSignIn().then(function () { location.reload(); }, function (reason) {
            error.textContent = '';
            error.appendChild(el('p', { class: 'form-error', role: 'alert', text: 'Sign-in did not finish: ' + reason.message }));
          });
        }),
        error
      ])
    ]);
  }

  Store.ready().then(function (session) {
    if (!session.configured) {
      return show([el('p', { class: 'form-error', text: 'Firebase is not set up yet. Follow "Set up progress tracking" in README.md, then reload this page.' })]);
    }
    if (session.error) return fail(session.error);
    if (session.role === 'teacher') {
      state.email = session.email;
      return reload();
    }
    if (session.role === 'guest') {
      return signInCard(session.email + ' is not registered as a teacher. Add a document with this email as its ID to the "admins" collection in Firestore, or sign in with a different account.');
    }
    signInCard('This page is for the teacher. Sign in with your Google account to see class progress.');
  });
})();
