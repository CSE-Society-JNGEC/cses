/**
 * intentRules.js - predefined intent recognition
 * ---------------------------------------------------------------------------
 * Each intent lists the concepts (see synonyms.js) that signal it and a weight.
 * The intent with the highest total wins. Add an intent by adding an entry here
 * and a handler of the same id in assistantEngine.js.
 *
 *   id               destination
 *   -----------------------------------------------------------------------
 *   technical_events Events -> technical event records
 *   cultural_events  Events -> cultural event records
 *   sports_events    Events -> sports event records
 *   academic_events  Events -> guest lectures / academic records
 *   events_general   Events -> any event
 *   previous_papers  Student Zone -> MST / End-Sem papers
 *   study_materials  Student Zone -> notes and study material
 *   society_info     About page (team, council, departments)
 *   opportunities    New roles / opportunities
 *   contact          Contact section
 *   gallery          Photo gallery
 *   announcements    Latest announcements
 */
export const INTENTS = [
    { id: 'previous_papers', label: 'Previous year papers', weights: { pyq: 4, mst: 3.2, endsem: 3.2 } },
    { id: 'study_materials', label: 'Study materials', weights: { notes: 4 } },
    { id: 'technical_events', label: 'Technical events', weights: { technical: 3, coding: 1, workshop: 2.2 } },
    { id: 'cultural_events', label: 'Cultural events', weights: { cultural: 4 } },
    { id: 'sports_events', label: 'Sports events', weights: { sports: 4 } },
    { id: 'academic_events', label: 'Guest lectures', weights: { academic: 3.5 } },
    { id: 'events_general', label: 'Events', weights: { event: 2.5, competition: 2 } },
    { id: 'society_info', label: 'About the society', weights: { about: 3.5 } },
    { id: 'opportunities', label: 'Opportunities', weights: { opportunity: 4 } },
    { id: 'contact', label: 'Contact', weights: { contact: 4 } },
    { id: 'gallery', label: 'Gallery', weights: { gallery: 4 } },
    { id: 'announcements', label: 'Announcements', weights: { announcement: 4 } },
];

const MIN_INTENT_SCORE = 2;

/**
 * @returns {{id: string, score: number}|null}  null => no clear intent (fall back to general search)
 */
export function detectIntent(q) {
    // conversational one-liners
    const strongOther = [...q.concepts.keys()].some((c) => !['greeting', 'thanks', 'help', 'yes', 'more'].includes(c));
    if (!strongOther && q.allTokens.length <= 6) {
        if (q.concepts.has('greeting')) return { id: 'greeting', score: 5 };
        if (q.concepts.has('thanks')) return { id: 'thanks', score: 5 };
        if (q.concepts.has('help')) return { id: 'help', score: 5 };
    }

    let best = null;
    for (const intent of INTENTS) {
        let score = 0;
        for (const [concept, w] of Object.entries(intent.weights)) {
            if (q.concepts.has(concept)) score += w * q.concepts.get(concept);
        }
        // a paper word next to a semester / subject strengthens the papers intent
        if (intent.id === 'previous_papers' && q.concepts.has('paper') && (q.entities.semester || q.entities.subjects.length)) score += 2;
        if (score > 0 && (!best || score > best.score)) best = { id: intent.id, score };
    }
    return best && best.score >= MIN_INTENT_SCORE ? best : null;
}
