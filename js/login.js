
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
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
const forgotPassword = document.querySelector("#forgot-password");
forgotPassword.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#email").value.trim();
    if (!email) {
        message.textContent = "Enter your email first.";
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        message.textContent = "Password reset email sent.";
    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
});

