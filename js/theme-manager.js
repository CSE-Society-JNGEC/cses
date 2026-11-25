/**
 * CSES Theme Manager
 * ---------------------------------------------------------------------------
 * Automatically rotates the site between three light themes. No manual switch.
 *
 *   - Themes are plain CSS-variable sets in style.css  (:root[data-theme="..."]).
 *   - This script only sets <html data-theme="..."> - layout never changes.
 *   - Each theme stays on screen for 12-20s (see DURATIONS); the crossfade itself
 *     is handled in CSS (--theme-fade).
 *   - Rotation follows the wall clock and is remembered per browser tab
 *     (sessionStorage), so moving between pages continues the cycle instead of
 *     restarting it.
 *   - prefers-reduced-motion: the first theme is shown and nothing rotates.
 *
 * Load this in <head> (it is tiny) so the correct theme is set before first paint.
 *
 * API:  window.CSESTheme.current()  ->  'coffee' | 'sky' | 'peach'
 *       document.addEventListener('cses:themechange', e => e.detail.theme)
 */
(function () {
    'use strict';

    var THEMES = [
        { id: 'coffee', ms: 17000, color: '#f8efe0' }, // Coffee & Cream
        { id: 'sky',    ms: 15000, color: '#e3f3fa' }, // Sky & Ocean
        { id: 'peach',  ms: 16000, color: '#ffeadb' }  // Peach & Champagne
    ];
    var KEY = 'cses.theme.v1';
    var root = document.documentElement;
    var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var timer = null;
    var currentId = null;

    function read() {
        try {
            var raw = sessionStorage.getItem(KEY);
            if (!raw) return null;
            var v = JSON.parse(raw);
            return (typeof v.t === 'number' && typeof v.i === 'number') ? v : null;
        } catch (e) { return null; }
    }
    function write(state) {
        try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: fine */ }
    }

    // Work out which theme should be showing "now" and how long it has left.
    function locate(state, now) {
        var i = state.i % THEMES.length;
        var elapsed = now - state.t;
        var guard = 0;
        while (elapsed >= THEMES[i].ms && guard++ < 1000) {
            elapsed -= THEMES[i].ms;
            i = (i + 1) % THEMES.length;
        }
        // Re-anchor so the stored state always describes the theme currently shown
        return { i: i, t: now - elapsed, remaining: THEMES[i].ms - elapsed };
    }

    function apply(index) {
        var theme = THEMES[index];
        if (theme.id === currentId) return;
        currentId = theme.id;
        root.setAttribute('data-theme', theme.id);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme.color);
        try {
            document.dispatchEvent(new CustomEvent('cses:themechange', { detail: { theme: theme.id } }));
        } catch (e) { /* old browsers */ }
    }

    function stop() { if (timer) { clearTimeout(timer); timer = null; } }

    function tick() {
        stop();
        var state = read() || { i: 0, t: Date.now() };
        var loc = locate(state, Date.now());
        write({ i: loc.i, t: loc.t });
        apply(loc.i);
        timer = setTimeout(tick, Math.max(500, loc.remaining));
    }

    function start() {
        if (reduceQuery && reduceQuery.matches) {
            stop();
            apply(0);
            return;
        }
        tick();
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
    });
    if (reduceQuery) {
        var onPref = function () { start(); };
        if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onPref);
        else if (reduceQuery.addListener) reduceQuery.addListener(onPref);
    }

    window.CSESTheme = {
        themes: THEMES.map(function (t) { return t.id; }),
        current: function () { return currentId; }
    };

    start();
})();
