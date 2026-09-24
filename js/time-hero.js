const video = document.querySelector("#time-video");
const timeState = document.querySelector("#time-state");
const currentTime = document.querySelector("#current-time");
const heroTitle = document.querySelector("#hero-title");
const heroDescription = document.querySelector("#hero-description");
const hero = document.querySelector("#time-hero");

const states = {
    sunrise: {
        name: "SUNRISE",
        title: "Good morning,<br>choose your flower.",
        description: "A fresh start deserves something alive."
    },
    day: {
        name: "DAY",
        title: "Flowers,<br>what the world needs.",
        description: "Find the flower that fits your moment."
    },
    sunset: {
        name: "SUNSET",
        title: "Golden hour,<br>send something beautiful.",
        description: "Some flowers are meant for moments like this."
    },
    evening: {
        name: "EVENING",
        title: "The sun is going down,<br>flowers stay.",
        description: "Choose something beautiful for tonight."
    },
    night: {
        name: "NIGHT",
        title: "Still awake?<br>Flowers don't sleep.",
        description: "For the moments that happen after midnight."
    }
};

function getState(hour) {
    if (hour >= 0 && hour < 5) return "night";
    if (hour >= 5 && hour < 7) return "sunrise";
    if (hour >= 7 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "sunset";
    if (hour >= 20 && hour < 23) return "evening";
    return "night";
}

function getVideoTime(hour, minute, second) {
    const time = hour * 3600 + minute * 60 + second;
    const points = [
        { time: 0, video: 18 },
        { time: 5 * 3600, video: 18 },
        { time: 7 * 3600, video: 0 },
        { time: 12 * 3600, video: 3 },
        { time: 17 * 3600, video: 8 },
        { time: 20 * 3600, video: 14 },
        { time: 23 * 3600, video: 18 },
        { time: 24 * 3600, video: 18 }
    ];

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];

        if (time >= current.time && time <= next.time) {
            const progress = (time - current.time) / (next.time - current.time);
            return current.video + (next.video - current.video) * progress;
        }
    }

    return 18;
}

function updateHero() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const stateName = getState(hour);
    const state = states[stateName];

    currentTime.textContent = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    timeState.textContent = state.name;
    heroTitle.innerHTML = state.title;
    heroDescription.textContent = state.description;

    hero.classList.remove("sunrise", "day", "sunset", "evening", "night");
    hero.classList.add(stateName);

    if (video.readyState >= 1) {
        video.currentTime = getVideoTime(hour, minute, second);
    }
}

video.addEventListener("loadedmetadata", () => {
    updateHero();
    video.play().catch(() => {});
});

updateHero();
setInterval(updateHero, 60000);