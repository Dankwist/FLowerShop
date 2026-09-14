import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


const flowersContainer = document.querySelector("#flowers-container");

const flowersRef = query(
    collection(db, "flowers"),
    where("featured", "==", true)
);

const snapshot = await getDocs(flowersRef);


snapshot.forEach((doc) => {

    const flower = doc.data();

    const card = document.createElement("div");

    card.classList.add("selers-card");

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