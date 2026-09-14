import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const registerForm = document.querySelector("#register-form");
const message = document.querySelector("#auth-message");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        console.log("Пользователь создан:", user.uid);

        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            role: "user",
            createdAt: new Date()
        });

        console.log("Документ users создан");

        await auth.signOut();

        window.location.href = "./login.html";

    } catch (error) {
        console.error("Ошибка регистрации:", error);
        message.textContent = error.message;
    }
});