import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    deleteDoc,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const nameInput = document.querySelector("#profile-name-input");
const emailInput = document.querySelector("#profile-email");
const roleElement = document.querySelector("#profile-role");
const saveButton = document.querySelector("#save-profile");
const message = document.querySelector("#profile-message");
const logoutButton = document.querySelector("#logout-button");
const ordersContainer = document.querySelector("#profile-orders");
const reviewsContainer = document.querySelector("#profile-reviews");

const addCardButton = document.querySelector("#add-card-button");
const savedCards = document.querySelector("#saved-cards");
const cardForm = document.querySelector("#profile-card-form");
const cancelCardButton = document.querySelector("#cancel-card-button");
const cardNumberInput = document.querySelector("#profile-card-number");
const cardHolderInput = document.querySelector("#profile-card-holder");
const cardExpiryInput = document.querySelector("#profile-card-expiry");
const cardCvvInput = document.querySelector("#profile-card-cvv");
const cardDefaultInput = document.querySelector("#profile-card-default");
const cardMessage = document.querySelector("#card-message");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    currentUser = user;

    await loadProfile(user.uid);
    loadOrders(user.uid);
    loadReviews(user.uid);
    loadCards(user.uid);
});

async function loadProfile(userId) {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) return;

    const userData = userDoc.data();

    nameInput.value = userData.name || "";
    emailInput.value = userData.email || currentUser.email || "";
    roleElement.textContent = userData.role || "user";
}

saveButton.addEventListener("click", async () => {
    if (!currentUser) return;

    const name = nameInput.value.trim();

    if (!name) {
        message.textContent = "Enter your name.";
        return;
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            name: name
        });

        message.textContent = "Profile updated.";
    } catch (error) {
        console.error(error);
        message.textContent = "Something went wrong.";
    }
});

function loadOrders(userId) {
    const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId)
    );

    onSnapshot(ordersQuery, (snapshot) => {
        const orders = [];

        snapshot.forEach((orderDoc) => {
            orders.push({
                id: orderDoc.id,
                ...orderDoc.data()
            });
        });

        orders.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        renderOrders(orders.slice(0, 3));
    });
}

function renderOrders(orders) {
    ordersContainer.innerHTML = "";

    if (orders.length === 0) {
        ordersContainer.innerHTML = "<p class=\"empty-profile\">No orders yet.</p>";
        return;
    }

    orders.forEach((order) => {
        const element = document.createElement("div");

        element.classList.add("profile-order");

        element.innerHTML = `
            <div>
                <strong>Order #${order.id.slice(0, 8)}</strong>
                <p>${order.items?.length || 0} product(s)</p>
            </div>
            <div>
                <strong>${order.total}$</strong>
                <p class="order-status">${order.status}</p>
            </div>
        `;

        ordersContainer.appendChild(element);
    });
}

function loadReviews(userId) {
    const reviewsQuery = query(
        collection(db, "reviews"),
        where("userId", "==", userId)
    );

    onSnapshot(reviewsQuery, async (snapshot) => {
        const reviews = [];

        snapshot.forEach((reviewDoc) => {
            reviews.push({
                id: reviewDoc.id,
                ...reviewDoc.data()
            });
        });

        const flowerIds = [...new Set(reviews.map((review) => review.flowerId))];
        const flowerNames = {};

        for (const flowerId of flowerIds) {
            const flowerDoc = await getDoc(doc(db, "flowers", flowerId));

            if (flowerDoc.exists()) {
                flowerNames[flowerId] = flowerDoc.data().name;
            }
        }

        renderReviews(reviews, flowerNames);
    });
}

function renderReviews(reviews, flowerNames) {
    reviewsContainer.innerHTML = "";

    if (reviews.length === 0) {
        reviewsContainer.innerHTML = "<p class=\"empty-profile\">You haven't written any reviews yet.</p>";
        return;
    }

    reviews.forEach((review) => {
        const element = document.createElement("div");

        element.classList.add("profile-review");

        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

        element.innerHTML = `
            <div class="profile-review-top">
                <div>
                    <strong>${flowerNames[review.flowerId] || "Flower"}</strong>
                    <p>${stars}</p>
                </div>
                <button class="delete-profile-review">Delete</button>
            </div>
            <p>${review.text}</p>
        `;

        element.querySelector(".delete-profile-review").addEventListener("click", async () => {
            await deleteDoc(doc(db, "reviews", review.id));
        });

        reviewsContainer.appendChild(element);
    });
}

function loadCards(userId) {
    const cardsQuery = query(
        collection(db, "cards"),
        where("userId", "==", userId)
    );

    onSnapshot(cardsQuery, (snapshot) => {
        const cards = [];

        snapshot.forEach((cardDoc) => {
            cards.push({
                id: cardDoc.id,
                ...cardDoc.data()
            });
        });

        cards.sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return 0;
        });

        renderCards(cards);
    });
}

