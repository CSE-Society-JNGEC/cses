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

        // 1.8s hold time allows the cyber scan + typewriter "CSE Society" to complete smoothly
        const holdMs = 1750;
        setTimeout(() => {
            overlay.classList.add('splash-hide');
            // Allow CSS fade to finish before removing overlay and restoring scroll
            setTimeout(() => {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                resolve();
            }, 750);
        }, holdMs);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAccordions();
    initModalSystem();
    initGalleryModal();
    initFormHandlers();
    initStudentZone();
    initScrollReveal();
    runSplash().then(() => document.documentElement.classList.add('is-ready'));
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

// 1d. Gallery: category filters + lightbox + full gallery overlay
function initGalleryModal() {
    const allImages = Array.from(document.querySelectorAll('.gallery-img'));
    const modalOverlay = document.getElementById('galleryModalOverlay');
    const modalImg = document.getElementById('galleryModalImg');
    const modalCaption = document.getElementById('galleryModalCaption');
    const closeBtn = document.getElementById('galleryModalClose');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');
    const openFullGalleryBtn = document.getElementById('openFullGallery');
    const fullGalleryOverlay = document.getElementById('fullGalleryOverlay');
    const fullGalleryGrid = document.getElementById('fullGalleryGrid');
    const fullGalleryClose = document.getElementById('fullGalleryClose');

    if (!modalOverlay || !modalImg || !modalCaption || !closeBtn || !prevBtn || !nextBtn || !allImages.length) {
        return;
    }

    let currentImage = null;
    let lastFocus = null;

    // Category filter chips (only change which tiles are visible; nothing is removed)
    const chips = document.querySelectorAll('.gallery-chip');
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const filter = chip.getAttribute('data-filter');
            chips.forEach((c) => {
                const on = c === chip;
                c.classList.toggle('is-active', on);
                c.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            document.querySelectorAll('.gallery-tile').forEach((tile) => {
                tile.hidden = !(filter === 'all' || tile.getAttribute('data-cat') === filter);
            });
        });
    });

    const visibleImages = () => allImages.filter((img) => {
        const tile = img.closest('.gallery-tile');
        return !tile || !tile.hidden;
    });

    // Full gallery (all images, with download links) - unchanged behaviour
    if (openFullGalleryBtn && fullGalleryOverlay && fullGalleryGrid && fullGalleryClose) {
        allImages.forEach((sourceImage) => {
            const item = document.createElement('article');
            const image = document.createElement('img');
            const caption = document.createElement('p');
            const download = document.createElement('a');
            const imageUrl = sourceImage.currentSrc || sourceImage.src;
            const fileName = decodeURIComponent(new URL(imageUrl, location.href).pathname.split('/').pop());

            item.className = 'full-gallery-item';
            image.src = imageUrl;
            image.alt = sourceImage.alt || 'Gallery image';
            image.loading = 'lazy';
            caption.className = 'full-gallery-caption';
            caption.textContent = sourceImage.alt || fileName;
            download.className = 'full-gallery-download';
            download.href = imageUrl;
            download.download = fileName;
            download.textContent = 'Download';

            item.append(image, caption, download);
            fullGalleryGrid.appendChild(item);
        });

        const closeFullGallery = () => {
            fullGalleryOverlay.classList.remove('active');
            document.body.classList.remove('dialog-open');
            openFullGalleryBtn.focus();
        };
        openFullGalleryBtn.addEventListener('click', () => {
            fullGalleryOverlay.classList.add('active');
            document.body.classList.add('dialog-open');
            fullGalleryClose.focus();
        });
        fullGalleryClose.addEventListener('click', closeFullGallery);
        fullGalleryOverlay.addEventListener('click', (event) => {
            if (event.target === fullGalleryOverlay) closeFullGallery();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && fullGalleryOverlay.classList.contains('active')) closeFullGallery();
        });
    }

    function openModal(img) {
        if (!img) return;
        currentImage = img;
        modalImg.src = img.currentSrc || img.src;
        modalImg.alt = img.alt || 'Gallery image';
        modalImg.decoding = 'async';
        modalCaption.textContent = img.alt || 'Gallery image';
        if (!modalOverlay.classList.contains('active')) lastFocus = document.activeElement;
        modalOverlay.classList.add('active');
        document.body.classList.add('dialog-open');
        closeBtn.focus({ preventScroll: true });
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.classList.remove('dialog-open');
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function step(delta) {
        const list = visibleImages();
        if (!list.length) return;
        const i = Math.max(0, list.indexOf(currentImage));
        openModal(list[(i + delta + list.length) % list.length]);
    }

    allImages.forEach((img) => {
        img.addEventListener('click', () => openModal(img));
        // Keyboard access: tiles are focusable buttons-in-spirit
        const tile = img.closest('.gallery-tile');
        if (tile) {
            tile.tabIndex = 0;
            tile.setAttribute('role', 'button');
            tile.setAttribute('aria-label', 'Open photo: ' + (img.alt || 'Gallery image'));
            tile.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(img); }
            });
            tile.addEventListener('click', (e) => { if (e.target === tile) openModal(img); });
        }
    });

    closeBtn.addEventListener('click', closeModal);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    document.addEventListener('keydown', (e) => {
        if (!modalOverlay.classList.contains('active')) return;
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'Escape') closeModal();
    });
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
    // Event registry lives in data/events-data.js (shared with the Smart Assistant)
    const eventDatabase = window.CSES_EVENTS || {};

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

    // Public hooks (used by the Smart Assistant and by ?event= deep links)
    window.CSES = window.CSES || {};
    window.CSES.openEvent = (key) => { openEventModal(key); return !!eventDatabase[key]; };
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
            modalOverlay.style.display = 'none';
        }
    });
    const deepLinkedEvent = new URLSearchParams(location.search).get('event');
    if (deepLinkedEvent && eventDatabase[deepLinkedEvent]) {
        const card = document.querySelector('.event-card[data-event="' + deepLinkedEvent + '"]');
        if (card) card.scrollIntoView({ block: 'center' });
        openEventModal(deepLinkedEvent);
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
    const paperImagePreview = document.getElementById('paperImagePreview');
    const resourceStatus = document.getElementById('resourceStatus');

    function normalizeAssetPath(path) {
        if (!path) return path;
        // Never modify external absolute URLs (such as Google Drive or cloud links)
        if (/^https?:\/\//i.test(path)) return path;
        return path
            .replace(/\/Semester ([1-7])(?=\/)/g, '/Semester_$1')
            .replace(/\/Teacher Day(?=\/)/g, '/Teacher_Day')
            .replace(/\/Guest Lecture(?=\/)/g, '/Guest_Lecture')
            .replace(/\/Poster Making(?=\/)/g, '/Poster_Making')
            .replace(/\/Graduation Ceremony(?=\/)/g, '/Graduation_Ceremony')
            .replace(/\/Algoverse 2\.0(?=\/)/g, '/Algoverse_2.0');
    }

    function isGoogleDriveUrl(url) {
        return typeof url === 'string' && /drive\.google\.com/i.test(url);
    }

    let data = { mst_papers: [], end_sem_papers: [], subject_notes: [], study_material: [], subjects_by_semester: {} };
    if (featureGrid) featureGrid.classList.add('disabled');
    fetch('data/studentzone.json')
        .then(resp => {
            if (!resp.ok) throw new Error(`Local resource index returned ${resp.status}`);
            return resp.json();
        })
        .then(json => {
            data = json;
            if (featureGrid) featureGrid.classList.remove('disabled');
            initFilters();
            setResourceStatus('Showing local resources.', 'success');
            applyUrlParams();
        })
        .catch(err => {
            console.warn('Unable to load data/studentzone.json', err);
            if (featureGrid) featureGrid.classList.remove('disabled');
            initFilters();
            setResourceStatus('Local resources could not be loaded.', 'error');
        });

    // Deep links from the Smart Assistant: ?sem=3&subject=Python&type=mst&run=1  or  ?open=<known resource path>
    function applyUrlParams() {
        const p = new URLSearchParams(location.search);
        if (![...p.keys()].length) return;
        if (filterSemester && p.get('sem')) { filterSemester.value = p.get('sem'); populateSubjectOptions(); }
        if (filterSubject && p.get('subject')) filterSubject.value = p.get('subject');
        if (filterPaperType && p.get('type')) filterPaperType.value = p.get('type');
        const wanted = p.get('open');
        if (wanted) {
            // Only open files that exist in the resource index (never arbitrary URLs)
            const all = [...(data.mst_papers || []), ...(data.end_sem_papers || []), ...(data.subject_notes || []), ...(data.study_material || [])];
            const rec = all.find(r => (r.pdf_url || r.file_url || r.link) === wanted);
            if (rec) {
                const url = normalizeAssetPath(wanted);
                showPdf(url, p.get('title') || rec.title || rec.subject, downloadUrlFor(url), rec.file_type);
                return;
            }
        }
        if (p.get('run') === '1') performSearch();
    }

    function setResourceStatus(message, state) {
        if (!resourceStatus) return;
        resourceStatus.textContent = message;
        resourceStatus.dataset.state = state;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function downloadUrlFor(url) {
        if (!url || url === '#') return '#';
        const target = new URL(url, window.location.href);
        if (target.origin !== window.location.origin) {
            target.searchParams.set('download', target.pathname.split('/').pop());
        }
        return target.href;
    }

    function closeResourcePreview() {
        if (pdfFrame) pdfFrame.src = '';
        if (paperImagePreview) paperImagePreview.src = '';
        if (pdfModal) pdfModal.style.display = 'none';
    }

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
                    const rawUrl = item.pdf_url || item.file_url || item.link || '#';
                    const isDrive = isGoogleDriveUrl(rawUrl);
                    const resourceUrl = isDrive ? rawUrl : normalizeAssetPath(rawUrl);
                    const downloadUrl = isDrive ? rawUrl : downloadUrlFor(resourceUrl);
                    const fileName = resourceUrl.split('/').pop().split('?')[0];

                    if (isDrive) {
                        card.innerHTML = `<h4>${escapeHtml(title)}</h4><p class="muted">Semester ${escapeHtml(item.semester)} · ${escapeHtml(item.subject)} · ${escapeHtml(resourceLabel)}</p><p>${escapeHtml(year)}</p><p><a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer" class="view-link drive-link">Open in Google Drive ↗</a></p>`;
                        const view = card.querySelector('.view-link');
                        view.addEventListener('click', (e) => {
                            e.stopPropagation();
                            window.open(rawUrl, '_blank', 'noopener,noreferrer');
                        });
                        card.style.cursor = 'pointer';
                        card.addEventListener('click', (e) => {
                            if (e.target.tagName.toLowerCase() !== 'a') {
                                window.open(rawUrl, '_blank', 'noopener,noreferrer');
                            }
                        });
                    } else {
                        card.innerHTML = `<h4>${escapeHtml(title)}</h4><p class="muted">Semester ${escapeHtml(item.semester)} · ${escapeHtml(item.subject)} · ${escapeHtml(resourceLabel)}</p><p>${escapeHtml(year)}</p><p><a href="#" class="view-link">View</a> · <a href="${escapeHtml(downloadUrl)}" class="download-link" download="${escapeHtml(fileName)}">Download</a></p>`;
                        const view = card.querySelector('.view-link');
                        view.addEventListener('click', (e) => { e.preventDefault(); showPdf(resourceUrl, title, downloadUrl, item.file_type); });
                    }
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
            const note = document.createElement('div'); note.className = 'resource-card event-card'; note.innerHTML = '<p class="muted">No subjects found for this semester yet.</p>';
            grid.appendChild(note);
        } else {
            subjects.forEach(sub => {
                const card = document.createElement('div'); card.className = 'resource-card event-card';
                card.innerHTML = `<h4>${escapeHtml(sub)}</h4><p class="muted">Click to view available papers</p>`;
                card.addEventListener('click', () => renderPaperTypes(feature, semester, sub));
                grid.appendChild(card);
            });
        }
        selectionArea.appendChild(grid);
    }

    function renderPaperTypes(feature, semester, subject) {
        clearSelection();
        const header = document.createElement('div'); header.className = 'step-header';
        header.innerHTML = `<div class="step-title">${escapeHtml(subject)} — Choose Paper Type</div><button class="back-btn">Back</button>`;
        selectionArea.appendChild(header);
        header.querySelector('.back-btn').addEventListener('click', () => renderSubjects(feature, semester));

        const grid = document.createElement('div'); grid.className = 'cards-grid';
        if (feature === 'mst') {
            ['MST-I', 'MST-II'].forEach(t => {
                const card = document.createElement('div'); card.className = 'resource-card event-card';
                card.innerHTML = `<h4>${t}</h4><p class="muted">View years for ${subject}</p>`;
                card.addEventListener('click', () => renderYears(feature, semester, subject, t));
                grid.appendChild(card);
            });
        } else if (feature === 'endsem') {
            const card = document.createElement('div'); card.className = 'resource-card event-card';
            card.innerHTML = `<h4>End Semester</h4><p class="muted">View years for ${subject}</p>`;
            card.addEventListener('click', () => renderYears(feature, semester, subject, 'EndSem'));
            grid.appendChild(card);
        } else if (feature === 'notes') {
            const card = document.createElement('div'); card.className = 'resource-card event-card';
            card.innerHTML = `<h4>Notes</h4><p class="muted">View notes for ${subject}</p>`;
            card.addEventListener('click', () => renderYears(feature, semester, subject, 'Notes'));
            grid.appendChild(card);
        } else if (feature === 'study') {
            const card = document.createElement('div'); card.className = 'resource-card event-card';
            card.innerHTML = `<h4>Resources</h4><p class="muted">Books & Videos for ${subject}</p>`;
            card.addEventListener('click', () => renderYears(feature, semester, subject, 'Resources'));
            grid.appendChild(card);
        }

        selectionArea.appendChild(grid);
    }

    function renderYears(feature, semester, subject, paperType) {
        clearSelection();
        const header = document.createElement('div'); header.className = 'step-header';
        header.innerHTML = `<div class="step-title">${escapeHtml(subject)} — ${escapeHtml(paperType)} — Years</div><button class="back-btn">Back</button>`;
        selectionArea.appendChild(header);
        header.querySelector('.back-btn').addEventListener('click', () => renderPaperTypes(feature, semester, subject));

        const grid = document.createElement('div'); grid.className = 'cards-grid';
        let records = [];
        if (feature === 'mst') records = data.mst_papers.filter(r => r.semester === semester && r.subject === subject && r.type === paperType);
        if (feature === 'endsem') records = data.end_sem_papers.filter(r => r.semester === semester && r.subject === subject);
        if (feature === 'notes') records = data.subject_notes.filter(r => r.semester === semester && r.subject === subject);
        if (feature === 'study') records = data.study_material.filter(r => r.semester === semester && r.subject === subject);

        if (records.length === 0) {
            const note = document.createElement('div'); note.className = 'resource-card event-card'; note.innerHTML = '<p class="muted">No files uploaded yet for the selected filters.</p>';
            grid.appendChild(note);
        } else {
            records.forEach(rec => {
                const card = document.createElement('div'); card.className = 'resource-card event-card';
                const year = rec.year || rec.unit || '';
                const title = rec.title || `${subject} ${paperType}`;
                const rawUrl = rec.pdf_url || rec.file_url || rec.link || '#';
                const isDrive = isGoogleDriveUrl(rawUrl);
                const resourceUrl = isDrive ? rawUrl : normalizeAssetPath(rawUrl);
                const downloadUrl = isDrive ? rawUrl : downloadUrlFor(resourceUrl);
                const fileName = resourceUrl.split('/').pop().split('?')[0];

                if (isDrive) {
                    card.innerHTML = `<h4>${escapeHtml(title)}</h4><p class="muted">${escapeHtml(year)}</p><p><a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer" class="view-link drive-link">Open in Google Drive ↗</a></p>`;
                    const view = card.querySelector('.view-link');
                    view.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.open(rawUrl, '_blank', 'noopener,noreferrer');
                    });
                    // Clicking anywhere on the study material card directly opens the Google Drive folder or PDF
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', (e) => {
                        if (e.target.tagName.toLowerCase() !== 'a') {
                            window.open(rawUrl, '_blank', 'noopener,noreferrer');
                        }
                    });
                } else {
                    card.innerHTML = `<h4>${escapeHtml(title)}</h4><p class="muted">${escapeHtml(year)}</p><p><a href="#" class="view-link">View</a> · <a href="${escapeHtml(downloadUrl)}" class="download-link" download="${escapeHtml(fileName)}">Download</a></p>`;
                    const view = card.querySelector('.view-link');
                    view.addEventListener('click', (e) => { e.preventDefault(); showPdf(resourceUrl, title, downloadUrl, rec.file_type); });
                }
                grid.appendChild(card);
            });
        }

        selectionArea.appendChild(grid);
    }

    function showPdf(url, title, downloadUrl, contentType) {
        if (!url) { alert('No PDF available yet for this resource.'); return; }
        if (isGoogleDriveUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        url = normalizeAssetPath(url);
        const isImage = (contentType || '').startsWith('image/') || /\.(jpe?g|png|webp)(?:[?#]|$)/i.test(url);
        if (pdfFrame) {
            pdfFrame.hidden = isImage;
            pdfFrame.src = isImage ? '' : url;
        }
        if (paperImagePreview) {
            paperImagePreview.hidden = !isImage;
            paperImagePreview.src = isImage ? url : '';
            paperImagePreview.alt = title || 'Scanned paper preview';
        }
        pdfModalTitle.textContent = title;
        pdfDownloadLink.href = downloadUrl || downloadUrlFor(url);
        pdfDownloadLink.download = url.split('/').pop().split('?')[0];
        pdfDownloadLink.textContent = isImage ? 'Download image' : 'Download PDF';
        pdfModal.style.display = 'flex';
    }

    function renderSemesters(feature) {
        clearSelection();
        const header = document.createElement('div'); header.className = 'step-header';
        header.innerHTML = `<div class="step-title">Select Semester</div><button class="back-btn">Back</button>`;
        selectionArea.appendChild(header);
        header.querySelector('.back-btn').addEventListener('click', () => { clearSelection(); });

        const grid = document.createElement('div'); grid.className = 'cards-grid';
        for (let s = 1; s <= 7; s++) {
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

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (pdfModal && pdfModal.style.display === 'flex') closeResourcePreview();
        else if (selectionOverlay && selectionOverlay.classList.contains('active')) {
            selectionOverlay.classList.remove('active');
            document.body.classList.remove('dialog-open');
            resetStudentZoneView();
        }
    });

    if (pdfModalClose) pdfModalClose.addEventListener('click', closeResourcePreview);
    if (pdfModal) pdfModal.addEventListener('click', (e) => { if (e.target === pdfModal) closeResourcePreview(); });
}
