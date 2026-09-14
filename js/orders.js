import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ordersContainer = document.querySelector("#orders-container");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    loadOrders(user.uid);
});

function loadOrders(userId) {
    const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId)
    );

    onSnapshot(ordersQuery, (snapshot) => {
        const orders = [];

        snapshot.forEach((order) => {
            orders.push({
                id: order.id,
                ...order.data()
            });
        });

        orders.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);

            return dateB - dateA;
        });

        renderOrders(orders);
    });
}

function renderOrders(orders) {
    ordersContainer.innerHTML = "";

    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-orders">
                <h2>No orders yet</h2>
                <p>When you buy something, your orders will appear here.</p>
            </div>
        `;
        return;
    }

    orders.forEach((order) => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        let itemsHTML = "";

        order.items.forEach((item) => {
            itemsHTML += `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.name}">

                    <div>
                        <strong>${item.name}</strong>
                        <p>${item.price}$ × ${item.quantity}</p>
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="order-top">
                <p>Order #${order.id.slice(0, 8)}</p>
                <p class="order-status">${order.status}</p>
            </div>

            ${itemsHTML}

            <div class="order-bottom">
                <span>Total</span>
                <strong>${order.total}$</strong>
            </div>
        `;

        ordersContainer.appendChild(card);
    });
}