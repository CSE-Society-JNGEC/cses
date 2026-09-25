/**
 * ==========================================================================
 * CSE SOCIETY CENTRAL ARCHITECTURE SCRIPTS
 * ==========================================================================
 */

// Splash control: shows logo overlay on first load for a short animated interval
function runSplash() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('splashOverlay');
        if (!overlay) return resolve();

        // Temporarily disable scrolling while splash is visible
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        // Hold duration (ms) before fading out — adjust between 2000-3000ms
        const holdMs = 2300;
        setTimeout(() => {
            overlay.classList.add('splash-hide');
            // Allow CSS fade to finish before removing overlay and restoring scroll
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
        initGalleryModal();
        initFormHandlers();
        initStudentZone();
        initScrollReveal();
        initHeroTypingAnimation();
    });
});

// 1. Navigation and Mobile Hamburger Operations
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('open');
        });

        // Close menu on navigation click
        const mobileLinks = mobileMenu.querySelectorAll('.mobile-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('open');
            });
        });
    }
}

// 1b. Soft entrance animations for headings, cards & gallery images on scroll
function initScrollReveal() {
    // Only static, already-rendered elements are targeted here. Content that
    // is created later (e.g. resource cards inside the Student Zone search
    // results) is intentionally left untouched so it always renders visible.
    const targets = document.querySelectorAll(
        '.section-title, .page-hero h1, .page-hero p, ' +
        '.feature-card, .notif-card, .event-card, .faculty-card, .benefit-card, ' +
        '.lead-card, .team-card, .council-card, .gallery-img, .cta-banner'
    );

    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) return; // graceful no-op fallback

    targets.forEach((el, i) => {
        el.classList.add('reveal-up');
        // Small stagger for elements that share a row/grid, capped so it
        // never feels sluggish.
        el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el) => observer.observe(el));
}

// 1c. Hero Typing Animation for Main H1
function initHeroTypingAnimation() {
    const heroH1 = document.querySelector('.hero h1');
    if (!heroH1) return;

    // Prevent running animation twice
    if (heroH1.classList.contains('typing-animation')) return;

    // Store original HTML to preserve the <span> element
    const originalHTML = heroH1.innerHTML;
    const fullText = heroH1.textContent.trim();
    
    // Duration settings
    const typingDuration = 3500; // milliseconds
    const charsToType = fullText.length;
    const delayPerChar = typingDuration / charsToType;
    
    let currentIndex = 0;
    
    // Add typing class to show cursor
    heroH1.classList.add('typing-animation');
    
    // Clear the content temporarily
    heroH1.textContent = '';
    
    // Typing animation loop
    const typingInterval = setInterval(() => {
        if (currentIndex <= charsToType) {
            const displayText = fullText.substring(0, currentIndex);
            heroH1.textContent = displayText;
            currentIndex++;
        } else {
            // Animation complete
            clearInterval(typingInterval);
            heroH1.innerHTML = originalHTML; // Restore original HTML with span formatting
            heroH1.classList.remove('typing-animation');
            heroH1.classList.add('typing-complete');
        }
    }, delayPerChar);
}

// 1d. Gallery Lightbox Modal
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

    // Open modal with image
    function openModal(index) {
        if (index < 0 || index >= allImages.length) return;
        currentImageIndex = index;
        const img = allImages[index];
        modalImg.src = img.src;
        modalImg.fetchPriority = 'high';
        modalImg.decoding = 'async';
        modalCaption.textContent = img.alt || 'Gallery image';
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Navigate to next image
    function nextImage() {
        openModal((currentImageIndex + 1) % allImages.length);
    }

    // Navigate to previous image
    function prevImage() {
        openModal((currentImageIndex - 1 + allImages.length) % allImages.length);
    }

    // Attach click handlers to all gallery images
    galleryImages.forEach((img, index) => {
        img.addEventListener('click', () => openModal(index));
    });

    // Modal controls
    closeBtn.addEventListener('click', closeModal);
    prevBtn.addEventListener('click', prevImage);
    nextBtn.addEventListener('click', nextImage);

    // Close modal when clicking outside the modal content
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modalOverlay.classList.contains('active')) return;
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeModal();
    });
}

