// The question bank of each lesson. The key is the lesson id from lessons.js.
// A quiz shows 10 questions picked from the bank; when a student tries again,
// questions they have not seen yet are picked first.
//
// Each question:
//   id       a short unique name; saved answers are matched to questions by it
//   q        the question (use `backticks` for block names and code)
//   options  the choices
//   answer   the position of the correct choice, counting from 0
//   explain  shown after the student submits
//   concept  a short label; the teacher dashboard shows it next to weak questions
//
// Adding questions and fixing typos is always fine. After students have started,
// do not change a question's id or the order of its options.
window.QUIZZES = {
  variables: [
    {
      id: 'v1',
      concept: 'What a variable is',
      q: 'What is a variable?',
      options: [
        'A button the user can click',
        'A named place where the app stores a value',
        'A screen in the app',
        'A block that only runs once'
      ],
      answer: 1,
      explain: 'A variable is like a box with a label: the label is its name and the content is its value.'
    },
    {
      id: 'v2',
      concept: 'Get and set',
      q: 'Which block reads the value of a variable without changing it?',
      options: ['`get`', '`set`', '`initialize global`', '`join`'],
      answer: 0,
      explain: '`get` only looks inside the box. `set` replaces the value with a new one.'
    },
    {
      id: 'v3',
      concept: 'Updating a value',
      q: '`score` is 5. The app runs `set score to score + 2` two times. What is the value now?',
      options: ['5', '7', '9', '10'],
      answer: 2,
      explain: 'First 5 + 2 = 7, then 7 + 2 = 9.'
    },
    {
      id: 'v4',
      concept: 'Global and local',
      q: 'Every button on the screen needs to use the player\'s score. Which kind of variable do you need?',
      options: [
        'A local variable',
        'A global variable',
        'One local variable inside each button',
        'No variable, a label is enough'
      ],
      answer: 1,
      explain: 'A global variable works in every event on the screen. A local variable only works inside the block where it was created.'
    },
    {
      id: 'v5',
      concept: 'Types of values',
      q: 'Which type of value is best for remembering whether the sound is on or off?',
      options: ['Number', 'Text', 'List', 'Boolean'],
      answer: 3,
      explain: 'A boolean has only two values: `true` for on and `false` for off.'
    },
    {
      id: 'v6',
      concept: 'Creating a variable',
      q: 'Where do you put the `initialize global` block?',
      options: [
        'Inside the `when Button1.Click` block',
        'Inside a `set` block',
        'Alone on the workspace, not inside any other block',
        'Inside a label'
      ],
      answer: 2,
      explain: '`initialize global` always stands alone on the workspace.'
    },
    {
      id: 'v7',
      concept: 'Updating a value',
      q: '`score` starts at 0. A button runs `set score to 1` every time it is clicked. What is `score` after 3 clicks?',
      options: ['0', '1', '3', '4'],
      answer: 1,
      explain: '`set score to 1` always stores 1. To count clicks you need `set score to score + 1`.'
    },
    {
      id: 'v8',
      concept: 'Naming',
      q: 'Which one is a good variable name?',
      options: ['`player name`', '`2ndPlayer`', '`x`', '`playerName`'],
      answer: 3,
      explain: 'A good name says what is inside, has no spaces and starts with a letter.'
    },
    {
      id: 'v9',
      concept: 'Get and set',
      q: 'Which block throws away the old value of a variable and stores a new one?',
      options: ['`get`', '`initialize local`', '`set`', '`join`'],
      answer: 2,
      explain: '`set` replaces the value. `get` only reads it.'
    },
    {
      id: 'v10',
      concept: 'Updating a value',
      q: '`lives` is 3. The app runs `set lives to lives - 1` one time. What is the value now?',
      options: ['2', '3', '4', '-1'],
      answer: 0,
      explain: 'The app takes the current value 3, subtracts 1 and stores the result: 2.'
    },
    {
      id: 'v11',
      concept: 'Types of values',
      q: 'Which type of value would you use to store the player\'s name?',
      options: ['Number', 'Boolean', 'Text', 'It cannot be stored'],
      answer: 2,
      explain: 'A name such as "Rina" is text. Text blocks are pink.'
    },
    {
      id: 'v12',
      concept: 'Types of values',
      q: 'In which drawer do you find the block for a number such as `75`?',
      options: ['Text (pink)', 'Math (blue)', 'Logic (green)', 'Variables (orange)'],
      answer: 1,
      explain: 'Number blocks are in the Math drawer and are blue.'
    },
    {
      id: 'v13',
      concept: 'What a variable is',
      q: 'Why does a game need a variable for the score?',
      options: [
        'To make the app start faster',
        'To change the colour of the screen',
        'So the user can type text',
        'So the app can remember the score between clicks'
      ],
      answer: 3,
      explain: 'Without a variable the app forgets everything immediately, so it could not keep the score.'
    },
    {
      id: 'v14',
      concept: 'Updating the screen',
      q: 'A button changes the variable `score`, but the label on the screen still shows the old number. Why?',
      options: [
        'Changing a variable does not change the screen; you must also set the label\'s text',
        'Variables cannot be shown in labels',
        'The variable must be local',
        'The app needs to be restarted'
      ],
      answer: 0,
      explain: 'A label only changes when you set its `Text`. After changing the variable, set the label\'s text to the new value.'
    },
    {
      id: 'v15',
      concept: 'Global and local',
      q: 'A variable `total` is created with `initialize local total`. Where can you use it?',
      options: [
        'In every event on the screen',
        'On every screen of the app',
        'Only inside the `in` part of that block',
        'Only inside labels'
      ],
      answer: 2,
      explain: 'A local variable only exists inside the block where it was created, while that block is running.'
    },
    {
      id: 'v16',
      concept: 'Creating a variable',
      q: 'What does `initialize global score to 0` do?',
      options: [
        'It shows 0 on the screen',
        'It creates a variable named `score` with 0 as its first value',
        'It adds 0 to the score',
        'It deletes the variable `score`'
      ],
      answer: 1,
      explain: 'The initialize block creates the box, gives it a name and puts a first value inside.'
    },
    {
      id: 'v17',
      concept: 'Naming',
      q: 'You have two global variables on the same screen. What is true about their names?',
      options: [
        'They must be the same',
        'They must both start with a number',
        'They must contain a space',
        'They must be different'
      ],
      answer: 3,
      explain: 'Every global variable needs its own name, otherwise the app cannot tell them apart.'
    },
    {
      id: 'v18',
      concept: 'Types of values',
      q: 'Can you use the text `"abc"` in a calculation such as `"abc" + 1`?',
      options: [
        'No, a text like this cannot be used in a calculation',
        'Yes, the answer is `"abc1"`',
        'Yes, the answer is 1',
        'Yes, the answer is 0'
      ],
      answer: 0,
      explain: 'Calculations need numbers. Mixing up text and numbers is a common mistake.'
    },
    {
      id: 'v19',
      concept: 'Updating a value',
      q: '`score` is 4. The app runs `set score to score + score` one time. What is the value now?',
      options: ['4', '44', '8', '16'],
      answer: 2,
      explain: 'The app reads the current value twice: 4 + 4 = 8, then stores 8.'
    },
    {
      id: 'v20',
      concept: 'Finding the blocks',
      q: 'Where do you find the variable blocks in App Inventor?',
      options: [
        'In the Designer view, under Palette',
        'In the Blocks view, under Built-in → Variables',
        'In the Blocks view, under Built-in → Control',
        'In the Media panel'
      ],
      answer: 1,
      explain: 'Open the Blocks view and click Built-in → Variables. Variable blocks are orange.'
    }
  ],

  conditions: [
    {
      id: 'c1',
      concept: 'Conditions',
      q: 'What kind of value does a condition give?',
      options: ['A number', 'A text', 'A boolean: `true` or `false`', 'A list'],
      answer: 2,
      explain: 'A condition is a yes-or-no question, so its answer is always `true` or `false`.'
    },
    {
      id: 'c2',
      concept: 'If – then – else',
      q: 'In an `if – then – else` block, can the `then` part and the `else` part both run in the same click?',
      options: [
        'Yes, always',
        'Yes, when the condition is true',
        'No, exactly one of them runs',
        'No, neither of them runs'
      ],
      answer: 2,
      explain: '`then` runs when the condition is true, `else` runs when it is false. Never both.'
    },
    {
      id: 'c3',
      concept: 'And, or, not',
      q: '`age` is 15. What is the answer of `age ≥ 13 and age < 15`?',
      options: ['`true`', '`false`', '15', 'The app shows an error'],
      answer: 1,
      explain: '15 ≥ 13 is true, but 15 < 15 is false, and `and` needs both sides to be true.'
    },
    {
      id: 'c4',
      concept: 'Else if',
      q: 'The app checks: if `score ≥ 90` then A, else if `score ≥ 75` then B, else C. Which grade does a score of 75 get?',
      options: ['A', 'B', 'C', 'No grade'],
      answer: 1,
      explain: '75 ≥ 90 is false, then 75 ≥ 75 is true, so the grade is B.'
    },
    {
      id: 'c5',
      concept: 'If – then',
      q: 'An `if – then` block has no `else` part. What happens when its condition is false?',
      options: [
        'The app closes',
        'The blocks inside `then` still run',
        'The app shows an error',
        'Nothing: the blocks inside `then` are skipped'
      ],
      answer: 3,
      explain: 'Without `else`, a false condition means nothing happens.'
    },
    {
      id: 'c6',
      concept: 'Order of conditions',
      q: 'The app checks `score ≥ 75` (grade B) first, and `score ≥ 90` (grade A) second using `else if`. Which grade does a score of 95 get?',
      options: ['A', 'B', 'Both A and B', 'C'],
      answer: 1,
      explain: 'Only the first true condition runs. 95 ≥ 75 is already true, so the app never checks ≥ 90. Check the strictest condition first.'
    },
    {
      id: 'c7',
      concept: 'Comparing values',
      q: 'What is the answer of `5 ≠ 5`?',
      options: ['`true`', '`false`', '5', '0'],
      answer: 1,
      explain: '≠ means "not equal to". 5 is equal to 5, so the answer is `false`.'
    },
    {
      id: 'c8',
      concept: 'And, or, not',
      q: '`score` is 40. What is the answer of `score < 50 or score > 90`?',
      options: ['`true`', '`false`', '40', 'The app shows an error'],
      answer: 0,
      explain: '`or` is true when at least one side is true. 40 < 50 is true.'
    },
    {
      id: 'c9',
      concept: 'Comparing values',
      q: 'What is the answer of `7 ≥ 5`?',
      options: ['`false`', '7', '`true`', '2'],
      answer: 2,
      explain: '≥ means "greater than or equal to". 7 is greater than 5, so the answer is `true`.'
    },
    {
      id: 'c10',
      concept: 'Comparing values',
      q: 'What is the answer of `5 ≤ 5`?',
      options: ['`true`', '`false`', '5', '0'],
      answer: 0,
      explain: '≤ means "less than or equal to". 5 is equal to 5, so the answer is `true`.'
    },
    {
      id: 'c11',
      concept: 'And, or, not',
      q: 'What does the `not` block do to a condition?',
      options: [
        'It deletes the condition',
        'It runs the condition twice',
        'It turns the answer into a number',
        'It flips the answer: true becomes false and false becomes true'
      ],
      answer: 3,
      explain: '`not` is true when the condition is false, and false when the condition is true.'
    },
    {
      id: 'c12',
      concept: 'And, or, not',
      q: '`score` is 80. What is the answer of `score ≥ 75 and score < 90`?',
      options: ['`false`', '`true`', '80', 'The app shows an error'],
      answer: 1,
      explain: '80 ≥ 75 is true and 80 < 90 is true. Both sides are true, so `and` gives `true`.'
    },
    {
      id: 'c13',
      concept: 'If – then – else',
      q: 'The app checks: if the number typed is `≥ 75` then show "Passed", else show "Try again". The user types 75. What does the label show?',
      options: ['Try again', 'Nothing', 'Passed', 'Passed and Try again'],
      answer: 2,
      explain: '75 ≥ 75 is true, so the `then` part runs and the label shows "Passed".'
    },
    {
      id: 'c14',
      concept: 'If – then – else',
      q: 'The app checks: if the number typed is `≥ 75` then show "Passed", else show "Try again". The user types 60. Which part runs?',
      options: ['The `else` part', 'The `then` part', 'Both parts', 'Neither part'],
      answer: 0,
      explain: '60 ≥ 75 is false, so the `else` part runs and the label shows "Try again".'
    },
    {
      id: 'c15',
      concept: 'Else if',
      q: 'The app checks: if `score ≥ 90` then A, else if `score ≥ 75` then B, else C. The score is 95. Does the app check `score ≥ 75`?',
      options: [
        'Yes, it always checks every condition',
        'Yes, and it changes the grade to B',
        'Only if the user clicks again',
        'No, it stops after the first condition that is true'
      ],
      answer: 3,
      explain: 'With `else if`, the app runs only the first true condition and skips all the rest.'
    },
    {
      id: 'c16',
      concept: 'Else if',
      q: 'The app checks: if `score ≥ 90` then A, else if `score ≥ 75` then B, else C. Which grade does a score of 50 get?',
      options: ['A', 'B', 'C', 'No grade'],
      answer: 2,
      explain: 'Both conditions are false, so the `else` part runs: C.'
    },
    {
      id: 'c17',
      concept: 'Separate if blocks',
      q: 'You use two separate `if` blocks instead of one `if` with `else if`. What can go wrong?',
      options: [
        'The app will not open',
        'Both blocks are checked, so both can run and the last one overwrites the first',
        'Only the second block is ever checked',
        'Nothing, it is exactly the same'
      ],
      answer: 1,
      explain: 'Separate `if` blocks are all checked. With `else if`, only the first true condition runs.'
    },
    {
      id: 'c18',
      concept: 'Conditions',
      q: 'Which one of these is a condition?',
      options: ['`score ≥ 75`', '`set score to 75`', '`"Passed"`', '`score + 75`'],
      answer: 0,
      explain: 'A condition is a yes-or-no question. `score ≥ 75` is either true or false.'
    },
    {
      id: 'c19',
      concept: 'Comparing text',
      q: 'You want to check whether the text typed in a text box equals your secret word. Which block do you use?',
      options: [
        'The `+` block from the Math drawer',
        'The `join` block from the Text drawer',
        'The `initialize global` block',
        'The `compare texts` block from the Text drawer'
      ],
      answer: 3,
      explain: 'Text is compared with `compare texts`, found in the Text drawer.'
    },
    {
      id: 'c20',
      concept: 'Finding the blocks',
      q: 'Where do you find the `if – then` block?',
      options: [
        'Built-in → Variables',
        'Built-in → Math',
        'Built-in → Control',
        'Built-in → Text'
      ],
      answer: 2,
      explain: 'The `if – then` block is at the top of the Control drawer.'
    }
  ]
};
