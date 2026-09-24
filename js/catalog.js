import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const flowersContainer = document.querySelector("#flowers-container");
const prevButton = document.querySelector("#prev-page");
const nextButton = document.querySelector("#next-page");
const pageNumber = document.querySelector("#page-number");

const flowersQuery = query(
    collection(db, "flowers"),
    orderBy("name")
);

const snapshot = await getDocs(flowersQuery);
const flowers = [];

snapshot.forEach((doc) => {
    flowers.push({
        id: doc.id,
        ...doc.data()
    });
});

const pageSize = 4;
let currentPage = 1;
const totalPages = Math.ceil(flowers.length / pageSize);

function showPage(page) {
    flowersContainer.innerHTML = "";

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageFlowers = flowers.slice(start, end);

    pageFlowers.forEach((flower) => {
        const card = document.createElement("div");

        card.classList.add("selers-card");
        card.dataset.flowerId = flower.id;

        card.innerHTML = `
            <img src="${flower.image}" alt="${flower.name}">

            <p>${flower.name}</p>

            <div class="selers-card-bottom">
                <p>
                    <span class="cost-seler">
                        ${flower.price}$
                    </span>
                </p>

                <button>
                    <img src="../icons/cart-icon.png" alt="cart">
                    Add to cart
                </button>
            </div>
        `;

        flowersContainer.appendChild(card);
    });

    pageNumber.textContent = currentPage;

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

function openRecommendedFlower() {
    const params = new URLSearchParams(window.location.search);
    const flowerId = params.get("flower");

    if (!flowerId) {
        return;
    }

    const flowerIndex = flowers.findIndex(
        flower => flower.id === flowerId
    );

    if (flowerIndex === -1) {
        console.log("Recommended flower not found:", flowerId);
        return;
    }

    const recommendedPage =
        Math.floor(flowerIndex / pageSize) + 1;

    currentPage = recommendedPage;

    showPage(currentPage);

    const card = document.querySelector(
        `[data-flower-id="${flowerId}"]`
    );

    if (!card) {
        console.log("Card not found:", flowerId);
        return;
    }

    setTimeout(() => {
        card.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        card.classList.add("recommended-flower");

        setTimeout(() => {
            card.classList.remove("recommended-flower");
        }, 3000);
    }, 200);
}

prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
    }
});

nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        showPage(currentPage);
    }
});

showPage(currentPage);
openRecommendedFlower();