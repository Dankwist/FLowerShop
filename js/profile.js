import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
const nameInput = document.querySelector("#profile-name-input");
const emailInput = document.querySelector("#profile-email");
const roleElement = document.querySelector("#profile-role");
const saveButton = document.querySelector("#save-profile");
const message = document.querySelector("#profile-message");
const logoutButton = document.querySelector("#logout-button");
const ordersContainer = document.querySelector("#profile-orders");
const reviewsContainer = document.querySelector("#profile-reviews");
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
});
async function loadProfile(userId) {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
        return;
    }
    const userData = userDoc.data();
    nameInput.value = userData.name || "";
    emailInput.value = userData.email || currentUser.email || "";
    roleElement.textContent = userData.role || "user";
}
saveButton.addEventListener("click", async () => {
    if (!currentUser) {
        return;
    }
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
    const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
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
    const reviewsQuery = query(collection(db, "reviews"), where("userId", "==", userId));
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
logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "./login.html";
});