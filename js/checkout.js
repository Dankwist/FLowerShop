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

let cartItems = [];
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    currentUser = user;
    await loadCart();
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

placeOrderButton.addEventListener("click", async () => {
    if (cartItems.length === 0) {
        return;
    }
    try {
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Creating order...";
        for (const item of cartItems) {
    const flowerDoc = await getDoc(doc(db, "flowers", item.flowerId));
    if (!flowerDoc.exists()) {
        message.textContent = `${item.name} is no longer available.`;
        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "Place order";
        return;
    }
    const flower = flowerDoc.data();
    if (flower.stock < item.quantity) {
        message.textContent = `${item.name}: only ${flower.stock} left in stock.`;
        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "Place order";
        return;
    }
}

for (const item of cartItems) {
    const flowerRef = doc(db, "flowers", item.flowerId);
    const flowerDoc = await getDoc(flowerRef);
    const flower = flowerDoc.data();
    await updateDoc(flowerRef, {
        stock: flower.stock - item.quantity
    });
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

        const orderRef = await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            items: orderItems,
            total: total,
            status: "pending",
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
        message.textContent = "Something went wrong.";
        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "Place order";
    }
});