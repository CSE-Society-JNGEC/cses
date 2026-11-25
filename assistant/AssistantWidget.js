/**
 * AssistantWidget.js - floating launcher + compact chat window.
 * Pure UI: asks the engine, renders the reply, routes clicks through the router.
 * All content is inserted with textContent (never innerHTML) so site data cannot inject markup.
 */
import { MascotController } from './MascotController.js';
import { MASCOT, TEXT, SUGGESTIONS } from './assistantData.js';

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

export class AssistantWidget {
    constructor({ engine, router, context, root }) {
        Object.assign(this, { engine, router, context, root });
        this.busy = false;
        this.isOpen = false;
    }

    mount() {
        const wrap = this.wrap = el('div', 'cses-assistant');

        /* launcher */
        this.launcher = el('button', 'cses-assistant__launcher');
        this.launcher.type = 'button';
        this.launcher.setAttribute('aria-label', 'Open CSES assistant');
        this.launcher.setAttribute('aria-expanded', 'false');
        this.launcherMascot = new MascotController(MASCOT, this.root, 'launcher');
        this.nudge = el('span', 'cses-assistant__nudge', TEXT.nudge);
        this.launcher.append(this.launcherMascot.el, this.nudge);
        this.launcher.addEventListener('click', () => this.toggle());

        /* panel */
        const panel = this.panel = el('section', 'cses-assistant__panel');
        panel.id = 'csesAssistantPanel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', MASCOT.name);
        panel.hidden = true;
        this.launcher.setAttribute('aria-controls', panel.id);

        const head = el('header', 'cses-assistant__head');
        this.headMascot = new MascotController(MASCOT, this.root, 'avatar');
        const titles = el('div', 'cses-assistant__titles');
        titles.append(el('strong', '', MASCOT.name), el('span', '', 'Searches the real site content'));
        const close = el('button', 'cses-assistant__close', '×');
        close.type = 'button'; close.setAttribute('aria-label', 'Close assistant');
        close.addEventListener('click', () => this.close());
        head.append(this.headMascot.el, titles, close);

        this.log = el('div', 'cses-assistant__log');
        this.log.setAttribute('role', 'log'); this.log.setAttribute('aria-live', 'polite');

        this.chipRow = el('div', 'cses-assistant__chips');

        const form = this.form = el('form', 'cses-assistant__form');
        this.input = el('input', 'cses-assistant__input');
        this.input.type = 'text'; this.input.placeholder = TEXT.placeholder; this.input.autocomplete = 'off';
        this.input.setAttribute('aria-label', 'Ask the CSES assistant'); this.input.maxLength = 200;
        const send = el('button', 'cses-assistant__send', 'Send'); send.type = 'submit';
        form.append(this.input, send);
        form.addEventListener('submit', (e) => { e.preventDefault(); const v = this.input.value.trim(); if (v) { this.input.value = ''; this.ask(v); } });

