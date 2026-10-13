// Everything that talks to Firebase lives in this file.
// Students are signed in anonymously and linked to a name on the class roster;
// the teacher signs in with Google. See firestore.rules for who may read what.
window.Store = (function () {
  var config = window.FIREBASE_CONFIG || {};
  var configured = !!(window.firebase && config.apiKey && config.projectId);
  var auth, db, session, readyPromise;

  if (configured) {
    firebase.initializeApp(config);
    auth = firebase.auth();
    db = firebase.firestore();
  }

  function normalizeCode(code) {
    return String(code || '').trim().toUpperCase();
  }

  function docs(snapshot) {
    return snapshot.docs.map(function (doc) {
      var data = doc.data();
      data.id = doc.id;
      return data;
    });
  }

  function millis(attempt) {
    var at = attempt.createdAt;
    return at && at.toMillis ? at.toMillis() : (at || 0);
  }

  /* ---------- Scores ---------- */
  // Scores are recounted from the saved answers, so the number never depends
  // on what the browser claimed the score was.
  function percent(attempt) {
    var questions = asked(attempt);
    var score = attempt.score || 0;
    var total = attempt.total || 0;
    if (questions.length) {
      total = questions.length;
      score = questions.filter(function (question, i) {
        return question && attempt.answers[i] === question.answer;
      }).length;
    }
    return total ? Math.round(score / total * 100) : 0;
  }

  // The questions an attempt was asked, in the same order as its answers.
  // Attempts saved before quizzes were randomised have no question list:
  // they were asked the first questions of the bank, in order.
  function asked(attempt) {
    var bank = (window.QUIZZES || {})[attempt.lessonId];
    if (!bank || !attempt.answers) return [];
    if (!attempt.questions) return bank.slice(0, attempt.answers.length);
    return attempt.questions.map(function (id) {
      return bank.filter(function (question) { return question.id === id; })[0];
    });
  }

  // Attempts of ONE student → { lessonId: { first, best, count, firstAttempt } }
  function summarize(attempts) {
    var summary = {};
    attempts.slice().sort(function (a, b) { return millis(a) - millis(b); }).forEach(function (attempt) {
      var pct = percent(attempt);
      var entry = summary[attempt.lessonId];
      if (!entry) {
        summary[attempt.lessonId] = { first: pct, best: pct, count: 1, firstAttempt: attempt };
      } else {
        entry.best = Math.max(entry.best, pct);
        entry.count += 1;
      }
    });
    return summary;
  }

  // KKM: the minimum score (in %) a student needs to complete a lesson.
  var KKM = 80;

  function passed(result) {
    return !!result && result.best >= KKM;
  }

  function band(pct) {
    return pct >= KKM ? 'good' : (pct >= 60 ? 'mid' : 'low');
  }

  /* ---------- Session ---------- */
  function currentUser() {
    return new Promise(function (resolve) {
      var stop = auth.onAuthStateChanged(function (user) {
        stop();
        resolve(user);
      });
    });
  }

  function myAttempts() {
    var student = session.student;
    return db.collection('attempts')
      .where('classId', '==', student.classId)
      .where('studentId', '==', student.studentId)
      .get().then(docs);
  }

  // role: 'none' (nobody), 'joining' (class code accepted, no name chosen yet),
  // 'student', 'teacher', or 'guest' (a Google account that is not a teacher).
  function load() {
    session = { configured: configured, role: 'none', student: null, attempts: [] };
    if (!configured) return Promise.resolve(session);
    return currentUser().then(function (user) {
      if (!user) return session;
      if (!user.isAnonymous) {
        session.email = user.email;
        return db.collection('admins').doc(user.email).get().then(function (snap) {
          session.role = snap.exists ? 'teacher' : 'guest';
          return session;
        });
      }
      return db.collection('members').doc(user.uid).get().then(function (snap) {
        if (!snap.exists) return session;
        var member = snap.data();
        session.student = {
          classId: member.classId,
          className: member.className || '',
          studentId: member.studentId || '',
          name: member.studentName || ''
        };
        // No password hash means the browser joined before passwords existed.
        if (!member.studentId || !member.hash) {
          session.role = 'joining';
          return session;
        }
        session.role = 'student';
        return myAttempts().then(function (attempts) {
          session.attempts = attempts;
          return session;
        }, function () {
          // The teacher reset this password: the student has to log in again.
          session.role = 'joining';
          return session;
        });
      });
    }).catch(function (error) {
      session.error = error;
      return session;
    });
  }

  function ready() {
    if (!readyPromise) readyPromise = load();
    return readyPromise;
  }

  /* ---------- Student: join a class ---------- */
  // Students stay signed in only until the browser is closed, so the next
  // student on a shared computer has to enter their own password.
  function signInStudent() {
    if (auth.currentUser && auth.currentUser.isAnonymous) return Promise.resolve();
    return auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(function () {
      return auth.signInAnonymously();
    });
  }

  function listClasses() {
    return db.collection('classes').orderBy('order').get().then(docs);
  }

  // Rejected by firestore.rules when the code is wrong.
  function join(classInfo, code) {
    return db.collection('members').doc(auth.currentUser.uid).set({
      classId: classInfo.id,
      className: classInfo.name,
      code: normalizeCode(code)
    });
  }

  function listStudents(classId) {
    return db.collection('classes').doc(classId).collection('students').orderBy('number').get().then(docs);
  }

  function classDoc(classId) {
    return db.collection('classes').doc(classId);
  }

  // Names that already have a password. The passwords themselves are in
  // /pins, which students cannot read.
  function listClaimed(classId) {
    return classDoc(classId).collection('claimed').get().then(function (snapshot) {
      var claimed = {};
      snapshot.docs.forEach(function (doc) { claimed[doc.id] = true; });
      return claimed;
    });
  }

  // Only a hash of the password is stored, never the password itself.
  function hashPassword(classId, studentId, password) {
    var bytes = new TextEncoder().encode(classId + '/' + studentId + '/' + password);
    return crypto.subtle.digest('SHA-256', bytes).then(function (digest) {
      return Array.prototype.map.call(new Uint8Array(digest), function (byte) {
        return ('0' + byte.toString(16)).slice(-2);
      }).join('');
    });
  }

  // Rejected by firestore.rules when the password is wrong.
  function chooseStudent(classId, student, password) {
    return hashPassword(classId, student.id, password).then(function (hash) {
      return db.collection('members').doc(auth.currentUser.uid).update({
        studentId: student.id,
        studentName: student.name,
        hash: hash
      });
    });
  }

  // First login of a student. Rejected when the name already has a password.
  function createPassword(classId, student, password) {
    return hashPassword(classId, student.id, password).then(function (hash) {
      var batch = db.batch();
      batch.set(classDoc(classId).collection('pins').doc(student.id), { hash: hash });
      batch.set(classDoc(classId).collection('claimed').doc(student.id), {});
      return batch.commit();
    }).then(function () {
      return chooseStudent(classId, student, password);
    });
  }

  function leave() {
    var user = auth.currentUser;
    var forget = user && user.isAnonymous
      ? db.collection('members').doc(user.uid).delete().catch(function () {})
      : Promise.resolve();
    return forget.then(function () { return auth.signOut(); });
  }

  /* ---------- Student: quiz attempts ---------- */
  function saveAttempt(lessonId, questions, answers, score) {
    var attempt = {
      uid: auth.currentUser.uid,
      classId: session.student.classId,
      studentId: session.student.studentId,
      lessonId: lessonId,
      questions: questions,
      answers: answers,
      score: score,
      total: answers.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return db.collection('attempts').add(attempt).then(function () {
      attempt.createdAt = Date.now();
      session.attempts.push(attempt);
    });
  }

  /* ---------- Teacher ---------- */
  function adminSignIn() {
    return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  function signOut() {
    return auth.signOut();
  }

  function classCodes() {
    return db.collection('classSecrets').get().then(function (snapshot) {
      var codes = {};
      snapshot.docs.forEach(function (doc) { codes[doc.id] = doc.data().code; });
      return codes;
    });
  }

  function saveClass(classInfo) {
    var ref = classInfo.id ? db.collection('classes').doc(classInfo.id) : db.collection('classes').doc();
    var batch = db.batch();
    batch.set(ref, { name: classInfo.name, order: classInfo.order || Date.now() }, { merge: true });
    batch.set(db.collection('classSecrets').doc(ref.id), { code: normalizeCode(classInfo.code) });
    return batch.commit().then(function () { return ref.id; });
  }

  function addStudents(classId, names, startNumber) {
    var students = db.collection('classes').doc(classId).collection('students');
    var batch = db.batch();
    names.forEach(function (name, i) {
      batch.set(students.doc(), { name: name, number: startNumber + i });
    });
    return batch.commit();
  }

  // The student picks a new password the next time they choose their name.
  function resetPassword(classId, studentId) {
    var batch = db.batch();
    batch.delete(classDoc(classId).collection('pins').doc(studentId));
    batch.delete(classDoc(classId).collection('claimed').doc(studentId));
    return batch.commit();
  }

  function removeStudent(classId, studentId) {
    var batch = db.batch();
    batch.delete(classDoc(classId).collection('students').doc(studentId));
    batch.delete(classDoc(classId).collection('pins').doc(studentId));
    batch.delete(classDoc(classId).collection('claimed').doc(studentId));
    return batch.commit();
  }

  // Empties a class: every student, their passwords and all their quiz results.
  function removeAllStudents(classId) {
    return Promise.all([
      classDoc(classId).collection('students').get(),
      db.collection('attempts').where('classId', '==', classId).get()
    ]).then(function (loaded) {
      var refs = loaded[1].docs.map(function (doc) { return doc.ref; });
      loaded[0].docs.forEach(function (doc) {
        refs.push(doc.ref);
        refs.push(classDoc(classId).collection('pins').doc(doc.id));
        refs.push(classDoc(classId).collection('claimed').doc(doc.id));
      });
      // A batch holds at most 500 writes.
      var batches = [];
      for (var i = 0; i < refs.length; i += 400) {
        var batch = db.batch();
        refs.slice(i, i + 400).forEach(function (ref) { batch.delete(ref); });
        batches.push(batch.commit());
      }
      return Promise.all(batches);
    });
  }

  // Deletes every attempt of one student for one lesson.
  function resetProgress(classId, studentId, lessonId) {
    return db.collection('attempts')
      .where('classId', '==', classId)
      .where('studentId', '==', studentId)
      .where('lessonId', '==', lessonId)
      .get().then(function (snapshot) {
        var batch = db.batch();
        snapshot.docs.forEach(function (doc) { batch.delete(doc.ref); });
        return batch.commit();
      });
  }

  function classAttempts(classId) {
    return db.collection('attempts').where('classId', '==', classId).get().then(docs);
  }

  return {
    ready: ready,
    percent: percent,
    asked: asked,
    millis: millis,
    summarize: summarize,
    KKM: KKM,
    passed: passed,
    band: band,
    signInStudent: signInStudent,
    listClasses: listClasses,
    join: join,
    listStudents: listStudents,
    listClaimed: listClaimed,
    chooseStudent: chooseStudent,
    createPassword: createPassword,
    resetPassword: resetPassword,
    resetProgress: resetProgress,
    leave: leave,
    saveAttempt: saveAttempt,
    adminSignIn: adminSignIn,
    signOut: signOut,
    classCodes: classCodes,
    saveClass: saveClass,
    addStudents: addStudents,
    removeStudent: removeStudent,
    removeAllStudents: removeAllStudents,
    classAttempts: classAttempts
  };
})();
