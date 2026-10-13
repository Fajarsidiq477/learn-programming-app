// Student login: class → class code → name on the roster.
(function () {
  var box = document.getElementById('join');
  var Store = window.Store;
  var el = window.App.el;

  function show(children) {
    box.textContent = '';
    children.forEach(function (child) { if (child) box.appendChild(child); });
  }

  function problem(text) {
    return el('p', { class: 'form-error', role: 'alert', text: text });
  }

  function failed() {
    show([problem('Something went wrong while contacting the server. Check your internet connection and reload the page.')]);
  }

  var MIN_PASSWORD = 4;

  // First time: the student creates a password. After that: they must enter it.
  function askPassword(student, item, isNew) {
    var password = el('input', { id: 'join-password', type: 'password', required: '', minlength: String(MIN_PASSWORD), autocomplete: isNew ? 'new-password' : 'current-password' });
    var repeat = el('input', { id: 'join-repeat', type: 'password', required: '', autocomplete: 'new-password' });
    var error = el('div');
    var submit = el('button', { class: 'btn', type: 'submit', text: isNew ? 'Save password and start' : 'Log in' });
    var back = el('button', { type: 'button', class: 'link-button', text: '← This is not me' });
    back.addEventListener('click', function () { pickName(student); });

    var form = el('form', { class: 'form' }, [
      el('label', { for: 'join-password', text: isNew ? 'Create your password (at least ' + MIN_PASSWORD + ' characters)' : 'Your password' }), password,
      isNew ? el('label', { for: 'join-repeat', text: 'Type it again' }) : null,
      isNew ? repeat : null,
      error, submit
    ]);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.textContent = '';
      if (isNew && password.value !== repeat.value) {
        return error.appendChild(problem('The two passwords are not the same. Type them again.'));
      }
      submit.disabled = true;
      var action = isNew ? Store.createPassword : Store.chooseStudent;
      action(student.classId, item, password.value).then(function () {
        location.href = 'index.html';
      }, function (reason) {
        submit.disabled = false;
        var denied = reason && reason.code === 'permission-denied';
        error.appendChild(problem(!denied
          ? 'Could not reach the server. Check your internet connection and try again.'
          : (isNew
            ? 'This name already has a password. Go back and choose your name again.'
            : 'That password is not right. Try again.')));
      });
    });

    show([
      el('h2', { class: 'plain', text: 'Hello, ' + item.name }),
      el('p', { class: 'muted', text: isNew
        ? 'This is your first time here. Choose a password that only you know and remember it: you need it every time you log in.'
        : 'Enter your password to continue. Forgot it? Ask your teacher to reset it.' }),
      form,
      back
    ]);
    password.focus();
  }

  function pickName(student) {
    show([el('p', { class: 'muted', text: 'Loading names…' })]);
    Promise.all([Store.listStudents(student.classId), Store.listClaimed(student.classId)]).then(function (loaded) {
      var students = loaded[0];
      var claimed = loaded[1];
      if (!students.length) {
        return show([problem('There are no names in ' + student.className + ' yet. Ask your teacher.'), backButton()]);
      }
      var list = el('div', { class: 'name-list' }, students.map(function (item) {
        var button = el('button', { type: 'button', class: 'name-button', text: item.name });
        button.addEventListener('click', function () {
          askPassword(student, item, !claimed[item.id]);
        });
        return button;
      }));
      show([
        el('h2', { class: 'plain', text: student.className + ': who are you?' }),
        el('p', { class: 'muted', text: 'Pick your own name. You will be asked for your password.' }),
        list,
        backButton()
      ]);
    }, failed);
  }

  function backButton() {
    var back = el('button', { type: 'button', class: 'link-button', text: '← Choose a different class' });
    back.addEventListener('click', function () {
      Store.leave().then(function () { location.reload(); });
    });
    return back;
  }

  function pickClass() {
    show([el('p', { class: 'muted', text: 'Loading classes…' })]);
    Store.signInStudent().then(Store.listClasses).then(function (classes) {
      if (!classes.length) {
        return show([problem('No classes have been created yet. Ask your teacher.')]);
      }
      var select = el('select', { id: 'join-class', required: '' }, classes.map(function (item) {
        return el('option', { value: item.id, text: item.name });
      }));
      var code = el('input', { id: 'join-code', type: 'text', required: '', autocomplete: 'off', autocapitalize: 'characters' });
      var error = el('div');
      var submit = el('button', { class: 'btn', type: 'submit', text: 'Continue' });
      var form = el('form', { class: 'form' }, [
        el('label', { for: 'join-class', text: 'Class' }), select,
        el('label', { for: 'join-code', text: 'Class code' }), code,
        error, submit
      ]);
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var chosen = classes.filter(function (item) { return item.id === select.value; })[0];
        submit.disabled = true;
        error.textContent = '';
        Store.join(chosen, code.value).then(function () {
          pickName({ classId: chosen.id, className: chosen.name });
        }, function (reason) {
          submit.disabled = false;
          error.appendChild(problem(reason && reason.code === 'permission-denied'
            ? 'That code is not right for ' + chosen.name + '. Check it and try again.'
            : 'Could not reach the server. Check your internet connection and try again.'));
        });
      });
      show([form]);
    }, failed);
  }

  Store.ready().then(function (session) {
    if (!session.configured) {
      return show([problem('Progress tracking is not set up yet. Your teacher needs to finish the Firebase setup in README.md.')]);
    }
    if (session.error) return failed();
    if (session.role === 'student') return location.replace('index.html');
    if (session.role === 'teacher') {
      return show([el('p', { text: 'You are signed in as a teacher.' }), el('a', { class: 'btn', href: 'admin.html', text: 'Open the dashboard' })]);
    }
    if (session.role === 'joining') return pickName(session.student);
    pickClass();
  });
})();
