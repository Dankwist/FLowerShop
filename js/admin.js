import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


const flowersContainer = document.querySelector("#flowers-admin-container");
const ordersContainer = document.querySelector("#orders-admin-container");
const reviewsAdminContainer = document.querySelector("#reviews-admin-container");
const addFlowerButton = document.querySelector("#add-flower-button");
const formContainer = document.querySelector("#flower-form-container");
const flowerForm = document.querySelector("#flower-form");
const cancelForm = document.querySelector("#cancel-form");
const usersContainer = document.querySelector("#users-admin-container");
const formTitle = document.querySelector("#form-title");
const nameInput = document.querySelector("#flower-name");
const descriptionInput = document.querySelector("#flower-description");
const priceInput = document.querySelector("#flower-price");
const imageInput = document.querySelector("#flower-image");
const categoryInput = document.querySelector("#flower-category");
const stockInput = document.querySelector("#flower-stock");
const featuredInput = document.querySelector("#flower-featured");
let editingFlowerId = null;


onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    const userDoc = await getDoc(
        doc(db, "users", user.uid)
    );

    if (!userDoc.exists()) {
        window.location.href = "./index.html";
        return;
    }

    const userData = userDoc.data();

    if (userData.role !== "admin") {
        alert("Access denied");
        window.location.href = "./index.html";
        return;
    }
        loadFlowers();
        loadOrders();
        loadUsers();

});


function loadFlowers() {

    onSnapshot(
        collection(db, "flowers"),
        (snapshot) => {

            flowersContainer.innerHTML = "";

            snapshot.forEach((flowerDoc) => {

                const flower = {
                    id: flowerDoc.id,
                    ...flowerDoc.data()
                };

                const element = document.createElement("div");

                element.classList.add("admin-flower");

                element.innerHTML = `
                    <img
                        src="${flower.image}"
                        alt="${flower.name}"
                    >

                    <div class="admin-flower-info">

                        <h3>${flower.name}</h3>

                        <p>Price: ${flower.price}$</p>

                        <p>
                            Category: ${flower.category || "-"}
                        </p>

                        <p>
                            Stock: ${flower.stock || 0}
                        </p>

                        <p>
                            ${flower.featured ? "Featured" : ""}
                        </p>

                    </div>

                    <div class="admin-flower-actions">

                        <button class="edit-button">
                            Edit
                        </button>

                        <button class="delete-button">
                            Delete
                        </button>

                    </div>
                `;


                element
                    .querySelector(".edit-button")
                    .addEventListener("click", () => {
                        editFlower(flower);
                    });


                element
                    .querySelector(".delete-button")
                    .addEventListener("click", () => {
                        deleteFlower(flower.id);
                    });


                flowersContainer.appendChild(element);

            });

        }
    );

}


function loadOrders() {

    onSnapshot(
        collection(db, "orders"),
        (snapshot) => {

            const orders = [];

            snapshot.forEach((orderDoc) => {

                orders.push({
                    id: orderDoc.id,
                    ...orderDoc.data()
                });

            });


            orders.sort((a, b) => {

                const dateA =
                    a.createdAt?.toDate?.() || new Date(0);

                const dateB =
                    b.createdAt?.toDate?.() || new Date(0);

                return dateB - dateA;

            });


            renderOrders(orders);

        }
    );

}


function renderOrders(orders) {

    ordersContainer.innerHTML = "";

    if (orders.length === 0) {

        ordersContainer.innerHTML = `
            <p>No orders yet.</p>
        `;

        return;
    }


    orders.forEach((order) => {

        const element = document.createElement("div");

        element.classList.add("admin-order");


        let itemsHTML = "";

        order.items.forEach((item) => {

            itemsHTML += `
                <div class="admin-order-item">

                    <span>
                        ${item.name} × ${item.quantity}
                    </span>

                    <strong>
                        ${item.price * item.quantity}$
                    </strong>

                </div>
            `;

        });


        element.innerHTML = `

            <div class="admin-order-top">

                <p>
                    Order #${order.id.slice(0, 8)}
                </p>

                <select class="admin-order-status">

                    <option value="pending">
                        Pending
                    </option>

                    <option value="processing">
                        Processing
                    </option>

                    <option value="completed">
                        Completed
                    </option>

                    <option value="cancelled">
                        Cancelled
                    </option>

                </select>

            </div>


            <div class="admin-order-items">

                ${itemsHTML}

            </div>


            <div class="admin-order-bottom">

                <span>
                    User: ${order.userId}
                </span>

                <strong>
                    Total: ${order.total}$
                </strong>

            </div>

        `;


        const statusSelect =
            element.querySelector(".admin-order-status");


        statusSelect.value =
            order.status || "pending";


        statusSelect.addEventListener(
            "change",
            async () => {

                await updateDoc(
                    doc(db, "orders", order.id),
                    {
                        status: statusSelect.value
                    }
                );

                updateActiveAction(
                    order.id,
                    statusSelect.value
                );

            }
        );


        ordersContainer.appendChild(element);

    });

}


