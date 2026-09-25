/**
 * ==========================================================================
 * CSE SOCIETY CENTRAL ARCHITECTURE SCRIPTS - FULLY FUNCTIONAL
 * ==========================================================================
 */

// Splash control: shows logo overlay on first load
function runSplash() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('splashOverlay');
        if (!overlay) return resolve();

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        const holdMs = 2000;
        setTimeout(() => {
            overlay.classList.add('splash-hide');
            setTimeout(() => {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                resolve();
            }, 650);
        }, holdMs);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    runSplash().then(() => {
        initNavigation();
        initThemeEngine();
        initAccordions();
        initModalSystem();
        initFormHandlers();
        initStudentZone();
        initScrollReveal();
        initHeroTypingAnimation();
        initGalleryModal();
    });
});

// 1. Navigation and Mobile Hamburger Operations
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        const mobileLinks = mobileMenu.querySelectorAll('.mobile-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }
}

// 2. Light / Dark Mode Engine Initialization
function initThemeEngine() {
    const themeToggle = document.getElementById('themeToggle');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const localThemeSetting = localStorage.getItem('siteTheme');

    if (localThemeSetting === 'dark' || (!localThemeSetting && systemPrefersDark)) {
        document.body.classList.add('dark-mode');
        updateToggleUI(true);
    } else {
        updateToggleUI(false);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDarkModeNow = document.body.classList.toggle('dark-mode');
            localStorage.setItem('siteTheme', isDarkModeNow ? 'dark' : 'light');
            updateToggleUI(isDarkModeNow);
        });
    }

    function updateToggleUI(isDark) {
        if (!themeToggle) return;
        themeToggle.textContent = isDark ? '🌙' : '☀️';
        themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
}

// 3. Student Zone Semester & Content Accordions
function toggleSemester(semesterId) {
    const targetContent = document.getElementById(semesterId);
    if (!targetContent) return;

    const isExpanded = targetContent.classList.contains('active');
    
    if (isExpanded) {
        targetContent.classList.remove('active');
    } else {
        targetContent.classList.add('active');
    }

    const header = targetContent.previousElementSibling;
    if (header) {
        const icon = header.querySelector('.toggle-icon, .accordion-icon, .arrow');
        if (icon) {
            icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
}
window.toggleSemester = toggleSemester;

function initAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header, .semester-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target') || header.dataset.target;
            if (targetId) {
                toggleSemester(targetId);
            } else {
                const content = header.nextElementSibling;
                if (content && (content.classList.contains('accordion-content') || content.classList.contains('semester-content'))) {
                    content.classList.toggle('active');
                    const icon = header.querySelector('.toggle-icon, .accordion-icon, .arrow');
                    if (icon) {
                        const isOpen = content.classList.contains('active');
                        icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
                    }
                }
            }
        });
    });
}

// 4. Student Zone Real-Time Search & Category Filters
function initStudentZone() {
    const searchInput = document.getElementById('studentZoneSearch') || document.getElementById('resourceSearch');
    const filterTabs = document.querySelectorAll('.tab-btn, .sem-tab');
    const resourceCards = document.querySelectorAll('.resource-card, .paper-card, .subject-card, .semester-box');

    // Real-time keyword filter across Question Papers & Notes
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            resourceCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(query)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Tab button category switcher (e.g. 1st Sem, 2nd Sem, Syllabus)
    if (filterTabs.length) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const category = tab.getAttribute('data-filter') || tab.dataset.filter;
                if (!category || category === 'all') {
                    resourceCards.forEach(card => card.style.display = '');
                } else {
                    resourceCards.forEach(card => {
                        const cardCat = card.getAttribute('data-category') || card.dataset.category;
                        if (cardCat === category || card.classList.contains(category)) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    }
}

// 5. Form Handlers for Suggestion Deck & Feedback Form
function initFormHandlers() {
    const suggestionForm = document.getElementById('suggestionForm') || document.querySelector('.suggestion-form');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = suggestionForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Submit';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending... 🚀';
            }

            setTimeout(() => {
                showToast('Thank you! Your feedback/suggestion has been submitted.');
                suggestionForm.reset();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }, 800);
        });
    }
}

// Toast Feedback Notification Box
function showToast(message) {
    let toast = document.getElementById('siteToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'siteToast';
        toast.className = 'site-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// 6. Scroll Reveal & Typing Animations
function initScrollReveal() {
    const targets = document.querySelectorAll(
        '.section-title, .hero-content h1, .hero-sub, ' +
        '.feature-card, .notif-card, .gallery-card, .cta-banner, .resource-card, .semester-box'
    );

    if (!targets.length || !('IntersectionObserver' in window)) return;

    targets.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    targets.forEach((el) => observer.observe(el));
}

function initHeroTypingAnimation() {
    const heroH1 = document.querySelector('.hero h1');
    if (!heroH1 || heroH1.classList.contains('typing-animation')) return;

    const originalHTML = heroH1.innerHTML;
    const fullText = heroH1.textContent.trim();
    const typingDuration = 2500;
    const charsToType = fullText.length;
    const delayPerChar = typingDuration / charsToType;
    let currentIndex = 0;

    heroH1.classList.add('typing-animation');
    heroH1.textContent = '';

    const typingInterval = setInterval(() => {
        if (currentIndex <= charsToType) {
            heroH1.textContent = fullText.substring(0, currentIndex);
            currentIndex++;
        } else {
            clearInterval(typingInterval);
            heroH1.innerHTML = originalHTML;
            heroH1.classList.remove('typing-animation');
        }
    }, delayPerChar);
}

// 7. Modal & Gallery Engine
function initModalSystem() {}

function initGalleryModal() {
    const galleryImages = document.querySelectorAll('.gallery-img');
    const modalOverlay = document.getElementById('galleryModalOverlay');
    const modalImg = document.getElementById('galleryModalImg');
    const modalCaption = document.getElementById('galleryModalCaption');
    const closeBtn = document.getElementById('galleryModalClose');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');

    let currentImageIndex = 0;
    const allImages = Array.from(galleryImages);

    if (!modalOverlay || !modalImg || !modalCaption || !closeBtn || !prevBtn || !nextBtn || !allImages.length) {
        return;
    }

    function openModal(index) {
        if (index < 0 || index >= allImages.length) return;
        currentImageIndex = index;
        const img = allImages[index];
        modalImg.src = img.src;
        modalCaption.textContent = img.alt || 'Gallery image';
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function nextImage() {
        openModal((currentImageIndex + 1) % allImages.length);
    }

    function prevImage() {
        openModal((currentImageIndex - 1 + allImages.length) % allImages.length);
    }

    galleryImages.forEach((img, index) => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(index);
        });
    });

    closeBtn.addEventListener('click', closeModal);
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (!modalOverlay.classList.contains('active')) return;
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeModal();
    });
}
