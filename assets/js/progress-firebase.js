/* ===== Progress sync: localStorage → Firestore =====
   Mirrors the course progress (which lives in localStorage under
   "ec_progress_v1") to Firestore, per signed-in user, at
   users/{uid}/progress/v1.

   - push(): every engine save is mirrored (debounced).
   - hydrate(): on sign-in, the remote copy is fetched and merged into
     localStorage (local values win on conflict). If that changed the local
     copy while a lesson page is open, the page reloads once to reflect it.
   - clearLesson(): used by the "Reset lesson" button so a reset also clears
     the remote copy.
   Works only with a configured Firebase project; everything degrades
   gracefully to local-only when it isn't. */
(function () {
  'use strict';

  var config = window.FIREBASE_CONFIG || {};
  var unconfigured = !config.apiKey || config.apiKey.indexOf('PLACEHOLDER') !== -1;

  var db = null, uid = null;
  try {
    if (window.firebase && window.firebase.firestore && firebase.apps.length) {
      db = firebase.firestore();
    }
  } catch (e) { db = null; }

  var LS_KEY = 'ec_progress_v1';
  var pushTimer = null;

  function readLS() {
    try { return JSON.parse(window.localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function writeLS(d) { window.localStorage.setItem(LS_KEY, JSON.stringify(d)); }

  function docRef() {
    if (!db || !uid) return null;
    return db.collection('users').doc(uid).collection('progress').doc('v1');
  }

  function push(data) {
    if (!db || !uid || unconfigured) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      var ref = docRef(); if (!ref) return;
      ref.set({ lessons: data.lessons || {} }, { merge: true }).catch(function () {});
    }, 700);
  }

  function mergeRemote(remote) {
    var rl = (remote && remote.lessons) || {};
    if (!Object.keys(rl).length) return false;
    var local = readLS();
    var ll = local.lessons || {};
    var changed = false;
    Object.keys(rl).forEach(function (k) {
      var r = rl[k] || {}, l = ll[k] || {};
      if (!ll[k]) {
        ll[k] = r; changed = true;
        return;
      }
      ['sections', 'scores', 'hw'].forEach(function (f) {
        r[f] = r[f] || {}; l[f] = l[f] || {};
        Object.keys(r[f]).forEach(function (kk) {
          if (!(kk in l[f])) { l[f][kk] = r[f][kk]; changed = true; }
        });
      });
      if (typeof l.writing !== 'string' && typeof r.writing === 'string') {
        l.writing = r.writing; changed = true;
      }
    });
    if (changed) {
      local.lessons = ll;
      writeLS(local);
    }
    return changed;
  }

  function hydrate() {
    if (!db || !uid || unconfigured) return Promise.resolve(false);
    var ref = docRef(); if (!ref) return Promise.resolve(false);
    return ref.get().then(function (snap) {
      if (!snap.exists) return false;
      var changed = mergeRemote(snap.data());
      if (changed) {
        window.dispatchEvent(new CustomEvent('ec:remote'));
        if (/\/lessons\//.test(location.pathname)) {
          try {
            var sk = 'ec_hydrated_' + location.pathname.split('/').pop();
            if (!sessionStorage.getItem(sk)) {
              sessionStorage.setItem(sk, '1');
              location.reload();
            }
          } catch (e) {}
        }
      }
      return changed;
    }).catch(function () { return false; });
  }

  function clearLesson(key) {
    if (!db || !uid || unconfigured) return Promise.resolve();
    var ref = docRef(); if (!ref) return Promise.resolve();
    return ref.get().then(function (snap) {
      if (!snap.exists) return;
      var data = snap.data();
      delete data.lessons[key];
      ref.set(data, { merge: true }).catch(function () {});
    }).catch(function () {});
  }

  window.PG = { push: push, hydrate: hydrate, clearLesson: clearLesson };

  if (window.firebase && firebase.auth && firebase.apps.length && firebase.apps[0].options.apiKey) {
    firebase.auth().onAuthStateChanged(function (u) {
      uid = u ? u.uid : null;
      if (uid) hydrate();
    });
  }
})();
