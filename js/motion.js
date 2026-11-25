/**
 * CSES Motion Engine
 * ---------------------------------------------------------------------------
 * Lightweight, dependency-free scroll + entrance motion. Never hijacks scrolling.
 *
 *   - scroll progress bar + "is-scrolled" nav state
 *   - scroll-triggered reveals (staggered, once)
 *   - parallax for any element with  data-parallax="0.12"  (uses the independent
 *     `translate` property so it composes with CSS animations)
 *   - word-by-word headline reveal
 *   - section rail (active-section indicator) for elements with  data-spy="Label"
 *   - soft fade between pages
 * Everything is skipped under prefers-reduced-motion.
 */
(function () {
    'use strict';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------- word-by-word headline reveal ---------- */
    function splitWords(el, base) {
        if (!el || el.classList.contains('split-words')) return;
        var label = el.textContent.replace(/\s+/g, ' ').trim();
        var n = 0;
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    var parts = child.textContent.split(/(\s+)/);
                    var frag = document.createDocumentFragment();
                    parts.forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        var w = document.createElement('span');
                        w.className = 'word';
                        w.setAttribute('aria-hidden', 'true');
                        var inner = document.createElement('i');
                        inner.textContent = part;
                        inner.style.setProperty('--i', n++);
                        w.appendChild(inner);
                        frag.appendChild(w);
                    });
                    node.replaceChild(frag, child);
                } else if (child.nodeType === 1) {
                    walk(child);
                }
            });
        })(el);
        el.setAttribute('aria-label', label);
        el.style.setProperty('--base', base + 'ms');
        el.classList.add('split-words');
    }

    /* ---------- scroll reveals ---------- */
    var REVEAL_SELECTOR = [
        '.section-tag', '.section-title', '.section-sub',
        '.feature-card', '.notif-card', '.event-card.interactive', '.faculty-card', '.benefit-card',
        '.lead-card', '.team-card', '.council-card', '.dept-title', '.dept-desc',
        '.gallery-tile', '.gallery-filters', '.cta-banner', '.opp-card', '.opp-empty',
        '.search-panel', '.suggestion-panel', '.contact-card', '.about-structure-placeholder', '.about-intro-copy',
        '.footer-top > *'
    ].join(',');

    function initReveals() {
        var targets = $$(REVEAL_SELECTOR);
        if (!targets.length) return;
        if (reduce || !('IntersectionObserver' in window)) return;

        var groups = new Map();
        targets.forEach(function (el) {
            if (el.classList.contains('reveal-up')) return;
            var parent = el.parentNode;
            var idx = groups.get(parent) || 0;
            groups.set(parent, idx + 1);
            el.classList.add('reveal-up');
            el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms, ' + Math.min(idx, 6) * 70 + 'ms, 0ms, 0ms';
        });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                el.classList.add('in-view');
                io.unobserve(el);
                // drop the stagger delay once revealed so hover feels instant
                setTimeout(function () { el.style.transitionDelay = ''; }, 1400);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        $$('.reveal-up').forEach(function (el) { io.observe(el); });
    }

    /* ---------- scroll-linked: progress, nav state, parallax ---------- */
    function initScrollLinked() {
        var nav = document.querySelector('nav');
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);

        var layers = reduce ? [] : $$('[data-parallax]').map(function (el) {
            return { el: el, speed: parseFloat(el.getAttribute('data-parallax')) || 0, fixed: !!el.closest('.bg-decor'), visible: true };
        });
        var viewIO = null;
        if (layers.length && 'IntersectionObserver' in window) {
            viewIO = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    layers.forEach(function (l) { if (l.el === e.target) l.visible = e.isIntersecting; });
                });
            }, { rootMargin: '20% 0px' });
            layers.forEach(function (l) { if (!l.fixed) viewIO.observe(l.el); });
        }

        var ticking = false;
        function update() {
            ticking = false;
            var y = window.pageYOffset || document.documentElement.scrollTop || 0;
            var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            bar.style.transform = 'scaleX(' + Math.min(1, y / max).toFixed(4) + ')';
            if (nav) nav.classList.toggle('is-scrolled', y > 12);
            for (var i = 0; i < layers.length; i++) {
                var l = layers[i];
                if (!l.visible) continue;
                l.el.style.translate = '0 ' + (-y * l.speed).toFixed(1) + 'px';
            }
        }
        function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        update();
    }

    /* ---------- section rail (active navigation indicator) ---------- */
    function initSectionRail() {
        var spots = $$('[data-spy][id]');
        if (spots.length < 3) return;
        var rail = document.createElement('div');
        rail.className = 'section-rail';
        rail.setAttribute('role', 'navigation');
        rail.setAttribute('aria-label', 'Page sections');
        var links = spots.map(function (s) {
            var a = document.createElement('a');
            a.href = '#' + s.id;
            var label = document.createElement('span');
            label.textContent = s.getAttribute('data-spy');
            a.appendChild(label);
            a.setAttribute('aria-label', 'Jump to ' + s.getAttribute('data-spy'));
            rail.appendChild(a);
            return a;
        });
        document.body.appendChild(rail);
        if (!('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var i = spots.indexOf(e.target);
                links.forEach(function (a, k) { a.classList.toggle('is-active', k === i); });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        spots.forEach(function (s) { io.observe(s); });
    }

    /* ---------- soft fade between pages ---------- */
    function initPageTransitions() {
        if (reduce) return;
        document.addEventListener('click', function (e) {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
            var url;
            try { url = new URL(a.href, location.href); } catch (err) { return; }
            if (url.origin !== location.origin) return;
            if (!/\.html?$|\/$/.test(url.pathname)) return;
            if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash jump
            e.preventDefault();
            if (window.CSES_AUDIO) {
                window.CSES_AUDIO.play('pageTransition');
            }
            document.documentElement.classList.add('is-leaving');
            setTimeout(function () { location.href = url.href; }, 240);
        });
        window.addEventListener('pageshow', function () { document.documentElement.classList.remove('is-leaving'); });
    }

    function init() {
        var hero = document.querySelector('.hero h1, .page-hero h1');
        if (hero && !reduce) {
            var hasSplash = document.documentElement.classList.contains('has-splash');
            splitWords(hero, hasSplash ? 1300 : 150);
        }
        initReveals();
        initScrollLinked();
        initSectionRail();
        initPageTransitions();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
