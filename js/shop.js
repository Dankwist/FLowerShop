import { auth, db } from "./firebase.js";
import {
    collection,
    getDocs,
    query,
    limit,
    startAfter,
    where,
    addDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const flowersContainer = document.querySelector("#flowers-container");
const showMoreButton = document.querySelector("#show-more");
const searchInput = document.querySelector("#site-search");
const searchForm = document.querySelector("#search-form");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#sort-select");
const resetButton = document.querySelector("#reset-filters");
const flowersRef = collection(db, "flowers");
const productsPerPage = 8;

let lastDoc = null;
let allFlowers = [];
let searchText = "";
let selectedCategory = "all";
let selectedSort = "default";
let loading = false;

async function addToCart(flower) {
    if (!auth.currentUser) {
        window.location.href = "./login.html";
        return;
    }

    const cartQuery = query(
        collection(db, "cart"),
        where("userId", "==", auth.currentUser.uid),
        where("flowerId", "==", flower.id)
    );

    const snapshot = await getDocs(cartQuery);

    if (!snapshot.empty) {
        const cartDoc = snapshot.docs[0];
        const oldQuantity = cartDoc.data().quantity || 1;

        await updateDoc(cartDoc.ref, {
            quantity: oldQuantity + 1
        });
    } else {
        await addDoc(collection(db, "cart"), {
            userId: auth.currentUser.uid,
            flowerId: flower.id,
            name: flower.name,
            price: flower.price,
            image: flower.image,
            quantity: 1,
            createdAt: new Date()
        });
    }

    alert("Added to cart");
}

function createFlowerCard(flower) {
    const card = document.createElement("div");

    card.classList.add("selers-card");
    card.dataset.flowerId = flower.id;

    card.addEventListener("click", () => {
        window.location.href = `./flower.html?id=${flower.id}`;
    });

    card.innerHTML = `
        <img src="${flower.image}" alt="${flower.name}">
        <p>${flower.name}</p>
        <div class="selers-card-bottom">
            <p>
                <span class="cost-seler">
                    ${flower.price}$
                </span>
            </p>
            <button type="button">
                <img src="../icons/cart-icon.png" alt="cart">
                Add to cart
            </button>
        </div>
    `;

    const cartButton = card.querySelector("button");

    cartButton.addEventListener("click", (event) => {
        event.stopPropagation();
        addToCart(flower);
    });

    flowersContainer.appendChild(card);
}

async function loadFlowers() {
    if (loading) {
        return;
    }

    loading = true;

    let flowersQuery;

    if (selectedCategory === "all") {
        flowersQuery = query(
            flowersRef,
            limit(productsPerPage)
        );
    } else {
        flowersQuery = query(
            flowersRef,
            where("category", "==", selectedCategory),
            limit(productsPerPage)
        );
    }

    if (lastDoc) {
        flowersQuery = query(
            flowersRef,
            ...(selectedCategory !== "all"
                ? [where("category", "==", selectedCategory)]
                : []),
            startAfter(lastDoc),
            limit(productsPerPage)
        );
    }

    try {
        const snapshot = await getDocs(flowersQuery);

        snapshot.forEach((doc) => {
            const flower = {
                id: doc.id,
                ...doc.data()
            };

            allFlowers.push(flower);
        });

        lastDoc =
            snapshot.docs.length > 0
                ? snapshot.docs[snapshot.docs.length - 1]
                : null;

        renderFlowers();

        if (snapshot.docs.length < productsPerPage) {
            showMoreButton.style.display = "none";
        } else {
            showMoreButton.style.display = "block";
        }
    } catch (error) {
        console.error("Error loading flowers:", error);
    } finally {
        loading = false;
    }
}

function renderFlowers() {
    flowersContainer.innerHTML = "";

    let flowers = [...allFlowers];

    if (searchText !== "") {
        flowers = flowers.filter((flower) => {
            const name = flower.name.toLowerCase();
            const description = flower.description
                ? flower.description.toLowerCase()
                : "";

            return (
                name.includes(searchText) ||
                description.includes(searchText)
            );
        });
    }

    if (selectedSort === "price-asc") {
        flowers.sort((a, b) => a.price - b.price);
    }

    if (selectedSort === "price-desc") {
        flowers.sort((a, b) => b.price - a.price);
    }

    if (selectedSort === "name-asc") {
        flowers.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    if (selectedSort === "name-desc") {
        flowers.sort((a, b) =>
            b.name.localeCompare(a.name)
        );
    }

    if (flowers.length === 0) {
        flowersContainer.innerHTML = `
            <p class="no-products">
                No flowers found
            </p>
        `;
        return;
    }

    flowers.forEach((flower) => {
        createFlowerCard(flower);
    });
}

async function openRecommendedFlower() {
    const params = new URLSearchParams(window.location.search);
    const flowerId = params.get("flower");

    if (!flowerId) {
        return;
    }

    let flower = allFlowers.find(
        (item) => item.id === flowerId
    );

    while (!flower && showMoreButton.style.display !== "none") {
        await loadFlowers();

        flower = allFlowers.find(
            (item) => item.id === flowerId
        );
    }

    if (!flower) {
        console.log("Recommended flower not found:", flowerId);
        return;
    }

    renderFlowers();

    const card = document.querySelector(
        `[data-flower-id="${flowerId}"]`
    );

    if (!card) {
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
    }, 300);
}

showMoreButton.addEventListener("click", () => {
    loadFlowers();
});

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    searchText = searchInput.value.trim().toLowerCase();

    renderFlowers();
});

searchInput.addEventListener("input", () => {
    searchText = searchInput.value.trim().toLowerCase();

    renderFlowers();
});

categoryFilter.addEventListener("change", () => {
    selectedCategory = categoryFilter.value;
    lastDoc = null;
    allFlowers = [];

    flowersContainer.innerHTML = "";
    showMoreButton.style.display = "block";

    loadFlowers();
});

sortSelect.addEventListener("change", () => {
    selectedSort = sortSelect.value;

    renderFlowers();
});

resetButton.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "all";
    sortSelect.value = "default";

    searchText = "";
    selectedCategory = "all";
    selectedSort = "default";
    lastDoc = null;
    allFlowers = [];

    flowersContainer.innerHTML = "";
    showMoreButton.style.display = "block";

    loadFlowers();
});

loadFlowers().then(() => {
    openRecommendedFlower();
});