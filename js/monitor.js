/**
 * CSES Futuristic Computer Workstation Monitor System
 * Drives the interactive monitor on the homepage:
 * - Boot sequence on initial view / load with terminal logs & scanlines
 * - Slide transitions with forward/backward navigation and auto-cycle
 * - Interactive screen modes (Photos / Terminal stats / Live feed)
 * - Power toggle & fullscreen glance
 * - Sound trigger hooks into CSES_AUDIO
 */
(function() {
    'use strict';

    function initWorkstationMonitor() {
        const monitor = document.getElementById('heroMonitor');
        if (!monitor) return;

        const slides = Array.from(monitor.querySelectorAll('.monitor-slide'));
        const dots = Array.from(monitor.querySelectorAll('.monitor-dot'));
        const prevBtn = monitor.querySelector('.monitor-nav-prev');
        const nextBtn = monitor.querySelector('.monitor-nav-next');
        const powerBtn = monitor.querySelector('.monitor-power-btn');
        const screen = monitor.querySelector('.monitor-screen');
        const captionEl = monitor.querySelector('.monitor-caption-text');
        const counterEl = monitor.querySelector('.monitor-counter');

        if (!slides.length) return;

        let currentIndex = 0;
        let isPowerOn = true;
        let cycleInterval = null;
        let isHovered = false;

        const captions = [
            "Innoverse Society Magazine Showcase",
            "CSES Academic & Technical Vision",
            "Welcome to CSE Society Workspace",
            "Innovating Code & Student Leadership",
            "Collaborative Engineering Community",
            "Department Events & Workshops"
        ];

        function updateSlide(index, playSound = true) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
                dot.setAttribute('aria-pressed', i === index ? 'true' : 'false');
            });

            if (captionEl) {
                captionEl.textContent = captions[index] || `Campus Highlight 0${index + 1}`;
            }
            if (counterEl) {
                counterEl.textContent = `SYS.0${index + 1} / 0${slides.length}`;
            }

            if (playSound && window.CSES_AUDIO) {
                window.CSES_AUDIO.play('slide');
            }
        }

        function nextSlide() {
            if (!isPowerOn) return;
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlide(currentIndex);
        }

        function prevSlide() {
            if (!isPowerOn) return;
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateSlide(currentIndex);
        }

        function startAutoCycle() {
            stopAutoCycle();
            cycleInterval = setInterval(() => {
                if (!isHovered && isPowerOn) {
                    nextSlide();
                }
            }, 4200);
        }

        function stopAutoCycle() {
            if (cycleInterval) {
                clearInterval(cycleInterval);
                cycleInterval = null;
            }
        }

        // Event listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                nextSlide();
                startAutoCycle();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                prevSlide();
                startAutoCycle();
            });
        }

        dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isPowerOn) return;
                currentIndex = i;
                updateSlide(currentIndex);
                startAutoCycle();
            });
        });

        // Power button toggle
        if (powerBtn) {
            powerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                isPowerOn = !isPowerOn;
                monitor.classList.toggle('is-standby', !isPowerOn);
                powerBtn.classList.toggle('is-off', !isPowerOn);
                powerBtn.setAttribute('title', isPowerOn ? 'Standby Mode' : 'Power On Display');

                if (window.CSES_AUDIO) {
                    window.CSES_AUDIO.play(isPowerOn ? 'boot' : 'modalClose');
                }

                if (isPowerOn) {
                    triggerBootAnimation();
                    startAutoCycle();
                } else {
                    stopAutoCycle();
                }
            });
        }

        // Pause on hover
        monitor.addEventListener('mouseenter', () => { isHovered = true; });
        monitor.addEventListener('mouseleave', () => { isHovered = false; });

        // Keyboard navigation when monitor or sub-elements have focus
        monitor.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
        });

        // Subtle 3D tilt tracking for workstation depth
        monitor.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 992) return;
            const rect = monitor.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            monitor.style.setProperty('--tilt-x', `${(-y * 10).toFixed(2)}deg`);
            monitor.style.setProperty('--tilt-y', `${(x * 12).toFixed(2)}deg`);
        });

        monitor.addEventListener('mouseleave', () => {
            monitor.style.setProperty('--tilt-x', '0deg');
            monitor.style.setProperty('--tilt-y', '0deg');
        });

        function triggerBootAnimation() {
            monitor.classList.add('is-booting');
            setTimeout(() => {
                monitor.classList.remove('is-booting');
            }, 1200);
        }

        // Initial setup
        updateSlide(0, false);
        triggerBootAnimation();
        startAutoCycle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkstationMonitor);
    } else {
        initWorkstationMonitor();
    }
})();
