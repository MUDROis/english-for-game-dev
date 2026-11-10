/* ===== Course auth (Firebase, email/password) =====
   - Main page: guests can browse freely; the topbar chip opens the sign-in card.
   - Lesson pages: the sign-in card blocks the lesson until a user is signed in.
   Accounts are created by the course admin in the Firebase console
   (Authentication → Users → Add user); the site only signs people in. */
(function () {
  'use strict';

  var config = {};
  var unconfigured = true;
  var auth = null, user = null;
  var initError = null;

  /* ensure FIREBASE_CONFIG is defined; if the static include failed to apply
     (stale/mixed cache), load it dynamically and then initialize. */
  function ensureConfig(cb) {
    if (window.FIREBASE_CONFIG) { cb(); return; }
    var s = document.createElement('script');
    s.src = (isLesson ? '../assets/js/firebase-config.js?v=8' : 'assets/js/firebase-config.js?v=8');
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  function initAuth() {
    config = window.FIREBASE_CONFIG || {};
    unconfigured = !config.apiKey || config.apiKey.indexOf('PLACEHOLDER') !== -1;
    try {
      if (window.firebase) {
        if (!firebase.apps.length) {
          // never initialize an app without a real apiKey — that state breaks
          // the SDK's Auth service later ("auth/invalid-api-key" on firebase.auth())
          if (config.apiKey) firebase.initializeApp(config);
        } else if (!firebase.apps[0].options.apiKey) {
          initError = 'auth/invalid-api-key (app was initialized without an apiKey — hard-refresh the page / clear site data)';
        }
        if (firebase.apps.length && firebase.apps[0].options.apiKey) auth = firebase.auth();
      }
    } catch (e) {
      auth = null;
      initError = (e && e.code) || (e && e.message) || String(e);
    }
    pendingErr = initError || '';
    if (auth) {
      var pid = '';
      try { pid = firebase.apps[0].options.projectId || ''; } catch (e) {}
      setDiag('Firebase OK · ' + (pid || 'app loaded') + (unconfigured ? ' · CONFIG PLACEHOLDER' : ''));
      auth.onAuthStateChanged(function (u) {
        user = u;
        setChip(!!u);
        if (isLesson) {
          if (u) hide(); else show();
        }
      });
    } else {
      setChip(false);
      if (!window.firebase) {
        setDiag('Firebase SDK did not load — check network / allow gstatic.com in ad-blockers');
      } else {
        setDiag((initError || 'not configured') + (unconfigured ? ' · fill apiKey in firebase-config.js' : ''));
      }
      if (isLesson) show();
    }
  }

  var isLesson = /\/lessons\//.test(location.pathname);
  var chip = document.getElementById('authChip');

  if (!window.firebase) {
    setDiag('Firebase SDK did not load — check network / allow gstatic.com in ad-blockers');
  }

  /* capture any unhandled Firebase error (e.g. during SDK init) and show it on the card */
  var pendingErr = initError || '';
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    var msg = (r && r.code) ? r.code : ((r && r.message) || String(r));
    if (msg && /firebase|auth|api.key/i.test(msg)) {
      pendingErr = msg;
      var el = document.getElementById('authErr');
      if (el) { el.textContent = 'Firebase error: ' + msg; el.style.display = 'block'; }
    }
  });

  function setDiag(msg) {
    var el = document.getElementById('authDiag');
    if (el) el.textContent = msg;
  }

  var ERR_MSGS = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong password.',
    'auth/user-not-found': 'No account with this email.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in your Firebase console (Authentication → Sign-in method).',
    'auth/invalid-email': 'That email looks invalid.',
    'auth/too-many-requests': 'Too many attempts — wait a minute and try again.',
    'auth/invalid-api-key': 'The Firebase API key is invalid. Open assets/js/firebase-config.js and check it holds the apiKey of THIS project (english-for-game-dev), and that the key is not restricted in Google Cloud Console.',
    'auth/network-request-failed': 'Network error — check your connection.'
  };

  function buildCard() {
    var d = document.createElement('div');
    d.id = 'authGuard';
    d.className = 'auth-guard';
    d.hidden = true;
    d.innerHTML =
      '<div class="auth-card">' +
      '  <div class="auth-eyebrow">🔒 Course access</div>' +
      '  <h3>' + (isLesson ? 'Sign in to study' : 'Sign in') + '</h3>' +
      '  <p class="auth-sub">' + (isLesson ? 'Lesson pages require a signed-in course account.' : 'Sign in to open course lessons.') + '</p>' +
      '  <form id="authForm">' +
      '    <label class="auth-field">Email<input type="email" id="authEmail" autocomplete="email" spellcheck="false"></label>' +
      '    <label class="auth-field">Password<input type="password" id="authPass" autocomplete="current-password"></label>' +
      '    <button class="btn primary w100" id="authSubmit" type="submit">Sign in</button>' +
      '  </form>' +
      '  <p class="auth-err" id="authErr"></p>' +
      '  <p class="auth-diag" id="authDiag"></p>' +
      '  <p class="auth-hint">Your progress stays in this browser. No account? Ask the course admin.</p>' +
      '  <a class="auth-back" href="' + (isLesson ? '../index.html' : 'index.html') + '">← Back to course map</a>' +
      '</div>';
    document.body.appendChild(d);

    var emailEl = d.querySelector('#authEmail');
    var passEl = d.querySelector('#authPass');
    var errEl = d.querySelector('#authErr');
    var submitBtn = d.querySelector('#authSubmit');
    var form = d.querySelector('#authForm');

    function showErr(msg) {
      errEl.textContent = msg || '';
      errEl.style.display = msg ? 'block' : 'none';
    }
    if (unconfigured) showErr('Firebase is not configured yet — add your apiKey in assets/js/firebase-config.js.');
    else showErr('');

    function trySignIn() {
      var email = emailEl.value.trim();
      var pass = passEl.value;
      showErr('');
      if (!email || !pass) { showErr('Enter both email and password.'); return; }
      if (unconfigured) return;
      if (!auth) { showErr('Auth is unavailable right now.'); return; }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in…';
      auth.signInWithEmailAndPassword(email, pass)
        .catch(function (e) {
          showErr(ERR_MSGS[e.code] || e.message || 'Sign-in failed.');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign in';
        });
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); trySignIn(); });
    d.addEventListener('click', function (e) { if (e.target === d) hide(); });
  }

  function overlay() {
    var d = document.getElementById('authGuard');
    if (!d) { buildCard(); d = document.getElementById('authGuard'); }
    return d;
  }
  function show() {
    var d = overlay();
    d.hidden = false;
    d.querySelector('#authEmail').focus();
    if (pendingErr) {
      var el = d.querySelector('#authErr');
      el.textContent = 'Firebase error: ' + pendingErr;
      el.style.display = 'block';
    }
  }
  function hide() {
    var d = document.getElementById('authGuard');
    if (d) d.hidden = true;
  }

  function setChip(signedIn) {
    if (!chip) return;
    chip.textContent = signedIn ? 'Sign out' : 'Sign in';
    chip.classList.toggle('on', !!signedIn);
  }

  if (chip) chip.addEventListener('click', function () {
    if (user) { auth && auth.signOut().catch(function () {}); }
    else show();
  });

  ensureConfig(initAuth);
})();
