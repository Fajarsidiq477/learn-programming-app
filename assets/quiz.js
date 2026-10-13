// The mini quiz at the end of a lesson. Questions come from data/quizzes.js.
(function () {
  var container = document.getElementById('quiz');
  var lessonId = document.body.dataset.lesson || '';
  var bank = (window.QUIZZES || {})[lessonId];
  var Store = window.Store;
  var el = window.App.el;
  if (!container || !bank || !bank.length) return;

  var QUIZ_SIZE = 10; // questions shown per attempt
  var messages = {
    good: 'You reached the KKM. This lesson is complete.',
    mid: 'You need ' + window.Store.KKM + '% (the KKM) to complete this lesson. Read the explanations below, then try again with new questions.',
    low: 'You need ' + window.Store.KKM + '% (the KKM) to complete this lesson. Re-read the lesson, then try again with new questions.'
  };

  // Text between `backticks` is shown as code.
  function rich(tag, text, attrs) {
    var node = el(tag, attrs || {});
    text.split('`').forEach(function (part, i) {
      if (!part) return;
      node.appendChild(i % 2 ? el('code', { text: part }) : document.createTextNode(part));
    });
    return node;
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = copy[i];
      copy[i] = copy[j];
      copy[j] = swap;
    }
    return copy;
  }

  // Reorders questions so the first ones cover as many concepts as possible.
  function spread(list) {
    var groups = {};
    var order = [];
    list.forEach(function (question) {
      if (!groups[question.concept]) {
        groups[question.concept] = [];
        order.push(question.concept);
      }
      groups[question.concept].push(question);
    });
    var result = [];
    while (result.length < list.length) {
      order.forEach(function (concept) {
        if (groups[concept].length) result.push(groups[concept].shift());
      });
    }
    return result;
  }

  function render(session) {
    var canSave = session.role === 'student';
    var history = el('p', { class: 'muted quiz-history' });
    var result = el('div', { class: 'quiz-result', role: 'status' });
    var form = el('form', { class: 'quiz' });
    var submit = el('button', { class: 'btn', type: 'submit', text: 'Submit answers' });
    var retry = el('button', { class: 'btn secondary', type: 'button', text: 'Try again with new questions' });
    var questions = [];
    var blocks = [];

    // question id → number of the round in which it was last shown
    var lastSeen = {};
    var round = 0;
    session.attempts
      .filter(function (attempt) { return attempt.lessonId === lessonId; })
      .sort(function (a, b) { return Store.millis(a) - Store.millis(b); })
      .forEach(function (attempt) {
        round += 1;
        Store.asked(attempt).forEach(function (question) {
          if (question) lastSeen[question.id] = round;
        });
      });

    // New questions first; when the bank runs out, the ones seen longest ago.
    function pick() {
      var fresh = bank.filter(function (question) { return !lastSeen[question.id]; });
      var old = shuffle(bank.filter(function (question) { return lastSeen[question.id]; }))
        .sort(function (a, b) { return lastSeen[a.id] - lastSeen[b.id]; });
      var chosen = spread(shuffle(fresh)).concat(old).slice(0, QUIZ_SIZE);
      round += 1;
      chosen.forEach(function (question) { lastSeen[question.id] = round; });
      return shuffle(chosen);
    }

    function showHistory() {
      var mine = Store.summarize(session.attempts)[lessonId];
      history.textContent = mine
        ? 'First attempt ' + mine.first + '% · Best ' + mine.best + '% · ' + mine.count + (mine.count === 1 ? ' attempt' : ' attempts')
        : '';
    }

    function build() {
      questions = pick();
      form.textContent = '';
      result.textContent = '';
      result.className = 'quiz-result';
      blocks = questions.map(function (question, i) {
        var options = question.options.map(function (option, j) {
          var input = el('input', { type: 'radio', name: 'q' + i, value: j });
          return el('label', { class: 'option' }, [input, rich('span', option)]);
        });
        var block = el('fieldset', { class: 'question' },
          [rich('legend', (i + 1) + '. ' + question.q)].concat(options));
        form.appendChild(block);
        return block;
      });
      retry.hidden = true;
      submit.hidden = false;
      form.appendChild(el('div', { class: 'quiz-actions' }, [submit, retry]));
    }

    function save(ids, answers, score, status) {
      status.textContent = 'Saving your result…';
      Store.saveAttempt(lessonId, ids, answers, score).then(function () {
        status.textContent = 'Your result is saved.';
        showHistory();
        window.App.renderProgress(session);
      }).catch(function () {
        status.textContent = 'Your result could not be saved. Check your internet connection. ';
        var again = el('button', { class: 'link-button', type: 'button', text: 'Save again' });
        again.addEventListener('click', function () { save(ids, answers, score, status); });
        status.appendChild(again);
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var answers = questions.map(function (question, i) {
        var checked = form.querySelector('input[name="q' + i + '"]:checked');
        return checked ? Number(checked.value) : -1;
      });
      var missing = answers.indexOf(-1);
      if (missing !== -1) {
        result.className = 'quiz-result warn';
        result.textContent = 'Answer every question first. Question ' + (missing + 1) + ' has no answer yet.';
        blocks[missing].scrollIntoView({ block: 'center' });
        return;
      }

      var score = 0;
      questions.forEach(function (question, i) {
        var correct = answers[i] === question.answer;
        if (correct) score += 1;
        var block = blocks[i];
        block.classList.add(correct ? 'correct' : 'wrong');
        Array.prototype.forEach.call(block.querySelectorAll('input'), function (input, j) {
          input.disabled = true;
          if (j === question.answer) input.parentNode.classList.add('is-answer');
        });
        block.appendChild(rich('p', (correct ? 'Correct. ' : 'Not quite. ') + question.explain, { class: 'explain' }));
      });

      var pct = Math.round(score / questions.length * 100);
      var band = Store.band(pct);
      var status = el('p', { class: 'muted' });
      result.className = 'quiz-result ' + band;
      result.textContent = '';
      result.appendChild(el('strong', { text: 'You understand ' + pct + '% of this lesson' }));
      result.appendChild(el('p', { text: score + ' of ' + questions.length + ' correct. ' + messages[band] }));
      result.appendChild(status);
      submit.hidden = true;
      retry.hidden = false;
      result.scrollIntoView({ block: 'start' });

      var ids = questions.map(function (question) { return question.id; });
      if (canSave) save(ids, answers, score, status);
      else status.textContent = session.role === 'teacher' ? 'Teacher preview: this result is not saved.' : 'This result is not saved.';
    });

    retry.addEventListener('click', function () {
      build();
      container.scrollIntoView({ block: 'start' });
    });

    container.appendChild(el('h2', { text: 'Quiz: check your understanding' }));
    container.appendChild(el('p', {
      text: 'Answer all ' + Math.min(QUIZ_SIZE, bank.length) + ' questions, then press Submit. ' +
        (canSave ? 'You need ' + Store.KKM + '% (the KKM) to complete this lesson. Your result is saved for your teacher. You can try again as often as you like, and you will get different questions.' : '')
    }));
    container.appendChild(history);
    container.appendChild(result);
    container.appendChild(form);
    showHistory();
    build();
  }

  Store.ready().then(render);
})();
