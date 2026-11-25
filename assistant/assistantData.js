/**
 * assistantData.js - configuration only (no event / paper / people data lives here).
 * Real content is read from the site itself by contentSources.js.
 */

/** Mascot. To change the character: replace the image file (or point `src` elsewhere).
 *  `eyes` is optional - positions (in % of the image) used for a gentle blink overlay.
 *  Remove `eyes` (or set it to null) for a character that should not blink. */
export const MASCOT = {
    name: 'CSES Assistant',
    src: 'assets/mascot/cses-bot.webp',
    alt: 'CSES assistant robot waving hello',
    width: 506,
    height: 640,
    lidColor: '#13172f',
    eyes: [
        { x: 32.4, y: 30.2, w: 15.5, h: 13.5 },
        { x: 62.4, y: 34.3, w: 15.5, h: 13.5 },
    ],
};

export const TEXT = {
    welcome: "Hi! I'm the CSES assistant. I can search the society's events, previous year papers, notes, team and contact details for you.",
    nudge: 'Need help? Ask me!',
    placeholder: 'Ask about events, papers…',
    thinking: 'Searching the site…',
};

/** Starter chips shown when the chat opens. */
export const SUGGESTIONS = [
    'Latest coding competition',
    'Previous year papers',
    'Notes for a subject',
    'Cultural events',
    'Who is on the council?',
    'Contact the team',
];

/** Section navigation used for "related" links and no-result help. */
export const PAGES = {
    events: { label: 'Events', page: 'events.html' },
    studentzone: { label: 'Student Zone', page: 'studentzone.html' },
    about: { label: 'About', page: 'about.html' },
    contact: { label: 'Contact', page: 'contact.html' },
    gallery: { label: 'Gallery', page: 'index.html', hash: 'gallery' },
    opportunities: { label: 'Opportunities', page: 'index.html', hash: 'opportunities' },
    announcements: { label: 'Announcements', page: 'index.html', hash: 'announcements' },
};

/** Facet chips for follow-up questions (shown when a query is broad). */
export const FACETS = {
    technical_events: [
        { label: 'Coding competitions', query: 'coding competitions' },
        { label: 'Workshops', query: 'workshops' },
        { label: 'Show all technical events', query: 'show all' },
    ],
};

export const LIMITS = { default: 4, all: 12 };