// 2. Light / Dark Mode Engine Initialization
function initThemeEngine() {
    const themeToggle = document.getElementById('themeToggle');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const localThemeSetting = localStorage.getItem('siteTheme');

    // Run active configuration check
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

// 3. Student Zone Semester Content Accordions
function toggleSemester(semesterId) {
    const targetContent = document.getElementById(semesterId);
    if (!targetContent) return;

    const parentHeader = targetContent.previousElementSibling;
    const icon = parentHeader ? parentHeader.querySelector('.toggle-icon') : null;

    if (targetContent.classList.contains('active')) {
        targetContent.classList.remove('active');
        if (icon) icon.style.transform = 'rotate(0deg)';
    } else {
        targetContent.classList.add('active');
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
}

// Global scope export for inline onclick definitions mapping safely
window.toggleSemester = toggleSemester;

function initAccordions() {
    // Structural pre-evaluations can be added here if automated assignments are desired
}

// 4. Modal System for Event Detailed Profiles
function initModalSystem() {
    const modalOverlay = document.getElementById('eventDetailsModal');
    const closeBtn = document.getElementById('eventModalClose');
    const detailButtons = document.querySelectorAll('.btn-viewmore');
    const interactiveCards = document.querySelectorAll('.event-card.interactive');

    // Sample dynamic registry mapping structure
    const eventDatabase = {
        teachersDay: {
            title: "Teacher's Day Celebration",
            meta: "5 September 2026 | 12:30 PM | Cultural Event",
            desc: "A heartfelt celebration dedicated to honoring our faculty for their guidance, dedication, and invaluable contribution, featuring performances, speeches, and engaging activities.",
            poster: "Photos/Events/Teacher_Day/0.jpg",
            team: "Cultural Committee | Shivangi Ranout |Sheetal Bisht |Mannat",
            photos: [
                
            ]
        },
        guestLecture: {
            title: "Guest Lecture",
            meta: "23 February 2026 | 2:00 PM – 4:00 PM | Academic Event",
            desc: "An insightful session conducted by an industry expert on emerging technologies and career opportunities.",
            poster: "Photos/Events/Guest_Lecture/3.jpg",
            team: "Training Cell, Department Faculty",
            photos: [
                "Photos/Events/Guest_Lecture/1.jpg",
                "Photos/Events/Guest_Lecture/2.jpg",
                "Photos/Events/Guest_Lecture/3.jpg"
            ]
        },
        promptEngineering: {
            title: "Prompt Engineering Event",
            meta: "24 February 2026 | 3:00 PM – 4:00 PM | Technical Event",
            desc: "An interactive prompt engineering event designed to enhance students’ AI prompting skills through creative challenges and practical problem-solving.",
            poster: "Photos/Events/Prompt/Poster.png",
            team: "Technical Committee | Jigyasu | Saniya Dhiman | Sweta",
            winners: "<li>Elite Promptian: Rrizul Saini & Nikhil Patiyal</li><li>Elite Promptian: Sejal Pathania & Monika</li>",
            photos: [
                "Photos/Events/Prompt/4.jpeg",
                "Photos/Events/Prompt/5.jpeg",
                "Photos/Events/Prompt/2.jpg",
                "Photos/Events/Prompt/3.jpg",
                "Photos/Events/Prompt/1.jpg"
            ]
        },
        posterMaking: {
            title: "Poster Making Competition",
            meta: "22 March 2026 | 11:00 AM – 2:00 PM | Cultural Event",
            desc: "Students showcased their creativity through theme-based poster designs.",
            poster: "Photos/Events/Poster_Making/Poster.png",
            team: "Cultural Committee |Shivangi Ranout |Sheetal Bisht |Mannat ",
            winners: "<li>First Prize: Arsita</li><li>Second Prize: Dhroov</li><li>Third Prize: Purnima</li>",
            photos: [
                "Photos/Events/Poster_Making/1.jpg",
                "Photos/Events/Poster_Making/2.jpg",
                "Photos/Events/Poster_Making/1.jpeg",
                "Photos/Events/Poster_Making/2.jpeg"
            ]
        },
        algoverse: {
            title: "Algoverse 2.0",
            meta: "26 February 2026 | 2:00 PM – 4:00 PM | Technical Event",
            desc: "Competitive programming and algorithmic problem-solving event for students.",
            poster: "Photos/Events/Algoverse_2.0/1.jpg",
            team: " Technical Committee | Jigyasu | Saniya Dhiman | Sweta",
            winners: "<li>Champion: Complexity Crew</li><li>Runner-Up: Team CodeStorm</li>",
            photos: [
                "Photos/Events/Algoverse_2.0/0.jpeg",
                "Photos/Events/Algoverse_2.0/2.jpg",
                "Photos/Events/Algoverse_2.0/3.jpg",
                "Photos/Events/Algoverse_2.0/4.jpg"
            ]
        },
        dhun: {
            title: "Dhun",
            meta: "28 February 2026 | 2:00 PM – 5:00 PM | Cultural Event",
            desc: "A musical extravaganza featuring solo and group performances by students.",
            poster: "Photos/Events/Dhun/4.jpeg",
            team: "Cultural Committee | Shivangi Ranout | Sheetal Bisht | Mannat",
            photos: [
                "Photos/Events/Dhun/0.jpeg",
                "Photos/Events/Dhun/1.jpeg",
                "Photos/Events/Dhun/3.jpeg",
                "Photos/Events/Dhun/2.jpeg"
            ]
        },
        sportsEvent: {
            title: "Sports Event",
            meta: "2-4 April 2026 | 9:00 AM – 5:00 PM | Sports Event",
            desc: "Various indoor and outdoor sports competitions promoting teamwork and fitness.",
            poster: "Photos/Events/Sports/Poster.jpeg",
            team: "Sports Committee, CSES",
            photos: [
                "Photos/Events/Sports/1.jpg",
                "Photos/Events/Sports/2.jpg",
                "Photos/Events/Sports/3.jpg",
                "Photos/Events/Sports/4.jpg",
                "Photos/Events/Sports/5.jpg",
                "Photos/Events/Sports/6.jpg"
            ]
        },
        graduation: {
            title: "Graduation Ceremony",
            meta: "23 May 2026 | 11:00 AM – 2:00 PM | Cultural Event",
            desc: "Ceremony celebrating the achievements of graduating students and their academic journey.",
            poster: "Photos/Events/Graduation_Ceremony/Poster.png",
            team: "CSE Society",
            photos: [
                "Photos/Events/Graduation_Ceremony/1.jpg",
                "Photos/Events/Graduation_Ceremony/2.jpg",
                "Photos/Events/Graduation_Ceremony/3.jpg"
            ]
        }
    };

    // Build a static right-side poster for each event card.
    function setEventSlides() {
        interactiveCards.forEach(card => {
            const key = card.getAttribute('data-event');
            const record = eventDatabase[key] || {};

            // Ensure textual content is wrapped in `.event-content` so slideshow can sit on the right
            if (!card.querySelector('.event-content')) {
                const contentWrap = document.createElement('div');
                contentWrap.className = 'event-content';
                // Move existing children (except any existing slideshow) into contentWrap
                const existingChildren = Array.from(card.childNodes).filter(n => !(n.nodeType === 1 && n.classList && n.classList.contains('event-slideshow')));
                existingChildren.forEach(n => contentWrap.appendChild(n));
                card.appendChild(contentWrap);
            }

            // Remove any existing slideshow and its interval to avoid duplicates
            const existing = card.querySelector('.event-slideshow');
            if (existing) {
                if (existing._interval) clearInterval(existing._interval);
                existing.remove();
            }

            // Create a portrait poster placeholder. Replace the `poster` URL
            // in eventDatabase above when the original poster is available.
            const wrap = document.createElement('div');
            wrap.className = 'event-poster';

            const img = document.createElement('img');
            img.className = 'event-poster-image';
            img.src = record.poster || 'https://placehold.co/360x540/172554/ffffff?text=Event+Poster';
            img.alt = record.title ? `${record.title} photo` : 'Event photo';
            img.loading = 'lazy';
            img.decoding = 'async';
            wrap.appendChild(img);

            // Append poster to the right side of the card.
            card.appendChild(wrap);
        });
    }

    setEventSlides();

    function openEventModal(registryKey) {
        const records = eventDatabase[registryKey];
        if (!records || !modalOverlay) return;

        const titleEl = document.getElementById('eventModalTitle');
        const metaEl = document.getElementById('eventModalMeta');
        const descEl = document.getElementById('eventModalDescription');
        const teamEl = document.getElementById('eventModalTeam');
        const winnersEl = document.getElementById('eventModalWinners');
        const photoContainer = document.getElementById('eventModalPhotos');

        if (titleEl) titleEl.textContent = records.title;
        if (metaEl) metaEl.textContent = records.meta;
        if (descEl) descEl.textContent = records.desc;
        if (teamEl) teamEl.textContent = records.team || 'Student Council and event volunteers';
        if (winnersEl) winnersEl.innerHTML = records.winners || '';

        if (photoContainer) {
            photoContainer.innerHTML = '';
            (records.photos || []).forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = `${records.title} photo`;
                img.className = 'photo-thumb';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.fetchPriority = 'high';
                img.addEventListener('click', () => {
                    window.open(src, '_blank');
                });
                photoContainer.appendChild(img);
            });
        }

        modalOverlay.style.display = 'flex';
    }

    detailButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const registryKey = e.target.getAttribute('data-event');
            openEventModal(registryKey);
        });
    });

    if (closeBtn && modalOverlay) {
        closeBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        });
    }

    interactiveCards.forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-event');
            openEventModal(key);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const key = card.getAttribute('data-event');
                openEventModal(key);
            }
        });
    });
}

