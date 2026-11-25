/**
 * CSES shared event registry.
 * Single source of truth for event details. Used by the Events page (cards + detail
 * modal) AND by the Smart Assistant search. Add or edit events here; both update.
 * Keys must match the data-event attribute on each card in events.html.
 */
window.CSES_EVENTS = {
teachersDay: {
    title: "Teacher's Day Celebration",
    meta: "5 September 2026 | 12:30 PM | Cultural Event",
    desc: "A heartfelt celebration dedicated to honoring our faculty for their guidance, dedication, and invaluable contribution, featuring performances, speeches, and engaging activities.",
    poster: "Photos/Events/Teacher_Day/0.jpg",
    team: "Cultural Committee | Shivangi Ranout |Sheetal Bisht |Mannat",
    photos: [
        "Photos/Events/Teacher_Day/1.jpeg",
        "Photos/Events/Teacher_Day/2.jpeg",
        "Photos/Events/Teacher_Day/3.jpeg",
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
