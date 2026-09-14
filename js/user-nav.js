import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const profileLink = document.querySelector("#profile-link");
const adminLink = document.querySelector("#admin-link");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        profileLink.innerHTML = `
            <img src="../icons/profile-icon.png" alt="profile">
        `;

        profileLink.href = "./login.html";

        if (adminLink) {
            adminLink.style.display = "none";
        }

        return;
    }

    try {

        const userDoc = await getDoc(
            doc(db, "users", user.uid)
        );

        if (userDoc.exists()) {

            const userData = userDoc.data();

            profileLink.innerHTML = `
                <span class="profile-name">
                    ${userData.name}
                </span>
            `;

            profileLink.href = "./profile.html";

            if (adminLink && userData.role === "admin") {
                adminLink.style.display = "block";
            }

        }

    } catch (error) {

        console.error(
            "Ошибка загрузки пользователя:",
            error
        );

    }

});