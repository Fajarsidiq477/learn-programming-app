# App Inventor Class Notes

Lessons with quizzes, tutorials and assignments for the Grade 10 MIT App Inventor class, plus a teacher dashboard that tracks each student's understanding.

It is a plain HTML/CSS/JavaScript site with no build step. GitHub Pages publishes whatever is on the `main` branch. Student progress is stored in Firebase (free plan).

## How it works

- **Students** open the site, choose their class, type the class code, pick their name and enter their password. The first time, they create that password themselves. They stay logged in until they close the browser or press **Log out**. Each lesson ends with a quiz. The score is saved. A lesson is complete when the student reaches the KKM of 80%, and only then does the next lesson unlock. The home page shows the student which lesson to do next. Students may retake a quiz; every attempt is kept.
- **The teacher** opens `admin.html`, signs in with Google and sees, per class: first-attempt and best score for every student and lesson, a list of students with low understanding or who have not started, and which questions the class got wrong most often.

## Set up progress tracking (once, about 10 minutes)

1. Go to <https://console.firebase.google.com>, create a project (Google Analytics is not needed).
2. **Build → Authentication → Get started → Sign-in method:** enable **Anonymous** and **Google**.
3. **Authentication → Settings → Authorized domains:** add `fajarsidiq477.github.io` (or wherever the site is hosted).
4. **Build → Firestore Database → Create database** (production mode, any nearby location such as `asia-southeast2`).
5. **Firestore → Rules:** replace everything with the content of `firestore.rules`, then **Publish**.
6. **Firestore → Data → Start collection:** collection ID `admins`, document ID = your Google email address (for example `teacher@school.sch.id`). The document needs no fields. Add one document per teacher.
7. **Project settings → Your apps → Web (`</>`)**: register an app, then copy `apiKey`, `authDomain`, `projectId` and `appId` into `assets/firebase-config.js`. Commit and push.
8. Open `admin.html`, sign in with Google, then for each class (10 STAN, 10 MIT, 10 OXF) press **+ New class**, give it a name and a class code, and paste the student names.

Give each class its own code and share it only in that class. Use a code that is hard to guess (6 or more letters and numbers).

## Preview on your computer

```
python -m http.server 8000
```

Then open <http://localhost:8000>. Opening the files directly (`file://`) does not work with Google sign-in. `localhost` is already an authorized domain in Firebase.

## Folders

| Path | What it is |
| --- | --- |
| `index.html` | Student home page: the lesson to do next and progress per lesson |
| `login.html` | Where students join their class |
| `admin.html` | Teacher dashboard |
| `lessons/` | One HTML file per lesson |
| `data/lessons.js` | The lesson list, in unlock order |
| `data/quizzes.js` | The quiz questions of every lesson |
| `tutorials/` + `data/tutorials.js` | Tutorial files and their list |
| `assignments/` + `data/assignments.js` | Assignment files and their list |
| `assets/` | Shared style and scripts (`store.js` is the only file that talks to Firebase) |
| `firestore.rules` | Database security rules (paste into the Firebase console) |

## Add a lesson

1. Copy `lessons/conditions.html` to a new file, for example `lessons/loops.html`.
2. Change the `<title>`, `data-lesson="loops"` on the `<body>` tag, and the content. Keep `<section id="quiz"></section>` where the quiz should appear.
3. Add an entry with the same `id` to `data/lessons.js`. Its position in the list is its unlock order.
4. Add a question bank with the same `id` to `data/quizzes.js` (the top of that file explains the format).

Each quiz shows 10 questions picked from the lesson's bank of 20. When a student tries again, questions they have not seen yet come first, so the second attempt is completely different. From the third attempt on, the questions seen longest ago come back. To change the number of questions per quiz, edit `QUIZ_SIZE` in `assets/quiz.js`.

To change the KKM, edit `KKM` in `assets/store.js`.

Adding questions and fixing typos is always fine. Once students have started, do not change a question's `id` or the order of its options: saved answers are matched by them.

## Upload an assignment or tutorial

1. Put the file in `assignments/` or `tutorials/`.
2. Add an entry to `data/assignments.js` or `data/tutorials.js` (each file has an example at the top).
3. Commit and push. The site updates in about a minute.

This also works from the GitHub website: open the folder, choose **Add file → Upload files**, then edit the data file with the pencil icon.

## Good to know

- A student who changes device just logs in again with the same name and password; their results are still there.
- **Let a student start a lesson again:** dashboard → **Overview** → **Reset** next to that lesson's score. This permanently deletes the student's results for that one lesson.
- **Forgotten password:** open the dashboard → **Class & roster** → **Reset password** next to the student. They choose a new password the next time they pick their name, and their quiz results are kept. Any browser still logged in as that student is logged out.
- A name without a password can be claimed by anyone who knows the class code. Have students log in for the first time during class, and check the roster: every student should show "Password set".
- Passwords are stored as a hash; nobody, including the teacher, can read them.
- The quiz answers are in `data/quizzes.js`, which a curious student could find. Treat the quiz as a check of understanding, not as an exam.
- Changing a class code does not log out students who already joined.

## Drawing blocks

Lessons draw App Inventor blocks with HTML. The colour classes are `var`, `ctrl`, `logic`, `math`, `text`, `evt`, `set` and `get`:

```html
<div class="blocks">
  <div class="blk var">set <span class="field">global score</span> to <span class="blk math">0</span></div>
</div>
```

You can also use a screenshot: save it in the lesson's folder and add `<img src="my-screenshot.png" alt="...">`.
