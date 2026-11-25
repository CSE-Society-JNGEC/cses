/**
 * CSES Audio & Interaction Sound System
 * Synthesized crisp, professional UI audio feedback using Web Audio API.
 * Zero external audio file dependencies.
 * Global Sound Toggle with persistent state in localStorage.
 * Respects browser autoplay restrictions and reduced-motion preferences.
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'cses_sound_enabled';
    let audioCtx = null;
    let isSoundEnabled = localStorage.getItem(STORAGE_KEY) === 'true'; // default false/off until user toggles or enables

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Sound Synthesizers for various interactions
    const sounds = {
        // Subtle crisp click for buttons & links
        click: function() {
            if (!isSoundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime;
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
            
            gain.gain.setValueAtTime(0.045, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.04);
        },

        // Soft, high-tech hover tick
        hover: function() {
            if (!isSoundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime;
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.025);
            
            gain.gain.setValueAtTime(0.018, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.025);
        },

        // Monitor slide change or carousel advance
        slide: function() {
            if (!isSoundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            const now = ctx.currentTime;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);

            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.08);
        },

        // Futuristic monitor power on / boot chime
        boot: function() {
            if (!isSoundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Two-tone harmonic chime
            [520, 780, 1040].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + (i * 0.06);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.001, start);
                gain.gain.linearRampToValueAtTime(0.04, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(start);
                osc.stop(start + 0.22);
            });
        },

        // Modal open - tech swoosh / scale in
        modalOpen: function() {
            if (!isSoundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        },

        // Modal close - gentle descending tone
        modalClose: function() {
            if (!isSoundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(740, now);
            osc.frequency.exponentialRampToValueAtTime(360, now + 0.1);

            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.1);
        },

        // Page navigation departure sound
        pageTransition: function() {
            if (!isSoundEnabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);

            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.14);
        }
    };

    // Toggle button UI injection & Management
    function initSoundToggle() {
        // Create floating or nav sound toggle
        let toggle = document.getElementById('soundToggleBtn');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.id = 'soundToggleBtn';
            toggle.type = 'button';
            toggle.className = 'sound-toggle-btn';
            toggle.setAttribute('aria-label', isSoundEnabled ? 'Disable audio sound effects' : 'Enable audio sound effects');
            toggle.setAttribute('title', isSoundEnabled ? 'Sound: ON (Click to mute)' : 'Sound: OFF (Click to enable audio effects)');

            // Find nav-actions if available, else append to body
            const navActions = document.querySelector('.nav-actions');
            if (navActions) {
                navActions.insertBefore(toggle, navActions.firstChild);
            } else {
                document.body.appendChild(toggle);
            }
        }

        function updateToggleState() {
            toggle.classList.toggle('is-muted', !isSoundEnabled);
            toggle.classList.toggle('is-active', isSoundEnabled);
            toggle.setAttribute('aria-pressed', isSoundEnabled ? 'true' : 'false');
            toggle.setAttribute('title', isSoundEnabled ? 'Sound: ON (Click to mute)' : 'Sound: OFF (Click to enable audio effects)');
            toggle.innerHTML = isSoundEnabled
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><span class="sound-label">Audio ON</span>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg><span class="sound-label">Audio OFF</span>`;
        }

        updateToggleState();

        toggle.addEventListener('click', () => {
            isSoundEnabled = !isSoundEnabled;
            localStorage.setItem(STORAGE_KEY, isSoundEnabled ? 'true' : 'false');
            updateToggleState();
            if (isSoundEnabled) {
                getAudioContext();
                sounds.click();
            }
        });
    }

    // Attach interaction sounds to relevant elements
    let lastHoverTime = 0;
    function bindInteractions() {
        // Unlock AudioContext on first user gesture anywhere
        const unlockAudio = () => {
            getAudioContext();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio, { passive: true });
        window.addEventListener('keydown', unlockAudio, { passive: true });
        window.addEventListener('touchstart', unlockAudio, { passive: true });

        // Hover effect for key interactive elements (throttled to 100ms)
        document.addEventListener('mouseover', (e) => {
            if (!isSoundEnabled) return;
            const now = Date.now();
            if (now - lastHoverTime < 110) return;
            const target = e.target.closest && e.target.closest('.btn-primary, .btn-outline, .nav-link, .gallery-chip, .feature-card, .council-card, .event-card, .monitor-btn, .monitor-power-btn');
            if (target) {
                lastHoverTime = now;
                sounds.hover();
            }
        }, { passive: true });

        // Click effect for buttons, cards, links
        document.addEventListener('click', (e) => {
            const target = e.target.closest && e.target.closest('button, a, .council-card, .feature-card, .gallery-tile, .gallery-chip');
            if (target && target.id !== 'soundToggleBtn') {
                sounds.click();
            }
        }, { passive: true });
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initSoundToggle();
            bindInteractions();
        });
    } else {
        initSoundToggle();
        bindInteractions();
    }

    // Expose sound methods globally for other modules (monitor, modal, etc.)
    window.CSES_AUDIO = {
        play: (name) => { if (sounds[name]) sounds[name](); },
        isEnabled: () => isSoundEnabled,
        toggle: () => {
            const btn = document.getElementById('soundToggleBtn');
            if (btn) btn.click();
        }
    };
})();
