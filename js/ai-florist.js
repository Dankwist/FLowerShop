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
const nextButton = document.querySelector("#next-question");
const restartButton = document.querySelector("#restart-florist");
const viewFlowerButton = document.querySelector("#view-flower");
const questionTitle = document.querySelector("#question-title");
const questionDescription = document.querySelector("#question-description");
const questionNumber = document.querySelector("#question-number");
const optionsContainer = document.querySelector("#options");
const quizStatus = document.querySelector("#quiz-status");
const resultName = document.querySelector("#result-name");
const resultDescription = document.querySelector("#result-description");
const resultReason = document.querySelector("#result-reason");
const resultImage = document.querySelector("#result-image");
const resultPrice = document.querySelector("#result-price");
let currentQuestion = 0;
let selectedOption = null;
let answers = [];
let flowers = [];
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

    optionsContainer.innerHTML = "";
    selectedOption = null;
    nextButton.disabled = true;
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
                item.classList.remove("selected");
            });

            button.classList.add("selected");
            selectedOption = option[1];
            nextButton.disabled = false;
            quizStatus.textContent = "READY TO CONTINUE";
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

function findFlower() {
    if (!flowers.length) {
        return null;
    }

    const [min, max] = getBudget();

    let matches = flowers.filter(flower => {
        const price = Number(flower.price);

        return price >= min && price <= max;
    });

    if (!matches.length) {
        matches = flowers;
    }

    const mood = answers[2];

    const keywords = {
        Romantic: ["rose", "red", "romantic"],
        Calm: ["white", "lavender", "lily"],
        Happy: ["sunflower", "yellow", "tulip"],
        Dark: ["black", "dark", "purple"]
    };

    const searchWords = keywords[mood] || [];

    const preferred = matches.filter(flower => {
        const text = `
            ${flower.name}
            ${flower.description || ""}
        `.toLowerCase();

        return searchWords.some(word => text.includes(word));
    });

    if (preferred.length) {
        return preferred[Math.floor(Math.random() * preferred.length)];
    }

    return matches[Math.floor(Math.random() * matches.length)];
}

function showResult() {
    const flower = findFlower();

    recommendedFlower = flower;

    if (!flower) {
        resultName.textContent = "No flowers found";
        resultDescription.textContent = "The catalog is currently empty.";
        resultReason.textContent = "Add flowers to Firestore to receive recommendations.";
        resultPrice.textContent = "$0";

        return;
    }

    resultName.textContent = flower.name;

    resultDescription.textContent =
        flower.description || "A flower selected for your moment.";

    resultPrice.textContent = `$${flower.price}`;

    resultImage.src =
        flower.image || "../img-flower/flower1.png";

    resultImage.alt = flower.name;

    resultReason.textContent =
        `${answers[0]} · ${answers[1]} · ${answers[2]} · ${answers[3]}`;
}

function startQuiz() {
    intro.style.display = "none";
    quiz.style.display = "flex";
    result.style.display = "none";

    currentQuestion = 0;
    answers = [];
    recommendedFlower = null;

    showQuestion();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function nextQuestion() {
    if (!selectedOption) {
        return;
    }

    answers[currentQuestion] = selectedOption;

    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();

        return;
    }

    quiz.style.display = "none";
    result.style.display = "flex";

    showResult();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function restartQuiz() {
    answers = [];
    currentQuestion = 0;
    selectedOption = null;
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

    window.location.href =
        `./shop.html?flower=${recommendedFlower.id}`;
}

startButton.addEventListener("click", startQuiz);
nextButton.addEventListener("click", nextQuestion);
restartButton.addEventListener("click", restartQuiz);
viewFlowerButton.addEventListener("click", viewFlower);

quiz.style.display = "none";
result.style.display = "none";

loadFlowers();