/**
 * conversationContext.js - lightweight follow-up memory for the current chat.
 * Kept in sessionStorage so the chat survives moving between pages of the site
 * (and disappears when the tab closes).
 */
const KEY = 'cses.assistant.v1';

export function createContext() {
    let state = { messages: [], last: null, pending: null };
    try {
        const raw = sessionStorage.getItem(KEY);
        if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) { /* storage unavailable: chat just won't persist */ }

    function save() {
        try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }
    return {
        get messages() { return state.messages; },
        /** last answered request: { intentId, entities, concepts } */
        get last() { return state.last; },
        /** what the assistant just asked: { type: 'semester'|'facet', intentId, ... } */
        get pending() { return state.pending; },
        setLast(v) { state.last = v; save(); },
        setPending(v) { state.pending = v; save(); },
        pushMessage(m) { state.messages.push(m); if (state.messages.length > 40) state.messages.shift(); save(); },
        reset() { state = { messages: [], last: null, pending: null }; save(); },
    };
}
