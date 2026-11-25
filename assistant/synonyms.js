/**
 * synonyms.js - reusable synonym / concept mapping
 * ---------------------------------------------------------------------------
 * Different ways of saying the same thing map to ONE concept, e.g.
 *   "previous year papers", "old papers", "semester question papers", "PYQ"  ->  pyq
 *   "coding competition", "programming contest", "hackathon"                 ->  coding + competition
 *
 * Add a word or phrase to a concept's `terms` and every intent that uses the
 * concept understands it. English, romanised Hindi ("purane paper", "pichle saal")
 * and a few Devanagari words are included.
 *
 * `specific` terms are narrow topics (hackathon, cricket, quiz ...). If a visitor
 * asks for one and nothing on the site literally mentions it, the assistant says so
 * honestly instead of pretending the closest match is exactly what they asked for.
 */

/** Words that carry no search meaning (English + common Hinglish). */
export const STOPWORDS = new Set((
    'a an the of for to in on at by with from and or is are was were be been am do does did can could would should will ' +
    'may might please plz pls me my mine i we us our you your it its this that these those there here what which who whom ' +
    'how when where why show tell give find search look looking want need get let lets know about any some all more also ' +
    'just like kindly want wanna gimme ' +
    'hai hain ho hoga ka ki ke ko se me mein mai main par pe aur ya kya kaise kab kahan kaun kyun kyu mujhe muje mereko ' +
    'mera meri mere hume humein hamara tum aap tumhara apna wala wali wale liye lie bhi hi toh to dikhao dikha dikhaiye ' +
    'batao bata batado bataiye chahiye chahie chaiye chahta chahti dena dedo dijiye milega milegi mil sakta sakti sakte ' +
    'karo kar karna zara ek'
).split(/\s+/));

/**
 * concept -> { terms: [...], specific: [...] }
 * Terms may be several words. Matching is done on stemmed, lower-cased tokens
 * (so "papers" and "paper" are the same) with light typo tolerance.
 */
