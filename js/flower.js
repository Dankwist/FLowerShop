import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
const flowerContainer = document.querySelector("#flower-container");
const reviewsContainer = document.querySelector("#reviews-container");
const averageRating = document.querySelector("#average-rating");
const reviewsCount = document.querySelector("#reviews-count");
const reviewText = document.querySelector("#review-text");
const submitReview = document.querySelector("#submit-review");
const reviewMessage = document.querySelector("#review-message");
const relatedContainer = document.querySelector("#related-container");
const relatedMore = document.querySelector("#related-more");
let relatedFlowers = [];
let relatedLimit = 4;
const params = new URLSearchParams(window.location.search);
const flowerId = params.get("id");
let currentFlower = null;
let quantity = 1;
let selectedRating = 0;
let currentUser = null;

async function loadRelatedFlowers() {
    if (!currentFlower) {
        return;
    }
    const flowersQuery = query(
        collection(db, "flowers"),
        where("category", "==", currentFlower.category)
    );
    const snapshot = await getDocs(flowersQuery);
    relatedFlowers = [];
    snapshot.forEach((flowerDoc) => {
        if (flowerDoc.id !== currentFlower.id) {
            relatedFlowers.push({
                id: flowerDoc.id,
                ...flowerDoc.data()
            });
        }
    });
    renderRelatedFlowers();
}
function renderRelatedFlowers() {
    relatedContainer.innerHTML = "";
    const visibleFlowers = relatedFlowers.slice(0, relatedLimit);
    visibleFlowers.forEach((flower) => {
        const card = document.createElement("div");
        card.classList.add("related-card");
        card.innerHTML = `
            <img src="${flower.image}" alt="${flower.name}">
            <div>
                <p>${flower.category || "Flowers"}</p>
                <h3>${flower.name}</h3>
                <strong>${flower.price}$</strong>
            </div>
        `;
        card.addEventListener("click", () => {
            window.location.href = `./flower.html?id=${flower.id}`;
        });
        relatedContainer.appendChild(card);
    });
    relatedMore.style.display = relatedFlowers.length > relatedLimit ? "block" : "none";
}
relatedMore.addEventListener("click", () => {
    relatedLimit += 4;
    renderRelatedFlowers();
});

