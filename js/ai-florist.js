import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const questions = [
    {
        title: "Who is this flower for?",
        description: "Start with the person. Everything else follows.",
        options: [
            ["01", "Myself"],
            ["02", "Partner"],
            ["03", "Friend"],
            ["04", "Family"]
        ]
    },
    {
        title: "What's the occasion?",
        description: "Every moment has its own flower.",
        options: [
            ["01", "Birthday"],
            ["02", "Date"],
            ["03", "Apology"],
            ["04", "Just because"]
        ]
    },
    {
        title: "What's the mood?",
        description: "Choose the feeling you want to give.",
        options: [
            ["01", "Romantic"],
            ["02", "Calm"],
            ["03", "Happy"],
            ["04", "Dark"]
        ]
    },
    {
        title: "What's your budget?",
        description: "We'll keep the recommendation within your range.",
        options: [
            ["01", "Under $20"],
            ["02", "$20 — $30"],
            ["03", "$30 — $50"],
            ["04", "$50+"]
        ]
    }
];

const intro = document.querySelector(".ai-intro");
const quiz = document.querySelector("#ai-quiz");
const result = document.querySelector("#ai-result");
const startButton = document.querySelector("#start-florist");
const restartButton = document.querySelector("#restart-florist");
const viewFlowerButton = document.querySelector("#view-flower");
const questionTitle = document.querySelector("#question-title");
const questionDescription = document.querySelector("#question-description");
const questionNumber = document.querySelector("#question-number");
const questionLabel = document.querySelector(".ai-question-label");
const optionsContainer = document.querySelector("#options");
const quizStatus = document.querySelector("#quiz-status");
const resultName = document.querySelector("#result-name");
const resultDescription = document.querySelector("#result-description");
const resultReason = document.querySelector("#result-reason");
const resultImage = document.querySelector("#result-image");
const resultPrice = document.querySelector("#result-price");
const previousFlowerButton = document.querySelector("#previous-flower");
const nextFlowerButton = document.querySelector("#next-flower");
const resultCounter = document.querySelector("#result-counter");

let currentQuestion = 0;
let answers = [];
let flowers = [];
let recommendations = [];
let currentFlowerIndex = 0;
let recommendedFlower = null;

async function loadFlowers() {
    try {
        const snapshot = await getDocs(collection(db, "flowers"));

        flowers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("Flowers loaded:", flowers);
    } catch (error) {
        console.error("Ошибка загрузки цветов:", error);
    }
}

function showQuestion() {
    const question = questions[currentQuestion];

    questionTitle.textContent = question.title;
    questionDescription.textContent = question.description;
    questionNumber.textContent = `${String(currentQuestion + 1).padStart(2, "0")} / 04`;
    questionLabel.textContent = String(currentQuestion + 1).padStart(2, "0");

    optionsContainer.innerHTML = "";
    quizStatus.textContent = "CHOOSE ONE OPTION";

    question.options.forEach(option => {
        const button = document.createElement("button");

        button.className = "ai-option";
        button.innerHTML = `
            <span>${option[0]}</span>
            <strong>${option[1]}</strong>
        `;

        button.addEventListener("click", () => {
            document.querySelectorAll(".ai-option").forEach(item => {
                item.disabled = true;
            });

            button.classList.add("selected");
            answers[currentQuestion] = option[1];
            quizStatus.textContent = "PROCESSING";

            setTimeout(nextQuestion, 300);
        });

        optionsContainer.appendChild(button);
    });
}

function getBudget() {
    const budget = answers[3];

    if (budget === "Under $20") return [0, 20];
    if (budget === "$20 — $30") return [20, 30];
    if (budget === "$30 — $50") return [30, 50];

    return [50, Infinity];
}