        panel.append(head, this.log, this.chipRow, form);
        panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.close(); } });
        wrap.append(panel, this.launcher);
        document.body.appendChild(wrap);

        this.restore();
        setTimeout(() => { if (!this.isOpen) { this.launcherMascot.wave(); wrap.classList.add('is-nudging'); setTimeout(() => wrap.classList.remove('is-nudging'), 6500); } }, 2200);
    }

    /* ---------- open / close ---------- */
    toggle() { this.isOpen ? this.close() : this.open(); }
    open() {
        this.isOpen = true;
        this.panel.hidden = false;
        requestAnimationFrame(() => this.wrap.classList.add('is-open'));
        this.launcher.setAttribute('aria-expanded', 'true');
        this.launcher.setAttribute('aria-label', 'Close CSES assistant');
        this.wrap.classList.remove('is-nudging');
        this.headMascot.wave();
        this.scroll();
        setTimeout(() => this.input.focus({ preventScroll: true }), 120);
    }
    close() {
        this.isOpen = false;
        this.wrap.classList.remove('is-open');
        this.launcher.setAttribute('aria-expanded', 'false');
        this.launcher.setAttribute('aria-label', 'Open CSES assistant');
        setTimeout(() => { if (!this.isOpen) this.panel.hidden = true; }, 260);
        this.launcher.focus({ preventScroll: true });
    }

    /* ---------- conversation ---------- */
    restore() {
        const saved = this.context.messages;
        if (!saved.length) { this.addBot({ text: TEXT.welcome, items: [], actions: [], chips: SUGGESTIONS.map((s) => ({ label: s, query: s })) }, false); return; }
        saved.forEach((m) => (m.role === 'user' ? this.renderUser(m.text) : this.renderBot(m.reply)));
        const lastBot = [...saved].reverse().find((m) => m.role === 'bot');
        this.renderChips(lastBot ? lastBot.reply.chips : []);
    }

    async ask(text) {
        if (this.busy) return;
        this.busy = true;
        this.context.pushMessage({ role: 'user', text });
        this.renderUser(text);
        this.renderChips([]);
        const typing = this.renderTyping();
        const started = Date.now();
        let reply;
        try { reply = await this.engine.respond(text); }
        catch (err) {
            console.error('[CSES assistant]', err);
            reply = { text: 'Sorry, something went wrong while searching. Please try again, or use the site navigation.', items: [], actions: [], chips: [] };
        }
        const wait = Math.max(0, 420 - (Date.now() - started));
        await new Promise((r) => setTimeout(r, wait));
        typing.remove();
        this.addBot(reply, true);
        this.busy = false;
    }

    addBot(reply, persist) {
        if (persist) this.context.pushMessage({ role: 'bot', reply });
        this.renderBot(reply);
        this.renderChips(reply.chips);
        if (persist) this.headMascot.react();
    }

    renderUser(text) { const m = el('div', 'cses-msg cses-msg--user', text); this.log.appendChild(m); this.scroll(); }

    renderTyping() {
        const m = el('div', 'cses-msg cses-msg--bot cses-msg--typing');
        m.setAttribute('aria-label', TEXT.thinking);
        m.append(el('i'), el('i'), el('i'));
        this.log.appendChild(m); this.scroll();
        return m;
    }

    renderBot(reply) {
        const m = el('div', 'cses-msg cses-msg--bot');
        m.appendChild(el('p', 'cses-msg__text', reply.text));
        if (reply.items && reply.items.length) {
            const list = el('ul', 'cses-results');
            reply.items.forEach((it) => {
                const li = el('li', 'cses-result');
                li.appendChild(el('strong', 'cses-result__title', it.title));
                if (it.meta) li.appendChild(el('span', 'cses-result__meta', it.meta));
                if (it.snippet) li.appendChild(el('span', 'cses-result__snippet', it.snippet));
                if (it.actions && it.actions.length) {
                    const row = el('div', 'cses-result__actions');
                    it.actions.forEach((a) => row.appendChild(this.link(a, 'cses-btn cses-btn--small')));
                    li.appendChild(row);
                }
                list.appendChild(li);
            });
            m.appendChild(list);
        }
        if (reply.followUp) m.appendChild(el('p', 'cses-msg__follow', reply.followUp));
        if (reply.actions && reply.actions.length) {
            const row = el('div', 'cses-actions');
            reply.actions.forEach((a) => row.appendChild(this.link(a, 'cses-btn cses-btn--ghost')));
            m.appendChild(row);
        }
        this.log.appendChild(m);
        this.scroll(m);
    }

    link(action, cls) {
        const t = action.target;
        const a = el('a', cls, action.label);
        a.href = this.router.hrefFor(t);
        if (t.type === 'external') { if (!/^mailto:/.test(t.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } }
        else a.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
            if (this.router.handleInPage(t)) { e.preventDefault(); if (matchMedia('(max-width: 640px)').matches) this.close(); else this.panel.classList.add('is-peek'); }
        });
        return a;
    }

    renderChips(chips) {
        this.chipRow.replaceChildren();
        (chips || []).forEach((c) => {
            const b = el('button', 'cses-chip', c.label); b.type = 'button';
            b.addEventListener('click', () => this.ask(c.query));
            this.chipRow.appendChild(b);
        });
        this.chipRow.hidden = !(chips && chips.length);
    }

    scroll(toMsg) {
        requestAnimationFrame(() => {
            if (toMsg && toMsg.offsetHeight > this.log.clientHeight) this.log.scrollTop = toMsg.offsetTop - 8;
            else this.log.scrollTop = this.log.scrollHeight;
        });
    }
}