async function loadFlower() {
    if (!flowerId) {
        flowerContainer.innerHTML = "<p>Flower not found</p>";
        return;
    }
    const flowerRef = doc(db, "flowers", flowerId);
    const snapshot = await getDoc(flowerRef);
    if (!snapshot.exists()) {
        flowerContainer.innerHTML = "<p>Flower not found</p>";
        return;
    }
    currentFlower = {
        id: snapshot.id,
        ...snapshot.data()
    };
    flowerContainer.innerHTML = `
        <div class="flower-image">
            <img src="${currentFlower.image}" alt="${currentFlower.name}">
        </div>
        <div class="flower-info">
            <p class="flower-category">${currentFlower.category || "Flowers"}</p>
            <h1>${currentFlower.name}</h1>
            <p class="flower-rating">★ ${currentFlower.rating || 0}</p>
            <p class="flower-description">${currentFlower.description || "No description available."}</p>
            <p class="flower-price">${currentFlower.price}$</p>
            <p class="flower-stock">${currentFlower.stock > 0 ? `In stock: ${currentFlower.stock}` : "Out of stock"}</p>
            <div class="flower-actions">
                <div class="quantity">
                    <button id="minus">−</button>
                    <span id="quantity">1</span>
                    <button id="plus">+</button>
                </div>
                <button class="add-cart" id="add-cart" ${currentFlower.stock <= 0 ? "disabled" : ""}>Add to cart</button>
            </div>
            <p id="cart-message"></p>
        </div>
    `;

    loadRelatedFlowers();
    const minusButton = document.querySelector("#minus");
    const plusButton = document.querySelector("#plus");
    const quantityElement = document.querySelector("#quantity");
    const addCartButton = document.querySelector("#add-cart");
    minusButton.addEventListener("click", () => {
        if (quantity > 1) {
            quantity--;
            quantityElement.textContent = quantity;
        }
    });
    plusButton.addEventListener("click", () => {
        if (quantity < currentFlower.stock) {
            quantity++;
            quantityElement.textContent = quantity;
        }
    });
    addCartButton.addEventListener("click", addToCart);
}
async function addToCart() {
    if (!auth.currentUser) {
        window.location.href = "./login.html";
        return;
    }
    if (!currentFlower || currentFlower.stock <= 0) {
        return;
    }
    const cartQuery = query(collection(db, "cart"), where("userId", "==", auth.currentUser.uid), where("flowerId", "==", currentFlower.id));
    const snapshot = await getDocs(cartQuery);
    if (!snapshot.empty) {
        const cartDoc = snapshot.docs[0];
        const oldQuantity = cartDoc.data().quantity || 1;
        await updateDoc(cartDoc.ref, {
            quantity: Math.min(oldQuantity + quantity, currentFlower.stock)
        });
    } else {
        await addDoc(collection(db, "cart"), {
            userId: auth.currentUser.uid,
            flowerId: currentFlower.id,
            name: currentFlower.name,
            price: currentFlower.price,
            image: currentFlower.image,
            quantity: quantity,
            createdAt: new Date()
        });
    }
    const message = document.querySelector("#cart-message");
    message.textContent = "Added to cart";
    message.style.color = "orange";
}
function loadReviews() {
    const reviewsQuery = query(collection(db, "reviews"), where("flowerId", "==", flowerId));
    onSnapshot(reviewsQuery, (snapshot) => {
        const reviews = [];
        snapshot.forEach((reviewDoc) => {
            reviews.push({
                id: reviewDoc.id,
                ...reviewDoc.data()
            });
        });
        renderReviews(reviews);
    });
}
function renderReviews(reviews) {
    reviewsContainer.innerHTML = "";
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="no-reviews">
                <p>No reviews yet.</p>
            </div>
        `;
        averageRating.textContent = "★ 0.0";
        reviewsCount.textContent = "0 reviews";
        return;
    }
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    const average = totalRating / reviews.length;
    averageRating.textContent = `★ ${average.toFixed(1)}`;
    reviewsCount.textContent = `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`;
    reviews.forEach((review) => {
        const element = document.createElement("div");
        element.classList.add("review-card");
        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
        element.innerHTML = `
            <div class="review-top">
                <div>
                    <strong>${review.userName || "User"}</strong>
                    <p>${stars}</p>
                </div>
                ${currentUser && currentUser.uid === review.userId ? `<button class="delete-review">Delete</button>` : ""}
            </div>
            <p class="review-text">${review.text}</p>
        `;
        const deleteButton = element.querySelector(".delete-review");
        if (deleteButton) {
            deleteButton.addEventListener("click", async () => {
                await deleteDoc(doc(db, "reviews", review.id));
            });
        }
        reviewsContainer.appendChild(element);
    });
}
document.querySelectorAll("#review-stars button").forEach((button) => {
    button.addEventListener("click", () => {
        selectedRating = Number(button.dataset.rating);
        document.querySelectorAll("#review-stars button").forEach((star) => {
            star.classList.toggle("selected", Number(star.dataset.rating) <= selectedRating);
        });
    });
});
submitReview.addEventListener("click", async () => {
    if (!currentUser) {
        window.location.href = "./login.html";
        return;
    }
    if (selectedRating === 0) {
        reviewMessage.textContent = "Choose a rating.";
        return;
    }
    if (!reviewText.value.trim()) {
        reviewMessage.textContent = "Write a review.";
        return;
    }
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    await addDoc(collection(db, "reviews"), {
        userId: currentUser.uid,
        userName: userData.name || "User",
        flowerId: flowerId,
        rating: selectedRating,
        text: reviewText.value.trim(),
        createdAt: new Date()
    });
    reviewText.value = "";
    selectedRating = 0;
    document.querySelectorAll("#review-stars button").forEach((star) => {
        star.classList.remove("selected");
    });
    reviewMessage.textContent = "Review added.";
});
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    loadFlower();
    loadReviews();
});