function getFlowerScore(flower) {
    const text = `
        ${flower.name || ""}
        ${flower.description || ""}
        ${flower.type || ""}
        ${flower.color || ""}
    `.toLowerCase();

    let score = 0;

    const moodKeywords = {
        Romantic: ["rose", "red", "romantic", "love"],
        Calm: ["white", "lavender", "lily", "soft", "calm"],
        Happy: ["sunflower", "yellow", "tulip", "bright", "happy"],
        Dark: ["black", "dark", "purple", "deep"]
    };

    const occasionKeywords = {
        Birthday: ["sunflower", "tulip", "bright", "happy"],
        Date: ["rose", "romantic", "red"],
        Apology: ["lily", "white", "rose"],
        "Just because": ["tulip", "sunflower", "lily"]
    };

    const recipientKeywords = {
        Myself: ["unique", "rare", "exotic"],
        Partner: ["rose", "romantic", "love"],
        Friend: ["tulip", "sunflower", "bright"],
        Family: ["lily", "sunflower", "classic"]
    };

    const moodWords = moodKeywords[answers[2]] || [];
    const occasionWords = occasionKeywords[answers[1]] || [];
    const recipientWords = recipientKeywords[answers[0]] || [];

    moodWords.forEach(word => {
        if (text.includes(word)) {
            score += 5;
        }
    });

    occasionWords.forEach(word => {
        if (text.includes(word)) {
            score += 3;
        }
    });

    recipientWords.forEach(word => {
        if (text.includes(word)) {
            score += 2;
        }
    });

    const [min, max] = getBudget();
    const price = Number(flower.price);

    if (price >= min && price <= max) {
        score += 10;
    } else {
        score -= 8;
    }

    return score;
}

function createRecommendations() {
    if (!flowers.length) {
        recommendations = [];
        return;
    }

    const scoredFlowers = flowers.map(flower => ({
        flower,
        score: getFlowerScore(flower)
    }));

    scoredFlowers.sort((a, b) => b.score - a.score);

    recommendations = scoredFlowers
        .slice(0, 4)
        .map(item => item.flower);

    currentFlowerIndex = 0;
}

function showRecommendedFlower() {
    if (!recommendations.length) {
        resultName.textContent = "No flowers found";
        resultDescription.textContent = "The catalog is currently empty.";
        resultReason.textContent = "Add flowers to Firestore to receive recommendations.";
        resultPrice.textContent = "$0";
        resultCounter.textContent = "00 / 00";

        return;
    }

    const flower = recommendations[currentFlowerIndex];

    recommendedFlower = flower;

    resultName.textContent = flower.name;
    resultDescription.textContent = flower.description || "A flower selected for your moment.";
    resultPrice.textContent = `$${flower.price}`;
    resultImage.src = flower.image || "../img-flower/flower1.png";
    resultImage.alt = flower.name;

    resultCounter.textContent =
        `${String(currentFlowerIndex + 1).padStart(2, "0")} / ${String(recommendations.length).padStart(2, "0")}`;

    resultReason.textContent =
        `${answers[0]} · ${answers[1]} · ${answers[2]} · ${answers[3]}`;

    previousFlowerButton.disabled = currentFlowerIndex === 0;
    nextFlowerButton.disabled = currentFlowerIndex === recommendations.length - 1;
}

function nextFlower() {
    if (currentFlowerIndex >= recommendations.length - 1) {
        return;
    }

    currentFlowerIndex++;
    showRecommendedFlower();
}

function previousFlower() {
    if (currentFlowerIndex <= 0) {
        return;
    }

    currentFlowerIndex--;
    showRecommendedFlower();
}

function startQuiz() {
    intro.style.display = "none";
    quiz.style.display = "flex";
    result.style.display = "none";

    currentQuestion = 0;
    answers = [];
    recommendations = [];
    currentFlowerIndex = 0;
    recommendedFlower = null;

    showQuestion();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();

        return;
    }

    quiz.style.display = "none";
    result.style.display = "flex";

    createRecommendations();
    showRecommendedFlower();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function restartQuiz() {
    answers = [];
    currentQuestion = 0;
    recommendations = [];
    currentFlowerIndex = 0;
    recommendedFlower = null;

    result.style.display = "none";
    intro.style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function viewFlower() {
    if (!recommendedFlower) {
        return;
    }

    window.location.href = `./shop.html?flower=${recommendedFlower.id}`;
}

startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", restartQuiz);
viewFlowerButton.addEventListener("click", viewFlower);
previousFlowerButton.addEventListener("click", previousFlower);
nextFlowerButton.addEventListener("click", nextFlower);

quiz.style.display = "none";
result.style.display = "none";

loadFlowers();