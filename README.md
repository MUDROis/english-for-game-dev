# English for Game Dev — lesson platform (GitHub Pages)

Static site for a year-long English course (B1→B2) for a game-dev team lead:
12 modules · 48 lessons · each lesson is a standalone HTML page with interactive
exercises, audio, video and illustrations.

**Ready to study: Modules 1–3 (lessons 1–12)**
- `lessons/m01-01.html` — Sprints, Builds and Right Now (Present Simple vs Present Continuous)
- `lessons/m01-02.html` — State Verbs and the Rhythm of a Team (state verbs + frequency adverbs)
- `lessons/m01-03.html` — A Startup, the Studio, Zero Doubts (articles)
- `lessons/m01-04.html` — Cats, Reviews and Consolidation (+ Module Test 1)
- `lessons/m02-01.html` — What Makes a Superhero — and What Happened Last Sprint (Past Simple vs Continuous)
- `lessons/m02-02.html` — By the Time We Shipped… Past Perfect (+ Continuous)
- `lessons/m02-03.html` — Gaming Can Make a Better World (narrative tenses together)
- `lessons/m02-04.html` — Retrospective Masterclass (+ Module Test 2)
- `lessons/m03-01.html` — I Have Launched, We Shipped in 2023 (Present Perfect vs Past Simple)
- `lessons/m03-02.html` — How Long Have You Been Testing? (Present Perfect Continuous)
- `lessons/m03-03.html` — Just, Yet, Still — and the Slopes (just/already/yet/still + for/since)
- `lessons/m03-04.html` — Speaking Challenge: My Journey (+ Module Test 3)

Every lesson follows the yearly plan: Warm-up → Listening → Reading → Grammar →
Grammar→Speaking → Writing → Homework. All interface text is in English; Russian
remains only in the new-vocabulary glosses (comprehension check) and in the
Russian source sentences of the sentence-builder exercise.

## Structure

```
english-course-site/
├── index.html              # course map (12 modules, 48 lessons) + resource library
├── LESSONS-GUIDE.md        # how to create new lessons (structure, engine API, audio pipeline)
├── .nojekyll               # disables Jekyll processing on GitHub Pages
├── lessons/
│   ├── m01-01.html … m01-04.html   # Module 1 — fully ready
│   ├── m02-01.html … m02-04.html   # Module 2 — fully ready
│   ├── m03-01.html … m03-04.html   # Module 3 — fully ready
│   └── _template.html      # template for the next lessons
├── assets/
│   ├── css/style.css       # platform styling (dark theme, orange/blue accents)
│   ├── js/engine.js        # engine: exercises, progress, voice recorder
│   ├── img/                # illustrations (generated for the course)
│   └── audio/              # lesson audio (TTS voice "xiaochen", lively professional read, ~1.05× pace)
```

Interactive exercises (no backend, work on GitHub Pages): multiple choice,
true/false, gap-fill, sentence builder, marker sorting, flip cards, writing with
a word counter, in-browser voice recorder, homework checklist, module test with
an automatic score summary. Progress is saved in the browser (localStorage).

## Course authorization (Firebase)

Lesson pages require a signed-in account; the main page stays open to guests.
Auth is implemented with the Firebase JS SDK (compat, loaded from CDN) using
email/password sign-in:

- `assets/js/firebase-config.js` — **fill in your real Firebase web-app config**
  (Firebase console → Project settings → General → Your apps → SDK setup and
  configuration, then commit & push).
- `assets/js/auth.js` — shared auth logic: guards lesson pages, sign-in card,
  topbar sign-in/sign-out chip.
- Accounts are created by you in the Firebase console (Authentication → Users →
  Add user); the site itself only signs people in.
- Enable the Email/Password provider in Firebase console → Authentication →
  Sign-in method. The site must be served over HTTPS (Firebase refuses plain
  HTTP) — GitHub Pages with the custom domain should have HTTPS enforced.

## Deploy to GitHub Pages (5 minutes)

**Option A — via the web interface (no git):**
1. Create a repository, e.g. `english-course`.
2. Click *Add file → Upload files* and upload **everything inside** the
   `english-course-site` folder (including the `assets/` and `lessons/` folders
   and the hidden `.nojekyll` file — drag-and-drop uploads it together with the rest).
3. *Settings → Pages → Source: Deploy from a branch → Branch: main / root → Save*.
4. In 1–2 minutes the site will be live at `https://<username>.github.io/english-course/`.

**Option B — via git:**
```bash
cd english-course-site
git init && git add -A && git commit -m "Course platform + Modules 1-3"
git branch -M main
git remote add origin https://github.com/<username>/english-course.git
git push -u origin main
# then Settings → Pages → main / root
```

Local preview without deploy: run `python3 -m http.server 8000` in the site
folder and open `http://localhost:8000`.
