import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const itemsContainer = document.querySelector("#checkout-items");
const totalElement = document.querySelector("#checkout-total");
const placeOrderButton = document.querySelector("#place-order");
const message = document.querySelector("#checkout-message");
const savedCardsContainer = document.querySelector("#checkout-saved-cards");
const addCardButton = document.querySelector("#checkout-add-card");
const cardForm = document.querySelector("#checkout-card-form");
const cardNumberInput = document.querySelector("#checkout-card-number");
const cardHolderInput = document.querySelector("#checkout-card-holder");
const cardExpiryInput = document.querySelector("#checkout-card-expiry");
const cardCvvInput = document.querySelector("#checkout-card-cvv");
const saveCardInput = document.querySelector("#checkout-save-card");
const cardMessage = document.querySelector("#checkout-card-message");
let cartItems = [];
let currentUser = null;
let selectedCard = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    currentUser = user;

    await loadCart();
    await loadCards();
});

async function loadCart() {
    const cartQuery = query(
        collection(db, "cart"),
        where("userId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(cartQuery);

    cartItems = [];

    snapshot.forEach((item) => {
        cartItems.push({
            id: item.id,
            ...item.data()
        });
    });

    renderCheckout();
}

function renderCheckout() {
    itemsContainer.innerHTML = "";

    if (cartItems.length === 0) {
        itemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        placeOrderButton.disabled = true;
        return;
    }

    let total = 0;

    cartItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;

        total += itemTotal;

        const element = document.createElement("div");

        element.classList.add("checkout-item");

        element.innerHTML = `
            <div class="checkout-item-left">
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <strong>${item.name}</strong>
                    <p>${item.price}$ × ${item.quantity}</p>
                </div>
            </div>
            <strong>${itemTotal}$</strong>
        `;

        itemsContainer.appendChild(element);
    });

    totalElement.textContent = `$${total}`;
}

async function loadCards() {
    const cardsQuery = query(
        collection(db, "cards"),
        where("userId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(cardsQuery);

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

    if (cards.length > 0) {
        selectCard(cards[0]);
    }
}

function renderCards(cards) {
    savedCardsContainer.innerHTML = "";

    if (cards.length === 0) {
        savedCardsContainer.innerHTML = `
            <p class="no-saved-cards">
                No saved cards. Add a card to continue.
            </p>
        `;
        return;
    }

    cards.forEach((card) => {
        const element = document.createElement("button");

        element.type = "button";
        element.classList.add("checkout-saved-card");

        element.innerHTML = `
            <div>
                <strong>${card.brand} •••• ${card.last4}</strong>
                <p>${card.cardHolder}</p>
            </div>
            <span>${card.isDefault ? "DEFAULT" : "SELECT"}</span>
        `;

        element.addEventListener("click", () => {
            selectCard(card);
        });

        savedCardsContainer.appendChild(element);
    });
}

function selectCard(card) {
    selectedCard = card;

    document.querySelectorAll(".checkout-saved-card").forEach((element) => {
        element.classList.remove("selected");
    });

    const buttons = [...document.querySelectorAll(".checkout-saved-card")];

    const selectedButton = buttons.find((button) =>
        button.innerHTML.includes(`•••• ${card.last4}`)
    );

    if (selectedButton) {
        selectedButton.classList.add("selected");
    }

    cardForm.style.display = "none";
}

addCardButton.addEventListener("click", () => {
    selectedCard = null;
    cardForm.style.display = "block";
    cardNumberInput.focus();

    document.querySelectorAll(".checkout-saved-card").forEach((element) => {
        element.classList.remove("selected");
    });
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

    const brand = getCardBrand(cardNumber);

    selectedCard = {
        last4: cardNumber.slice(-4),
        cardHolder: cardHolder,
        expiryMonth: month,
        expiryYear: 2000 + year,
        brand: brand
    };

    if (saveCardInput.checked) {
        try {
            await addDoc(collection(db, "cards"), {
                userId: currentUser.uid,
                last4: cardNumber.slice(-4),
                cardHolder: cardHolder,
                expiryMonth: month,
                expiryYear: 2000 + year,
                brand: brand,
                isDefault: false,
                createdAt: new Date()
            });
        } catch (error) {
            console.error(error);
            cardMessage.textContent = "Card could not be saved.";
            return;
        }
    }

    cardForm.style.display = "none";
    cardMessage.textContent = "";
});

placeOrderButton.addEventListener("click", async () => {
    if (cartItems.length === 0) return;

    if (!selectedCard) {
        message.textContent = "Select a payment card first.";
        return;
    }

    try {
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Processing payment...";

        for (const item of cartItems) {
            const flowerDoc = await getDoc(doc(db, "flowers", item.flowerId));

            if (!flowerDoc.exists()) {
                message.textContent = `${item.name} is no longer available.`;
                resetButton();
                return;
            }

            const flower = flowerDoc.data();

            if (flower.stock < item.quantity) {
                message.textContent = `${item.name}: only ${flower.stock} left in stock.`;
                resetButton();
                return;
            }
        }

        let total = 0;

        const orderItems = cartItems.map((item) => {
            total += item.price * item.quantity;

            return {
                flowerId: item.flowerId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            };
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const orderRef = await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            items: orderItems,
            total: total,
            status: "paid",
            paymentMethod: "card",
            cardBrand: selectedCard.brand,
            cardLast4: selectedCard.last4,
            createdAt: new Date()
        });

        await addDoc(collection(db, "activeActions"), {
            userId: currentUser.uid,
            orderId: orderRef.id,
            status: "pending",
            createdAt: new Date()
        });

        for (const item of cartItems) {
            await deleteDoc(doc(db, "cart", item.id));
        }

        window.location.href = "./orders.html";
    } catch (error) {
        console.error(error);
        message.textContent = "Payment failed.";
        resetButton();
    }
});

function resetButton() {
    placeOrderButton.disabled = false;
    placeOrderButton.textContent = "Place order";
}

function getCardBrand(number) {
    if (/^4/.test(number)) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(number)) return "MASTERCARD";
    if (/^3[47]/.test(number)) return "AMEX";
    return "CARD";
}