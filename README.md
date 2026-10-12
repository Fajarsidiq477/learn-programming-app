# App Inventor Class Notes

Class notes, tutorials and assignments for the Grade 10 MIT App Inventor class.

It is a plain HTML/CSS/JavaScript site with no build step. Open `index.html` in a browser to preview it; GitHub Pages publishes whatever is on the `main` branch.

## Folders

| Path | What it is |
| --- | --- |
| `index.html` | Home page |
| `lessons/` | One HTML file per lesson |
| `data/lessons.js` | The lesson list (menu and home page cards) |
| `tutorials/` + `data/tutorials.js` | Tutorial files and their list |
| `assignments/` + `data/assignments.js` | Assignment files and their list |
| `assets/` | Shared style and script |

## Add a lesson

1. Copy `lessons/if-else.html` to a new file, for example `lessons/loops.html`.
2. Change the `<title>`, `data-lesson="loops"` on the `<body>` tag, and the content.
3. Add an entry with the same `id` to `data/lessons.js`.

## Upload an assignment or tutorial

1. Put the file in `assignments/` or `tutorials/`.
2. Add an entry to `data/assignments.js` or `data/tutorials.js` (each file has an example at the top).
3. Commit and push. The site updates in about a minute.

This also works from the GitHub website: open the folder, choose **Add file → Upload files**, then edit the data file with the pencil icon.

## Drawing blocks

Lessons draw App Inventor blocks with HTML. The colour classes are `var`, `ctrl`, `logic`, `math`, `text`, `evt`, `set` and `get`:

```html
<div class="blocks">
  <div class="blk var">set <span class="field">global score</span> to <span class="blk math">0</span></div>
</div>
```

You can also use a screenshot: save it in the lesson's folder and add `<img src="my-screenshot.png" alt="...">`.
