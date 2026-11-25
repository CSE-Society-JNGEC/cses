/** Entry point: <script type="module" src="assistant/index.js"></script> on every page. */
import { createSources } from './contentSources.js';
import { createContext } from './conversationContext.js';
import { createRouter } from './assistantRouter.js';
import { createEngine } from './assistantEngine.js';
import { AssistantWidget } from './AssistantWidget.js';

const root = new URL('../', import.meta.url);   // site root, whatever page we are on

function start() {
    const context = createContext();
    const sources = createSources(root);
    const engine = createEngine({ sources, context });
    const widget = new AssistantWidget({ engine, router: createRouter(root), context, root });
    widget.mount();
    window.CSESAssistant = { widget, engine, sources, context };   // handy for debugging / future AI swap-in
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
