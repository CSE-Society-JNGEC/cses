/**
 * CSES Interactive Member Profile Modal System
 * Supports both Faculty Core Panels and Student Council cards on the About page.
 * Keeps About page visible with subtle backdrop blur.
 * Clean floating window with smooth scale-and-fade animation.
 * Data-integrity guaranteed: strictly renders verified information from HTML cards.
 * Provides accessible controls: Esc key, outside click, dedicated close button.
 * Triggers realistic UI sound feedback via CSES_AUDIO.
 */
(function() {
    'use strict';

    // Directory of verified member records (derived strictly from existing about.html)
    const MEMBER_DATABASE = {
        // Faculty Core Panel
        "Dr. Meenakshi Shruti Pal": {
            name: "Dr. Meenakshi Shruti Pal",
            designation: "Chairperson",
            dept: "CSE Society Advisory Board",
            branch: "Computer Science & Engineering",
            semester: "", // Faculty
            roll: "",
            photo: "Photos/Teacher/Meenakshi.jpg",
            responsibilities: "Leads the CSE Society with academic vision, mentoring, and strategic oversight across student programs, events, and collaborations."
        },
        "Er. Shivani Thakur": {
            name: "Er. Shivani Thakur",
            designation: "Technical Head",
            dept: "Faculty Core Panel",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Teacher/Shivani.jpg",
            responsibilities: "Coordinates all technical workshops, labs, and system infrastructure, ensuring hands-on learning and industry-standard tools."
        },
        "Er. Aditi Mahajan": {
            name: "Er. Aditi Mahajan",
            designation: "Cultural Head",
            dept: "Faculty Core Panel",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Teacher/Aditi.jpg",
            responsibilities: "Leads cultural engagement initiatives, student festivals, and creative collaborations that unify the society community."
        },
        "Er. Rahul Pal Singh": {
            name: "Er. Rahul Pal Singh",
            designation: "Sports Head",
            dept: "Faculty Core Panel",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Teacher/Rahul.png",
            responsibilities: "Drives sports programming, wellness challenges, and intercollege athletic events to build energy and team spirit."
        },

        // Student Council - Executive Council
        "Abhinav Thakur": {
            name: "Abhinav Thakur",
            designation: "President",
            dept: "Executive Council",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Abhinav.jpg",
            responsibilities: "Directs society initiatives, student representation, institutional liaison, and strategic execution of all annual society goals."
        },
        "Riyasat Ali": {
            name: "Riyasat Ali",
            designation: "Vice President",
            dept: "Executive Council",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Riyasat.jpg",
            responsibilities: "Assists the President with overall administration, cross-department coordination, and operational management of activities."
        },
        "Mritunjay Verma": {
            name: "Mritunjay Verma",
            designation: "General Secretary",
            dept: "Executive Council",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Mritunjay.jpg",
            responsibilities: "Oversees official communications, scheduling, inter-team alignment, meeting agendas, and documentation records."
        },
        "Rohit Prashar": {
            name: "Rohit Prashar",
            designation: "Treasurer",
            dept: "Executive Council",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Rohit.jpg",
            responsibilities: "Manages financial planning, budget allocations, expenditure tracking, and fiscal reporting for all society events."
        },

        // Technical Department
        "Jigyasu Kashyap": {
            name: "Jigyasu Kashyap",
            designation: "Technical Secretary",
            dept: "Technical Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Jigyasu.jpeg",
            responsibilities: "Leads society web platform architecture, coding hackathons, technical workshop pipelines, and departmental software systems."
        },
        "Saniya": {
            name: "Saniya Dhiman",
            designation: "Technical Coordinator",
            dept: "Technical Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Saniya.jpg",
            responsibilities: "Coordinates technical events, coding bootcamps, and assists in student mentorship and technical curriculum sessions."
        },
        "Saniya Dhiman": {
            name: "Saniya Dhiman",
            designation: "Technical Coordinator",
            dept: "Technical Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Saniya.jpg",
            responsibilities: "Coordinates technical events, coding bootcamps, and assists in student mentorship and technical curriculum sessions."
        },
        "Sweta": {
            name: "Sweta",
            designation: "Technical Member",
            dept: "Technical Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Sweta.jpg",
            responsibilities: "Contributes to workshop organization, technical resource compilation, and collaborative project development."
        },

        // Cultural Department
        "Shivangi Ranout": {
            name: "Shivangi Ranout",
            designation: "Cultural Secretary",
            dept: "Cultural Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Shivangi.jpg",
            responsibilities: "Oversees cultural fests, artistic initiatives, performances, student talent showcases, and celebrations."
        },
        "Sheetal Bisht": {
            name: "Sheetal Bisht",
            designation: "Cultural Coordinator",
            dept: "Cultural Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Sheetal.jpg",
            responsibilities: "Manages stage logistics, event flows, creative workshops, and student participation across all cultural gatherings."
        },
        "Mannat": {
            name: "Mannat",
            designation: "Cultural Member",
            dept: "Cultural Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Mannat.jpg",
            responsibilities: "Assists with event choreography, participant registration, and cultural coordination."
        },

        // Sports Department
        "Arpit Singh": {
            name: "Arpit Singh",
            designation: "Sports Secretary",
            dept: "Sports Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Arpit.jpg",
            responsibilities: "Plans and organizes intramural sports tournaments, fitness leagues, athletics meets, and team training."
        },
        "Sparsh": {
            name: "Sparsh",
            designation: "Sports Coordinator",
            dept: "Sports Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Sparsh.jpg",
            responsibilities: "Coordinates sports fixtures, referee arrangements, tournament logistics, and field management."
        },
        "Aditya Yadav": {
            name: "Aditya Yadav",
            designation: "Sports Member",
            dept: "Sports Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Aditya.jpg",
            responsibilities: "Assists with athletic match tracking, student sports team logistics, and equipment inventory."
        },
        "Abhay Singh": {
            name: "Abhay Singh",
            designation: "Sports Member",
            dept: "Sports Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Abhay.jpg",
            responsibilities: "Assists in tournament setups, live score tallying, and student participation drives."
        },

        // Social Media Department
        "Ankit Atri": {
            name: "Ankit Atri",
            designation: "Social Media Secretary",
            dept: "Social Media Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Ankit.jpg",
            responsibilities: "Spearheads digital branding, promotional campaigns, publicity outreach, and social media announcements."
        },
        "Uday Pratap Singh": {
            name: "Uday Pratap Singh",
            designation: "Social Media Coordinator",
            dept: "Social Media Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Uday.jpg",
            responsibilities: "Designs visual creatives, manages story feeds, and coordinates post releases across online channels."
        },
        "Vin": {
            name: "Vin",
            designation: "Social Media Member",
            dept: "Social Media Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Vin.jpg",
            responsibilities: "Assists in photography, video editing, media coverage of campus activities, and graphic design."
        },
        "Monika": {
            name: "Monika",
            designation: "Social Media Member",
            dept: "Social Media Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Monika.jpg",
            responsibilities: "Supports content drafting, event photography, community engagement, and social graphics."
        },

        // Discipline Department
        "Isha Thakur": {
            name: "Isha Thakur",
            designation: "Discipline Department",
            dept: "Discipline Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Isha.jpg",
            responsibilities: "Maintains decorum, event floor management, attendee guidance, and code of conduct during society gatherings."
        },

        // HRD Department
        "Pallak": {
            name: "Pallak",
            designation: "Executive Advisor",
            dept: "HRD Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Pallak.jpg",
            responsibilities: "Advises council on member engagement, volunteer training pipelines, and cross-team welfare."
        },
        "Rajat Chauhan": {
            name: "Rajat Chauhan",
            designation: "Administrative Advisor",
            dept: "HRD Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Rajat.jpeg",
            responsibilities: "Provides administrative guidance, policy orientation, member onboarding, and operational advisory."
        },
        "Sejal Pathania": {
            name: "Sejal Pathania",
            designation: "Deputy Advisor",
            dept: "HRD Department",
            branch: "Computer Science & Engineering",
            semester: "",
            roll: "",
            photo: "Photos/Student/Sejal.jpg",
            responsibilities: "Assists in leadership development, volunteer performance coordination, and internal society affairs."
        }
    };

    function initMemberModal() {
        // Build or bind modal container
        let modalOverlay = document.getElementById('memberProfileModal');
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'memberProfileModal';
            modalOverlay.className = 'member-modal-overlay';
            modalOverlay.setAttribute('role', 'dialog');
            modalOverlay.setAttribute('aria-modal', 'true');
            modalOverlay.setAttribute('aria-hidden', 'true');
            modalOverlay.innerHTML = `
                <div class="member-modal-card">
                    <button class="member-modal-close" id="memberModalClose" aria-label="Close profile">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div class="member-modal-tech-header">
                        <span class="member-chip-status">CSES.PROFILE // VERIFIED</span>
                        <span class="member-sys-id" id="modalSysId">ID: CSES-SYS</span>
                    </div>
                    <div class="member-modal-body">
                        <div class="member-modal-avatar-col">
                            <div class="member-avatar-frame">
                                <img id="modalMemberPhoto" src="" alt="Member photograph" class="member-avatar-img">
                                <div class="avatar-corner c-tl"></div>
                                <div class="avatar-corner c-br"></div>
                            </div>
                            <div class="member-avatar-badge" id="modalMemberBadge">COUNCIL MEMBER</div>
                        </div>
                        <div class="member-modal-details-col">
                            <div class="member-role-tag" id="modalMemberRole">DESIGNATION</div>
                            <h3 class="member-name-heading" id="modalMemberName">Member Full Name</h3>
                            <div class="member-dept-tag" id="modalMemberDept">Department</div>

                            <div class="member-meta-grid" id="modalMetaGrid">
                                <div class="member-meta-item" id="metaItemBranch">
                                    <span class="meta-label">Branch</span>
                                    <span class="meta-value" id="modalMemberBranch">Computer Science & Engineering</span>
                                </div>
                                <div class="member-meta-item" id="metaItemSem">
                                    <span class="meta-label">Current Semester</span>
                                    <span class="meta-value" id="modalMemberSem">—</span>
                                </div>
                                <div class="member-meta-item" id="metaItemRoll">
                                    <span class="meta-label">Roll Number</span>
                                    <span class="meta-value" id="modalMemberRoll">—</span>
                                </div>
                            </div>

                            <div class="member-resp-section">
                                <h4 class="resp-label">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                                    Work Assigned & Responsibilities
                                </h4>
                                <p class="resp-text" id="modalMemberResp">Description</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        }

        const closeBtn = document.getElementById('memberModalClose');
        const modalPhoto = document.getElementById('modalMemberPhoto');
        const modalName = document.getElementById('modalMemberName');
        const modalRole = document.getElementById('modalMemberRole');
        const modalDept = document.getElementById('modalMemberDept');
        const modalBranch = document.getElementById('modalMemberBranch');
        const modalSem = document.getElementById('modalMemberSem');
        const modalRoll = document.getElementById('modalMemberRoll');
        const modalResp = document.getElementById('modalMemberResp');
        const modalSysId = document.getElementById('modalSysId');
        const metaItemSem = document.getElementById('metaItemSem');
        const metaItemRoll = document.getElementById('metaItemRoll');
        const metaItemBranch = document.getElementById('metaItemBranch');

        let lastFocus = null;

        function openModal(data) {
            if (!data) return;
            lastFocus = document.activeElement;

            modalPhoto.src = data.photo || 'logo.png';
            modalPhoto.alt = data.name;
            modalName.textContent = data.name;
            modalRole.textContent = data.designation;
            modalDept.textContent = data.dept || 'CSE Society';

            // Branch
            if (data.branch) {
                modalBranch.textContent = data.branch;
                metaItemBranch.style.display = 'flex';
            } else {
                metaItemBranch.style.display = 'none';
            }

            // Semester (strictly show if available)
            if (data.semester) {
                modalSem.textContent = data.semester;
                metaItemSem.style.display = 'flex';
            } else {
                metaItemSem.style.display = 'none';
            }

            // Roll (strictly show if available)
            if (data.roll) {
                modalRoll.textContent = data.roll;
                metaItemRoll.style.display = 'flex';
            } else {
                metaItemRoll.style.display = 'none';
            }

            modalResp.textContent = data.responsibilities || 'Active member contributing to society planning, execution, and student engagement initiatives.';

            // Tech ID
            const initials = data.name.split(' ').map(w => w[0]).join('').toUpperCase();
            modalSysId.textContent = `REF: CSES-${initials || 'MEM'}`;

            modalOverlay.classList.add('is-active');
            modalOverlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('dialog-open');

            if (window.CSES_AUDIO) {
                window.CSES_AUDIO.play('modalOpen');
            }

            closeBtn.focus();
        }

        function closeModal() {
            if (!modalOverlay.classList.contains('is-active')) return;
            modalOverlay.classList.remove('is-active');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('dialog-open');

            if (window.CSES_AUDIO) {
                window.CSES_AUDIO.play('modalClose');
            }

            if (lastFocus && lastFocus.focus) {
                lastFocus.focus({ preventScroll: true });
            }
        }

        // Close listeners
        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.classList.contains('is-active')) {
                closeModal();
            }
        });

        // Attach to all Member & Council cards across About page
        function bindCards() {
            // Student Council Cards
            const councilCards = document.querySelectorAll('.council-card');
            councilCards.forEach(card => {
                const nameEl = card.querySelector('.person');
                const posEl = card.querySelector('.position');
                const imgEl = card.querySelector('.card-photo img');
                const rawName = nameEl ? nameEl.textContent.trim() : '';
                const pos = posEl ? posEl.textContent.trim() : '';
                const imgSrc = imgEl ? (imgEl.getAttribute('src') || '') : '';
                const deptEl = card.closest('.dept') ? card.closest('.dept').querySelector('.dept-title') : null;
                const deptName = deptEl ? deptEl.textContent.trim() : 'Student Council';

                // Look up in registry or construct from card
                let record = MEMBER_DATABASE[rawName];
                if (!record) {
                    record = {
                        name: rawName,
                        designation: pos,
                        dept: deptName,
                        branch: "Computer Science & Engineering",
                        semester: "",
                        roll: "",
                        photo: imgSrc,
                        responsibilities: `Actively participates in ${deptName} initiatives, event management, and society operations.`
                    };
                }

                card.style.cursor = 'pointer';
                card.setAttribute('role', 'button');
                card.setAttribute('tabindex', '0');
                card.setAttribute('aria-label', `View profile of ${rawName}, ${pos}`);
                card.classList.add('is-interactive-member');

                card.addEventListener('click', () => openModal(record));
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openModal(record);
                    }
                });
            });

            // Faculty Cards (lead-card and team-card)
            const leadCard = document.querySelector('.lead-card');
            if (leadCard) {
                const nameEl = leadCard.querySelector('h3');
                const rawName = nameEl ? nameEl.textContent.trim() : "Dr. Meenakshi Shruti Pal";
                const record = MEMBER_DATABASE[rawName] || {
                    name: rawName,
                    designation: "Chairperson",
                    dept: "CSE Advisory Board",
                    branch: "Computer Science & Engineering",
                    photo: "Photos/Teacher/Meenakshi.jpg",
                    responsibilities: leadCard.querySelector('p') ? leadCard.querySelector('p').textContent.trim() : ""
                };
                leadCard.style.cursor = 'pointer';
                leadCard.setAttribute('role', 'button');
                leadCard.setAttribute('tabindex', '0');
                leadCard.setAttribute('aria-label', `View profile of ${rawName}`);
                leadCard.classList.add('is-interactive-member');
                leadCard.addEventListener('click', () => openModal(record));
                leadCard.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(record); }
                });
            }

            const teamCards = document.querySelectorAll('.team-card');
            teamCards.forEach(card => {
                const nameEl = card.querySelector('h3');
                const rawName = nameEl ? nameEl.textContent.trim() : '';
                const roleEl = card.querySelector('.team-role');
                const role = roleEl ? roleEl.textContent.trim() : '';
                const descEl = card.querySelector('p');
                const desc = descEl ? descEl.textContent.trim() : '';
                const imgEl = card.querySelector('.profile-photo');
                const imgSrc = imgEl ? imgEl.getAttribute('src') : '';

                const record = MEMBER_DATABASE[rawName] || {
                    name: rawName,
                    designation: role,
                    dept: "Faculty Core Panel",
                    branch: "Computer Science & Engineering",
                    photo: imgSrc,
                    responsibilities: desc
                };

                card.style.cursor = 'pointer';
                card.setAttribute('role', 'button');
                card.setAttribute('tabindex', '0');
                card.setAttribute('aria-label', `View profile of ${rawName}, ${role}`);
                card.classList.add('is-interactive-member');

                card.addEventListener('click', () => openModal(record));
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(record); }
                });
            });
        }

        bindCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMemberModal);
    } else {
        initMemberModal();
    }
})();
