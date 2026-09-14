import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const cartContainer = document.querySelector("#cart-container");
const cartTotal = document.querySelector("#cart-total");
const summaryProducts = document.querySelector("#summary-products");
const cartCount = document.querySelector("#cart-count");
const checkoutButton = document.querySelector("#checkout-button");

let cartItems = [];

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    loadCart(user.uid);
});

function loadCart(userId) {
    const cartQuery = query(
        collection(db, "cart"),
        where("userId", "==", userId)
    );

    onSnapshot(cartQuery, (snapshot) => {
        cartItems = [];

        snapshot.forEach((item) => {
            cartItems.push({
                id: item.id,
                ...item.data()
            });
        });

        renderCart();
    });
}

function renderCart() {
    cartContainer.innerHTML = "";

    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Choose something beautiful for your home.</p>
                <a href="./shop.html">Go to shop</a>
            </div>
        `;

        cartTotal.textContent = "$0";
        summaryProducts.textContent = "$0";
        cartCount.textContent = "0 items";
        return;
    }

    let total = 0;
    let count = 0;

    cartItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;

        total += itemTotal;
        count += item.quantity;

        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");

        cartItem.innerHTML = `
            <img class="cart-item-image" src="${item.image}" alt="${item.name}">

            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>${item.price}$ per item</p>
            </div>

            <div class="quantity">
                <button class="minus">−</button>
                <span>${item.quantity}</span>
                <button class="plus">+</button>
            </div>

            <div class="cart-item-price">
                ${itemTotal}$
                <br>
                <button class="delete-button">Remove</button>
            </div>
        `;

        cartItem.querySelector(".minus").addEventListener("click", () => {
            updateQuantity(item, item.quantity - 1);
        });

        cartItem.querySelector(".plus").addEventListener("click", () => {
            updateQuantity(item, item.quantity + 1);
        });

        cartItem.querySelector(".delete-button").addEventListener("click", () => {
            deleteCartItem(item.id);
        });

        cartContainer.appendChild(cartItem);
    });

    cartTotal.textContent = `$${total}`;
    summaryProducts.textContent = `$${total}`;
    cartCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;
}

async function updateQuantity(item, quantity) {
    if (quantity <= 0) {
        await deleteCartItem(item.id);
        return;
    }

    await updateDoc(doc(db, "cart", item.id), {
        quantity: quantity
    });
}

async function deleteCartItem(itemId) {
    await deleteDoc(doc(db, "cart", itemId));
}

checkoutButton.addEventListener("click", () => {
    if (cartItems.length === 0) {
        alert("Your cart is empty");
        return;
    }

    window.location.href = "./checkout.html";
});