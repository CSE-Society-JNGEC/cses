// Function to switch visible sections seamlessly (Single Page Application Behavior)
function switchPage(pageId) {
    // Hide all page sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active-section');
    });

    // Remove active class styling from navigation buttons
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Display the specific target section
    document.getElementById(pageId).classList.add('active-section');

    // Add active styling to the clicked element link
    const activeEvent = window.event.currentTarget;
    if(activeEvent) {
        activeEvent.classList.add('active');
    }
}

// Function to handle the drop down accordion effects for Semesters & Question paper trees
function toggleAccordion(semId) {
    const targetContent = document.getElementById(semId);
    const headerSpan = targetContent.previousElementSibling.querySelector('span');

    if (targetContent.style.display === "block") {
        targetContent.style.display = "none";
        headerSpan.textContent = "▼";
    } else {
        targetContent.style.display = "block";
        headerSpan.textContent = "▲";
    }
}

// Function to intercept and mock submit student suggestions
function handleSuggestionSubmit(event) {
    event.preventDefault(); // Stop standard page reloading behaviour
    
    // Clear the entry field inputs
    document.getElementById('suggestionText').value = '';
    document.getElementById('studentName').value = '';

    // Show a success notice box
    const messageBox = document.getElementById('formSuccessMessage');
    messageBox.style.display = "block";

    // Hide notice box automatically after 4 seconds
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 4000);
}