// 5. Automated Input Handling & Local Sim Storage
function initFormHandlers() {
    const suggestionForm = document.getElementById('suggestionForm');
    const contactForm = document.getElementById('contactForm');

    if (suggestionForm) {

    suggestionForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const submitButton = suggestionForm.querySelector(
            'button[type="submit"]'
        );

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {

            const response = await fetch(
                'https://formspree.io/f/mljrzole',
                {
                    method: 'POST',
                    body: new FormData(suggestionForm),
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {

                const successMessage = document.getElementById('suggestionSuccessMessage');
                if (successMessage) {
                    successMessage.textContent = '✓ Message sent successfully. Thank you for your suggestion.';
                }
                showSuccessAlert('suggestionSuccessMessage');

                suggestionForm.reset();

            } else {

                alert('Something went wrong. Please try again.');

            }

        } catch (error) {

            console.error('Form submission error:', error);

            alert('Unable to submit feedback. Please check your internet connection.');

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = 'Submit Feedback';

        }

    });

}

   if (contactForm) {

    contactForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const submitButton = contactForm.querySelector(
            'button[type="submit"]'
        );

        submitButton.disabled = true;
        submitButton.textContent = 'Transmitting...';

        try {

            const response = await fetch(
                contactForm.action,
                {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {

                showSuccessAlert('contactSuccessMessage');

                contactForm.reset();

            } else {

                alert('Message could not be transmitted. Please try again.');

            }

        } catch (error) {

            console.error('Contact form submission error:', error);

            alert(
                'Unable to send message. Please check your internet connection.'
            );

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = 'Transmit Secure Packet';

        }

    });

}

    function showSuccessAlert(elementId) {
        const targetAlert = document.getElementById(elementId);
        if (targetAlert) {
            targetAlert.style.display = 'block';
            setTimeout(() => {
                targetAlert.style.display = 'none';
            }, 4000);
        }
    }
}

