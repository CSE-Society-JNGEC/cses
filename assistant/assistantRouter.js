/**
 * assistantRouter.js - turns a "target" into a real link and navigates.
 * Targets (plain objects, so results stay serialisable):
 *   { type:'event', key }
 *   { type:'papers', sem, subject, kind }        -> Student Zone search, auto-run
 *   { type:'paper', url, title }                 -> opens that exact file in Student Zone
 *   { type:'page', page, hash }
 *   { type:'external', href }
 * Links are real <a href>s (middle-click / open in new tab work).
 */
export function createRouter(root) {
    const abs = (rel) => new URL(rel, root).href;

    function hrefFor(t) {
        switch (t.type) {
            case 'event': return abs('events.html') + '?event=' + encodeURIComponent(t.key);
            case 'papers': {
                const p = new URLSearchParams();
                if (t.sem) p.set('sem', t.sem);
                if (t.subject) p.set('subject', t.subject);
                if (t.kind) p.set('type', t.kind);
                p.set('run', '1');
                return abs('studentzone.html') + '?' + p.toString();
            }
            case 'paper': {
                const p = new URLSearchParams({ open: t.url });
                if (t.title) p.set('title', t.title);
                return abs('studentzone.html') + '?' + p.toString();
            }
            case 'page': return abs(t.page) + (t.hash ? '#' + t.hash : '');
            default: return t.href;
        }
    }

    /** Handle without a reload when we are already on the right page. @returns {boolean} handled */
    function handleInPage(t) {
        const here = location.pathname.replace(/\/$/, '/index.html');
        if (t.type === 'event' && /events\.html$/.test(here) && window.CSES && window.CSES.openEvent) {
            return window.CSES.openEvent(t.key);
        }
        if (t.type === 'page' && t.hash) {
            const target = new URL(abs(t.page), location.href).pathname.replace(/\/$/, '/index.html');
            if (target === here) {
                const el = document.getElementById(t.hash);
                if (el) {
                    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
                    history.replaceState(null, '', '#' + t.hash);
                    return true;
                }
            }
        }
        return false;
    }
    return { hrefFor, handleInPage };
}
