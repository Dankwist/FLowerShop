
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const loginForm = document.querySelector("#login-form");
const message = document.querySelector("#auth-message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    try {
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        window.location.href = "./index.html";

    } catch (error) {
        message.textContent = error.message;
    }
});