console.log('✓ CSE Society Core UI Engine Active.');

/* ------------------ Student Zone Interactive Flow ------------------ */
function initStudentZone() {
    const featureGrid = document.getElementById('featureGrid');
    const selectionArea = document.getElementById('selectionArea');
    const filterSemester = document.getElementById('filterSemester');
    const filterSubject = document.getElementById('filterSubject');
    const filterPaperType = document.getElementById('filterPaperType');
    const searchButton = document.getElementById('searchButton');
    const pdfModal = document.getElementById('pdfModal');
    const pdfModalClose = document.getElementById('pdfModalClose');
    const pdfFrame = document.getElementById('pdfFrame');
    const pdfModalTitle = document.getElementById('pdfModalTitle');
    const pdfDownloadLink = document.getElementById('pdfDownloadLink');

    function normalizeAssetPath(path) {
        if (!path) return path;
        return path
            .replace(/\/Semester ([1-7])(?=\/)/g, '/Semester_$1')
            .replace(/\/Teacher Day(?=\/)/g, '/Teacher_Day')
            .replace(/\/Guest Lecture(?=\/)/g, '/Guest_Lecture')
            .replace(/\/Poster Making(?=\/)/g, '/Poster_Making')
            .replace(/\/Graduation Ceremony(?=\/)/g, '/Graduation_Ceremony')
            .replace(/\/Algoverse 2\.0(?=\/)/g, '/Algoverse_2.0');
    }

    // Data will be loaded from `data/studentzone.json`. Disable feature clicks until loaded.
    let data = {};
    if (featureGrid) featureGrid.classList.add('disabled');
    fetch('data/studentzone.json')
        .then(resp => resp.json())
        .then(json => {
            data = json;
            if (featureGrid) featureGrid.classList.remove('disabled');
            initFilters();
        })
        .catch(err => {
            console.warn('Unable to load data/studentzone.json', err);
            data = { mst_papers: [], end_sem_papers: [], subject_notes: [], study_material: [], subjects_by_semester: {} };
            if (featureGrid) featureGrid.classList.remove('disabled');
        });

    function clearSelection() {
        if (selectionArea) selectionArea.innerHTML = '';
    }

    function resetStudentZoneView() {
        if (filterSemester) filterSemester.value = '';
        if (filterPaperType) filterPaperType.value = '';
        populateSubjectOptions();
        if (filterSubject) filterSubject.value = '';

        const inlineResults = document.getElementById('searchResults');
        if (inlineResults) inlineResults.innerHTML = '';
        clearSelection();
    }

    function initFilters() {
        populateSubjectOptions();
        if (filterSemester) {
            filterSemester.addEventListener('change', populateSubjectOptions);
        }
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                performSearch();
            });
        }
    }

    function populateSubjectOptions() {
        if (!filterSubject || !filterSemester || !data.subjects_by_semester) return;
        const selectedSemester = filterSemester.value;
        const subjectList = selectedSemester ? (data.subjects_by_semester[selectedSemester] || []) : Array.from(new Set(Object.values(data.subjects_by_semester).flat()));
        const sortedSubjects = subjectList.slice();
        sortedSubjects.sort();
        filterSubject.innerHTML = '<option value="">All Subjects</option>';
        sortedSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            filterSubject.appendChild(option);
        });
    }

    function performSearch() {
        if (!selectionArea) return;
        const semesterValue = filterSemester ? filterSemester.value : '';
        const subjectValue = filterSubject ? filterSubject.value.trim() : '';
        const paperTypeValue = filterPaperType ? filterPaperType.value : '';
        const results = [];

        const addResults = (items, typeKey) => {
            items.forEach(item => {
                const matchesSemester = !semesterValue || String(item.semester) === semesterValue;
                const matchesSubject = !subjectValue || item.subject === subjectValue;
                const matchesType = !paperTypeValue || paperTypeValue === typeKey;
                if (matchesSemester && matchesSubject && matchesType) {
                    results.push({ ...item, resourceType: typeKey });
                }
            });
        };

        addResults(data.mst_papers || [], 'mst');
        addResults(data.end_sem_papers || [], 'endsem');
        addResults(data.subject_notes || [], 'notes');
        addResults(data.study_material || [], 'study');

        // Helper to render results into a given container
        function renderResultsInto(container, results, includeHeader) {
            if (!container) return;
            container.innerHTML = '';
            if (includeHeader) {
                const header = document.createElement('div'); header.className = 'step-header';
                header.innerHTML = `<div class="step-title">Search Results</div><button class="back-btn">Back</button>`;
                container.appendChild(header);
                header.querySelector('.back-btn').addEventListener('click', () => clearSelection());
            }

            const gridLocal = document.createElement('div'); gridLocal.className = 'cards-grid';
            if (results.length === 0) {
                const note = document.createElement('div'); note.className = 'resource-card event-card';
                note.innerHTML = '<p class="muted">No resources match your filter selections yet.</p>';
                gridLocal.appendChild(note);
            } else {
                results.forEach(item => {
                    const card = document.createElement('div'); card.className = 'resource-card event-card';
                    const title = item.title || item.subject || `${item.resourceType.toUpperCase()} Resource`;
                    const year = item.year ? `Year: ${item.year}` : item.unit ? item.unit : '';
                    const resourceLabel = item.resourceType === 'mst' ? item.type : item.resourceType === 'endsem' ? 'EndSem' : item.resourceType === 'notes' ? 'Notes' : 'Resource';
                    const resourceUrl = normalizeAssetPath(item.pdf_url || item.file_url || item.link || '#');
                    card.innerHTML = `<h4>${title}</h4><p class="muted">Semester ${item.semester} · ${item.subject} · ${resourceLabel}</p><p>${year}</p><p><a href="#" class="view-link">View</a> · <a href="${resourceUrl}" class="download-link" download>Download</a></p>`;
                    const view = card.querySelector('.view-link');
                    view.addEventListener('click', (e) => { e.preventDefault(); showPdf(resourceUrl, title); });
                    gridLocal.appendChild(card);
                });
            }
            container.appendChild(gridLocal);
        }

        // Render into the modal selection area and into inline results
        clearSelection();
        renderResultsInto(selectionArea, results, true);
        const inlineResults = document.getElementById('searchResults');
        renderResultsInto(inlineResults, results, false);

        // Open the selection overlay so results are visible
        if (typeof selectionOverlay !== 'undefined' && selectionOverlay) {
            selectionOverlay.classList.add('active');
            document.body.classList.add('dialog-open');
            const firstResult = selectionArea.querySelector('.cards-grid .resource-card, .cards-grid .resource-card .view-link');
            if (firstResult) {
                const focusable = firstResult.querySelector && (firstResult.querySelector('.view-link') || firstResult.querySelector('a') || firstResult.querySelector('button'));
                (focusable || firstResult).focus && (focusable || firstResult).focus();
            }
        }
    }

    function renderSubjects(feature, semester) {
        clearSelection();
        const header = document.createElement('div'); header.className = 'step-header';
        header.innerHTML = `<div class="step-title">Semester ${semester} — Select Subject</div><button class="back-btn">Back</button>`;
        selectionArea.appendChild(header);
        header.querySelector('.back-btn').addEventListener('click', () => renderSemesters(feature));

        const semesterSubjects = (data.subjects_by_semester && data.subjects_by_semester[semester]) ? data.subjects_by_semester[semester] : [];
        const subjects = Array.from(new Set(semesterSubjects));

        const grid = document.createElement('div'); grid.className = 'cards-grid';
        if (subjects.length === 0) {
            const note = document.createElement('div'); note.className='resource-card event-card'; note.innerHTML = '<p class="muted">No subjects found for this semester yet.</p>';
            grid.appendChild(note);
        } else {
            subjects.forEach(sub => {
                const card = document.createElement('div'); card.className='resource-card event-card';
                card.innerHTML = `<h4>${sub}</h4><p class="muted">Click to view available papers</p>`;
                card.addEventListener('click', () => renderPaperTypes(feature, semester, sub));
                grid.appendChild(card);
            });
        }
        selectionArea.appendChild(grid);
    }

    function renderPaperTypes(feature, semester, subject) {
        clearSelection();
        const header = document.createElement('div'); header.className = 'step-header';
        header.innerHTML = `<div class="step-title">${subject} — Choose Paper Type</div><button class="back-btn">Back</button>`;
        selectionArea.appendChild(header);
        header.querySelector('.back-btn').addEventListener('click', () => renderSubjects(feature, semester));

        const grid = document.createElement('div'); grid.className='cards-grid';
        if (feature === 'mst') {
            ['MST-I','MST-II'].forEach(t => {
                const card = document.createElement('div'); card.className='resource-card event-card';
                card.innerHTML = `<h4>${t}</h4><p class="muted">View years for ${subject}</p>`;
                card.addEventListener('click', () => renderYears(feature, semester, subject, t));
                grid.appendChild(card);
            });
        } else if (feature === 'endsem') {
            const card = document.createElement('div'); card.className='resource-card event-card';
            card.innerHTML = `<h4>End Semester</h4><p class="muted">View years for ${subject}</p>`;
            card.addEventListener('click', () => renderYears(feature, semester, subject, 'EndSem'));
            grid.appendChild(card);
        } else if (feature === 'notes') {
            const card = document.createElement('div'); card.className='resource-card event-card';
            card.innerHTML = `<h4>Notes</h4><p class="muted">View notes for ${subject}</p>`;
            card.addEventListener('click', () => renderYears(feature, semester, subject, 'Notes'));
            grid.appendChild(card);
        } else if (feature === 'study') {
            const card = document.createElement('div'); card.className='resource-card event-card';
            card.innerHTML = `<h4>Resources</h4><p class="muted">Books & Videos for ${subject}</p>`;
            card.addEventListener('click', () => renderYears(feature, semester, subject, 'Resources'));
            grid.appendChild(card);
        }

        selectionArea.appendChild(grid);
    }

    function renderYears(feature, semester, subject, paperType) {
        clearSelection();
        const header = document.createElement('div'); header.className = 'step-header';
        header.innerHTML = `<div class="step-title">${subject} — ${paperType} — Years</div><button class="back-btn">Back</button>`;
        selectionArea.appendChild(header);
        header.querySelector('.back-btn').addEventListener('click', () => renderPaperTypes(feature, semester, subject));

        const grid = document.createElement('div'); grid.className='cards-grid';
        let records = [];
        if (feature==='mst') records = data.mst_papers.filter(r => r.semester===semester && r.subject===subject && r.type===paperType);
        if (feature==='endsem') records = data.end_sem_papers.filter(r => r.semester===semester && r.subject===subject);
        if (feature==='notes') records = data.subject_notes.filter(r => r.semester===semester && r.subject===subject);
        if (feature==='study') records = data.study_material.filter(r => r.semester===semester && r.subject===subject);

        if (records.length===0) {
            const note = document.createElement('div'); note.className='resource-card event-card'; note.innerHTML = '<p class="muted">No files uploaded yet for the selected filters.</p>';
            grid.appendChild(note);
        } else {
            records.forEach(rec => {
                const card = document.createElement('div'); card.className='resource-card event-card';
                const year = rec.year || rec.unit || '';
                const title = rec.title || `${subject} ${paperType}`;
                const resourceUrl = normalizeAssetPath(rec.pdf_url || rec.file_url || rec.link || '#');
                card.innerHTML = `<h4>${title}</h4><p class="muted">${year}</p><p><a href="#" class="view-link">View</a> · <a href="${resourceUrl}" class="download-link" download>Download</a></p>`;
                const view = card.querySelector('.view-link');
                view.addEventListener('click', (e) => { e.preventDefault(); showPdf(resourceUrl, title); });
                grid.appendChild(card);
            });
        }

        selectionArea.appendChild(grid);
    }

    function showPdf(url, title) {
        if (!url) { alert('No PDF available yet for this resource.'); return; }
        url = normalizeAssetPath(url);
        pdfFrame.src = url;
        pdfModalTitle.textContent = title;
        pdfDownloadLink.href = url;
        pdfModal.style.display = 'flex';
    }

    function renderSemesters(feature) {
        clearSelection();
        const header = document.createElement('div'); header.className = 'step-header';
        header.innerHTML = `<div class="step-title">Select Semester</div><button class="back-btn">Back</button>`;
        selectionArea.appendChild(header);
        header.querySelector('.back-btn').addEventListener('click', () => { clearSelection(); });

        const grid = document.createElement('div'); grid.className = 'cards-grid';
        for (let s=1;s<=7;s++) {
            const card = document.createElement('div'); card.className = 'resource-card event-card';
            const subjects = (data.subjects_by_semester && data.subjects_by_semester[s]) ? data.subjects_by_semester[s] : [];
            const subjectText = subjects.length ? subjects.join(' · ') : 'Subjects not available yet';
            card.innerHTML = `<h4>Semester ${s}</h4><p class="muted">${subjectText}</p>`;
            card.addEventListener('click', () => renderSubjects(feature, s));
            grid.appendChild(card);
        }
        selectionArea.appendChild(grid);
    }

    const selectionOverlay = document.getElementById('selectionOverlay');
    const selectionClose = document.getElementById('selectionClose');

    if (featureGrid) {
        featureGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.feature-card');
            if (!card) return;
            const feature = card.getAttribute('data-feature');
            if (selectionOverlay) {
                selectionOverlay.classList.add('active');
                document.body.classList.add('dialog-open');
            }
            renderSemesters(feature);
        });
    }

    if (selectionClose && selectionOverlay) {
        selectionClose.addEventListener('click', () => {
            selectionOverlay.classList.remove('active');
            document.body.classList.remove('dialog-open');
            resetStudentZoneView();
        });
    }

    if (selectionOverlay) {
        selectionOverlay.addEventListener('click', (e) => {
            if (e.target === selectionOverlay) {
                selectionOverlay.classList.remove('active');
                document.body.classList.remove('dialog-open');
                resetStudentZoneView();
            }
        });
    }

    if (pdfModalClose) pdfModalClose.addEventListener('click', () => { document.getElementById('pdfFrame').src=''; pdfModal.style.display='none'; });
    if (pdfModal) pdfModal.addEventListener('click', (e) => { if (e.target===pdfModal) { document.getElementById('pdfFrame').src=''; pdfModal.style.display='none'; } });
}