async function updateActiveAction(orderId, status) {

    const snapshot = await getDocs(
        collection(db, "activeActions")
    );

    for (const actionDoc of snapshot.docs) {

        const action = actionDoc.data();

        if (action.orderId === orderId) {

            await updateDoc(
                doc(
                    db,
                    "activeActions",
                    actionDoc.id
                ),
                {
                    status: status
                }
            );

        }

    }

}

addFlowerButton.addEventListener("click", () => {

    editingFlowerId = null;

    formTitle.textContent = "Add flower";

    flowerForm.reset();

    formContainer.style.display = "block";

});


cancelForm.addEventListener("click", () => {

    formContainer.style.display = "none";

    flowerForm.reset();

    editingFlowerId = null;

});


flowerForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const flowerData = {

        name: nameInput.value.trim(),

        description: descriptionInput.value.trim(),

        price: Number(priceInput.value),

        image: imageInput.value.trim(),

        category: categoryInput.value.trim(),

        stock: Number(stockInput.value),

        featured: featuredInput.checked,

        rating: 0,

        createdAt: new Date()

    };


    if (editingFlowerId) {

        await updateDoc(
            doc(db, "flowers", editingFlowerId),
            flowerData
        );

    } else {

        await addDoc(
            collection(db, "flowers"),
            flowerData
        );

    }


    formContainer.style.display = "none";

    flowerForm.reset();

    editingFlowerId = null;

});


function editFlower(flower) {

    editingFlowerId = flower.id;

    formTitle.textContent = "Edit flower";

    nameInput.value =
        flower.name || "";

    descriptionInput.value =
        flower.description || "";

    priceInput.value =
        flower.price || 0;

    imageInput.value =
        flower.image || "";

    categoryInput.value =
        flower.category || "";

    stockInput.value =
        flower.stock || 0;

    featuredInput.checked =
        flower.featured || false;

    formContainer.style.display = "block";

}

function loadUsers() {
    onSnapshot(collection(db, "users"), (snapshot) => {
        const users = [];
        snapshot.forEach((userDoc) => {
            users.push({
                id: userDoc.id,
                ...userDoc.data()
            });
        });
        renderUsers(users);
    });
}
function renderUsers(users) {
    usersContainer.innerHTML = "";
    if (users.length === 0) {
        usersContainer.innerHTML = "<p>No users yet.</p>";
        return;
    }
    users.forEach((user) => {
        const element = document.createElement("div");
        element.classList.add("admin-user");
        element.innerHTML = `
            <div class="admin-user-info">
                <strong>${user.name || "User"}</strong>
                <p>${user.email || "-"}</p>
            </div>
            <div class="admin-user-role">
                <select>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        `;
        const roleSelect = element.querySelector("select");
        roleSelect.value = user.role || "user";
        roleSelect.addEventListener("change", async () => {
            try {
                await updateDoc(doc(db, "users", user.id), {
                    role: roleSelect.value
                });
            } catch (error) {
                console.error(error);
                alert("Could not change role");
                roleSelect.value = user.role || "user";
            }
        });
        usersContainer.appendChild(element);
    });
}

function loadReviews() {
    onSnapshot(collection(db, "reviews"), async (snapshot) => {
        const reviews = [];
        snapshot.forEach((reviewDoc) => {
            reviews.push({
                id: reviewDoc.id,
                ...reviewDoc.data()
            });
        });
        renderAdminReviews(reviews);
    });
}
function renderAdminReviews(reviews) {
    reviewsAdminContainer.innerHTML = "";
    if (reviews.length === 0) {
        reviewsAdminContainer.innerHTML = "<p>No reviews yet.</p>";
        return;
    }
    reviews.forEach((review) => {
        const element = document.createElement("div");
        element.classList.add("admin-review");
        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
        element.innerHTML = `
            <div class="admin-review-info">
                <strong>${review.userName || "User"}</strong>
                <p>${stars}</p>
                <p>${review.text}</p>
                <small>Flower ID: ${review.flowerId}</small>
            </div>
            <button class="delete-review-button">Delete</button>
        `;
        element.querySelector(".delete-review-button").addEventListener("click", async () => {
            if (confirm("Delete this review?")) {
                await deleteDoc(doc(db, "reviews", review.id));
            }
        });
        reviewsAdminContainer.appendChild(element);
    });
}

async function deleteFlower(flowerId) {

    const confirmed = confirm(
        "Delete this flower?"
    );

    if (!confirmed) {
        return;
    }

    await deleteDoc(
        doc(db, "flowers", flowerId)
    );

}