function renderCards(cards) {
    savedCards.innerHTML = "";

    if (cards.length === 0) {
        savedCards.innerHTML = `
            <div class="empty-cards">
                <p>No saved cards yet.</p>
            </div>
        `;
        return;
    }

    cards.forEach((card) => {
        const element = document.createElement("div");

        element.classList.add("saved-card");

        element.innerHTML = `
            <div class="saved-card-info">
                <div class="saved-card-brand">${card.brand}</div>
                <div>
                    <strong>•••• •••• •••• ${card.last4}</strong>
                    <p>${card.cardHolder} · ${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}</p>
                </div>
            </div>

            <div class="saved-card-actions">
                ${card.isDefault
                    ? '<span class="default-card">DEFAULT</span>'
                    : '<button class="make-default-card">Make default</button>'}
                <button class="delete-card">Delete</button>
            </div>
        `;

        const makeDefaultButton = element.querySelector(".make-default-card");

        if (makeDefaultButton) {
            makeDefaultButton.addEventListener("click", async () => {
                await setDefaultCard(card.id, cards);
            });
        }

        element.querySelector(".delete-card").addEventListener("click", async () => {
            try {
                await deleteDoc(doc(db, "cards", card.id));

                if (card.isDefault) {
                    const remainingCards = cards.filter((item) => item.id !== card.id);

                    if (remainingCards.length > 0) {
                        await updateDoc(doc(db, "cards", remainingCards[0].id), {
                            isDefault: true
                        });
                    }
                }
            } catch (error) {
                console.error(error);
            }
        });

        savedCards.appendChild(element);
    });
}
async function setDefaultCard(cardId, cards) {
    try {
        for (const card of cards) {
            if (card.isDefault) {
                await updateDoc(doc(db, "cards", card.id), {
                    isDefault: false
                });
            }
        }

        await updateDoc(doc(db, "cards", cardId), {
            isDefault: true
        });
    } catch (error) {
        console.error(error);
    }
}

addCardButton.addEventListener("click", () => {
    cardForm.style.display = "block";
    addCardButton.style.display = "none";
    cardMessage.textContent = "";
    cardNumberInput.focus();
});

cancelCardButton.addEventListener("click", () => {
    cardForm.reset();
    cardForm.style.display = "none";
    addCardButton.style.display = "block";
    cardMessage.textContent = "";
});

cardNumberInput.addEventListener("input", () => {
    let value = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    value = value.replace(/(.{4})/g, "$1 ").trim();
    cardNumberInput.value = value;
});

cardExpiryInput.addEventListener("input", () => {
    let value = cardExpiryInput.value.replace(/\D/g, "").slice(0, 4);

    if (value.length >= 3) {
        value = value.slice(0, 2) + "/" + value.slice(2);
    }

    cardExpiryInput.value = value;
});

cardCvvInput.addEventListener("input", () => {
    cardCvvInput.value = cardCvvInput.value.replace(/\D/g, "").slice(0, 3);
});

cardForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cardNumber = cardNumberInput.value.replace(/\D/g, "");
    const cardHolder = cardHolderInput.value.trim().toUpperCase();
    const expiry = cardExpiryInput.value.trim();
    const cvv = cardCvvInput.value.trim();

    if (cardNumber.length !== 16) {
        cardMessage.textContent = "Card number must contain 16 digits.";
        return;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        cardMessage.textContent = "Enter expiry date as MM/YY.";
        return;
    }

    const [month, year] = expiry.split("/").map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (month < 1 || month > 12) {
        cardMessage.textContent = "Invalid expiry month.";
        return;
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        cardMessage.textContent = "Card has expired.";
        return;
    }

    if (cvv.length !== 3) {
        cardMessage.textContent = "CVV must contain 3 digits.";
        return;
    }

    if (!cardHolder) {
        cardMessage.textContent = "Enter card holder name.";
        return;
    }

    try {
        const cardsQuery = query(
            collection(db, "cards"),
            where("userId", "==", currentUser.uid)
        );

        const snapshot = await getDocs(cardsQuery);

        if (cardDefaultInput.checked) {
            for (const cardDoc of snapshot.docs) {
                if (cardDoc.data().isDefault) {
                    await updateDoc(doc(db, "cards", cardDoc.id), {
                        isDefault: false
                    });
                }
            }
        }

        const brand = getCardBrand(cardNumber);

        await addDoc(collection(db, "cards"), {
            userId: currentUser.uid,
            last4: cardNumber.slice(-4),
            cardHolder: cardHolder,
            expiryMonth: month,
            expiryYear: 2000 + year,
            brand: brand,
            isDefault: cardDefaultInput.checked || snapshot.empty,
            createdAt: new Date()
        });

        cardForm.reset();
        cardForm.style.display = "none";
        addCardButton.style.display = "block";
        cardMessage.textContent = "";
    } catch (error) {
        console.error(error);
        cardMessage.textContent = "Something went wrong.";
    }
});

function getCardBrand(number) {
    if (/^4/.test(number)) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(number)) return "MASTERCARD";
    if (/^3[47]/.test(number)) return "AMEX";
    return "CARD";
}

logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "./login.html";
});