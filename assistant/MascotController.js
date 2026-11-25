/**
 * MascotController.js - the character, nothing else. Swap the image in assistantData.MASCOT
 * (and the optional eye positions) to change the character; the chat UI does not care.
 *
 *   idle   : gentle float (CSS)
 *   blink  : navy "eyelids" over the eyes, only if MASCOT.eyes is set
 *   wave() : friendly tilt   react() : small hop when a reply arrives
 * All motion is CSS-class driven and disabled for prefers-reduced-motion.
 */
export class MascotController {
    constructor(config, root, size = 'launcher') {
        this.config = config;
        this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.el = document.createElement('span');
        this.el.className = `cses-mascot cses-mascot--${size}`;
        this.el.setAttribute('aria-hidden', 'true');

        const body = document.createElement('span');
        body.className = 'cses-mascot__body';
        const img = new Image();
        img.src = new URL(config.src, root).href;
        img.alt = '';
        img.width = config.width; img.height = config.height;
        img.decoding = 'async'; img.draggable = false;
        body.appendChild(img);

        this.lids = [];
        (config.eyes || []).forEach((eye) => {
            const lid = document.createElement('i');
            lid.className = 'cses-mascot__lid';
            Object.assign(lid.style, { left: eye.x + '%', top: eye.y + '%', width: eye.w + '%', height: eye.h + '%', background: config.lidColor || '#13172f' });
            body.appendChild(lid);
            this.lids.push(lid);
        });
        this.el.appendChild(body);
        this.body = body;
        root && this._startBlinking();
    }

    _startBlinking() {
        if (this.reduce || !this.lids.length) return;
        const loop = () => {
            this._timer = setTimeout(() => {
                if (!document.hidden && this.el.isConnected) {
                    this.lids.forEach((l) => l.classList.add('is-blinking'));
                    setTimeout(() => this.lids.forEach((l) => l.classList.remove('is-blinking')), 160);
                }
                loop();
            }, 2600 + Math.random() * 3600);
        };
        loop();
    }

    _play(cls, ms) {
        if (this.reduce) return;
        this.body.classList.remove(cls); void this.body.offsetWidth;
        this.body.classList.add(cls);
        setTimeout(() => this.body.classList.remove(cls), ms);
    }
    wave() { this._play('is-waving', 1400); }
    react() { this._play('is-reacting', 700); }
    destroy() { clearTimeout(this._timer); this.el.remove(); }
}