export const CONCEPTS = {
    // ---- event families ----
    technical: {
        terms: ['technical', 'tech', 'technology', 'coding', 'code', 'coder', 'programming', 'programmer', 'program', 'developer',
            'development', 'software', 'hackathon', 'hack', 'algorithm', 'algo', 'web development', 'webdev', 'web dev',
            'competitive programming', 'cp', 'prompt', 'prompt engineering', 'technical event', 'tech event'],
        specific: ['hackathon', 'webdev', 'web development', 'web dev', 'prompt', 'prompt engineering', 'algorithm', 'algo'],
    },
    coding: {
        terms: ['coding', 'code', 'coder', 'programming', 'programmer', 'competitive programming', 'cp', 'hackathon', 'hack', 'algorithm',
            'algo', 'leetcode', 'codeforces', 'web development', 'webdev', 'web dev', 'prompt', 'prompt engineering'],
        specific: [],
    },
    competition: {
        terms: ['competition', 'contest', 'challenge', 'tournament', 'battle', 'compete', 'competitive', 'championship', 'hackathon',
            'quiz', 'match', 'face off', 'prize', 'winner', 'winners'],
        specific: ['hackathon', 'quiz'],
    },
    workshop: {
        terms: ['workshop', 'session', 'training', 'hands on', 'hands-on', 'bootcamp', 'tutorial', 'masterclass', 'seminar', 'learning session'],
        specific: [],
    },
    cultural: {
        terms: ['cultural', 'culture', 'dance', 'dancing', 'sing', 'singing', 'song', 'music', 'musical', 'dhun', 'fest', 'festival',
            'celebration', 'celebrate', 'performance', 'drama', 'art', 'poster', 'painting', 'creative', 'talent', 'cultural activity',
            'cultural activities', 'teachers day', 'teacher day', 'graduation', 'farewell', 'sanskritik'],
        specific: ['dance', 'dancing', 'singing', 'sing', 'drama', 'painting', 'music', 'song', 'farewell'],
    },
    sports: {
        terms: ['sports', 'sport', 'cricket', 'chess', 'badminton', 'football', 'volleyball', 'game', 'games', 'athletic', 'fitness', 'khel'],
        specific: ['cricket', 'chess', 'badminton', 'football', 'volleyball'],
    },
    academic: {
        terms: ['guest lecture', 'lecture', 'talk', 'speaker', 'career guidance', 'expert', 'industry expert', 'academic event', 'academic'],
        specific: [],
    },
    event: {
        terms: ['event', 'activity', 'activities', 'happening', 'happenings', 'program', 'programme', 'function', 'fest', 'festival', 'इवेंट'],
        specific: [],
    },

    // ---- Student Zone ----
    pyq: {
        terms: ['pyq', 'pyqs', 'previous year', 'previous years', 'previous year paper', 'previous year question paper', 'old paper',
            'old question paper', 'old exam paper', 'question paper', 'qp', 'exam paper', 'semester paper', 'sem paper', 'previous question',
            'previous semester paper', 'past paper', 'purane paper', 'purana paper', 'pichle saal', 'pichhle saal', 'previous papers',
            'exam', 'exams', 'test paper', 'पेपर', 'प्रश्न पत्र', 'परीक्षा'],
        specific: [],
    },
    mst: { terms: ['mst', 'mid sem', 'midsem', 'mid semester', 'mid term', 'midterm', 'mst paper'], specific: [] },
    endsem: { terms: ['end sem', 'endsem', 'end semester', 'end term', 'final exam', 'final paper', 'semester exam'], specific: [] },
    paper: { terms: ['paper', 'papers', 'question', 'questions'], specific: [] },
    notes: {
        specific: ['syllabus', 'assignment', 'book', 'video'],
        terms: ['notes', 'note', 'study material', 'study materials', 'material', 'materials', 'syllabus', 'assignment', 'assignments',
            'learning resource', 'learning resources', 'resource', 'resources', 'handwritten', 'unit notes', 'lecture notes', 'padhai',
            'books', 'book', 'study', 'video', 'videos', 'नोट्स'],
    },

    // ---- society ----
    about: {
        terms: ['about us', 'about society', 'about cses', 'about the society', 'about the team', 'who are we', 'who runs', 'who are you',
            'team', 'member', 'members', 'council', 'student council', 'president', 'vice president', 'secretary', 'general secretary',
            'treasurer', 'chairperson', 'chairman', 'faculty', 'leadership', 'structure', 'hierarchy', 'department', 'departments',
            'core panel', 'core panels', 'head', 'society details', 'society information', 'society info', 'mission', 'vision'],
        specific: [],
    },
    opportunity: {
        terms: ['opportunity', 'opportunities', 'role', 'roles', 'new role', 'new roles', 'join', 'joining', 'recruit', 'recruitment',
            'volunteer', 'volunteering', 'vacancy', 'vacancies', 'apply', 'hiring', 'open position', 'position', 'positions', 'membership',
            'become a member'],
        specific: [],
    },
    contact: {
        terms: ['contact', 'contact us', 'contact details', 'email', 'mail', 'e-mail', 'gmail', 'instagram', 'insta', 'linkedin', 'social',
            'social media', 'reach', 'reach out', 'reach the team', 'get in touch', 'address', 'phone', 'connect', 'sampark', 'संपर्क'],
        specific: ['instagram', 'insta', 'linkedin', 'phone'],
    },
    gallery: {
        terms: ['gallery', 'photo', 'photos', 'photograph', 'photographs', 'picture', 'pictures', 'pic', 'pics', 'image', 'images', 'snaps', 'tasveer'],
        specific: [],
    },
    announcement: {
        terms: ['announcement', 'announcements', 'notification', 'notifications', 'news', 'update', 'updates', 'bulletin', 'magazine', 'innoverse', 'notice'],
        specific: ['magazine', 'innoverse'],
    },

    // ---- modifiers & conversation ----
    latest: { terms: ['latest', 'recent', 'recently', 'newest', 'upcoming', 'last', 'current', 'newly', 'naya', 'nayi', 'naye', 'abhi', 'new'], specific: [] },
    greeting: { terms: ['hi', 'hii', 'hello', 'hey', 'namaste', 'hola', 'good morning', 'good evening', 'good afternoon', 'namaskar'], specific: [] },
    thanks: { terms: ['thanks', 'thank you', 'thx', 'thank', 'dhanyavad', 'shukriya', 'ty'], specific: [] },
    help: { terms: ['help', 'what can you do', 'how to use', 'how do you work', 'kya kar sakte', 'options', 'menu'], specific: [] },
    yes: { terms: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'haan', 'ha', 'ji', 'show all', 'all of them', 'everything'], specific: [] },
    more: { terms: ['more', 'show more', 'next', 'others', 'other', 'aur', 'more results'], specific: [] },
};

/** Concepts that merely describe "what kind of thing", not a topic to match literally. */
export const GENERIC_CONCEPTS = new Set(['event', 'latest', 'greeting', 'thanks', 'help', 'yes', 'more', 'paper']);

/** Words ignored when checking whether a result literally mentions the query. */
export const GENERIC_WORDS = new Set([
    'event', 'paper', 'note', 'resource', 'material', 'society', 'cse', 'cses', 'student', 'zone', 'website', 'site', 'page',
    'information', 'info', 'detail', 'link', 'latest', 'recent', 'new', 'upcoming', 'previous', 'year', 'old', 'sem', 'semester', 'pyq', 'pyqs', 'unit',
]);

/** Light, consistent stemmer used for BOTH queries and indexed content. */
export function stem(word) {
    if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.length > 4 && /(ches|shes|xes|sses|zes)$/.test(word)) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
    return word;
}

/* ---- compiled lookup structures ---- */
const phraseIndex = [];          // { concept, tokens:[stems], specific }
const singleIndex = new Map();   // stem -> Set(concept)
const specificSet = new Set();   // stems of specific single words

(function compile() {
    const tok = (s) => s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ+#\s-]/g, ' ').replace(/-/g, ' ').split(/\s+/).filter(Boolean).map(stem);
    Object.entries(CONCEPTS).forEach(([concept, def]) => {
        def.terms.forEach((term) => {
            const t = tok(term);
            if (!t.length) return;
            if (t.length === 1) {
                if (!singleIndex.has(t[0])) singleIndex.set(t[0], new Set());
                singleIndex.get(t[0]).add(concept);
            } else {
                phraseIndex.push({ concept, tokens: t });
            }
        });
        (def.specific || []).forEach((term) => {
            const t = tok(term);
            if (t.length === 1) specificSet.add(t[0]);
        });
    });
    // longest phrases first so "previous year paper" wins over "previous year"
    phraseIndex.sort((a, b) => b.tokens.length - a.tokens.length);
})();

/** concepts a single (stemmed) token belongs to, or null */
export function tokenConcepts(token) { return singleIndex.get(token) || null; }

const fuzzyCache = new Map();
function editDistanceAtMost(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let diag = prev[0];
        prev[0] = i;
        let rowMin = prev[0];
        for (let j = 1; j <= b.length; j++) {
            const tmp = prev[j];
            prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
            if (prev[j] < rowMin) rowMin = prev[j];
        }
        if (rowMin > max) return false;
    }
    return prev[b.length] <= max;
}

/** Typo tolerance: "hackthon" -> "hackathon". Only for longer words, so short words never collide. */
export function fuzzyLookup(token) {
    if (token.length < 5) return null;
    if (fuzzyCache.has(token)) return fuzzyCache.get(token);
    const max = token.length >= 8 ? 2 : 1;
    let found = null;
    for (const key of singleIndex.keys()) {
        if (key.length < 5 || key[0] !== token[0]) continue;
        if (editDistanceAtMost(token, key, max)) { found = key; break; }
    }
    fuzzyCache.set(token, found);
    return found;
}

/**
 * Find concepts in a list of stemmed tokens.
 * @returns {{ concepts: Map<string, number>, specific: string[] }}
 */
export function detectConcepts(allTokens) {
    const concepts = new Map();
    const specific = [];
    const claimed = new Array(allTokens.length).fill(false);
    const bump = (c, n) => concepts.set(c, Math.max(concepts.get(c) || 0, n));

    // multi-word phrases
    for (const p of phraseIndex) {
        for (let i = 0; i + p.tokens.length <= allTokens.length; i++) {
            let ok = true;
            for (let k = 0; k < p.tokens.length; k++) if (allTokens[i + k] !== p.tokens[k]) { ok = false; break; }
            if (ok) { bump(p.concept, 1.3); for (let k = 0; k < p.tokens.length; k++) claimed[i + k] = true; }
        }
    }
    // single words (+ typo tolerance)
    allTokens.forEach((t, i) => {
        let set = singleIndex.get(t);
        let key = t;
        if (!set) {
            const near = fuzzyLookup(t);
            if (near) { set = singleIndex.get(near); key = near; }
        }
        if (set) {
            set.forEach((c) => bump(c, claimed[i] ? 1.3 : 1));
            if (specificSet.has(key)) specific.push(t);
        }
    });

    // implications: coding/competition words are technical-leaning topics
    if (concepts.has('coding') && !concepts.has('technical')) concepts.set('technical', 0.9);
    if (concepts.has('mst') || concepts.has('endsem')) bumpMissing(concepts, 'pyq', 0.9);
    return { concepts, specific: Array.from(new Set(specific)) };
}
function bumpMissing(map, key, v) { if (!map.has(key)) map.set(key, v); }
