
import { auth } from "./firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

export async function logout() {
    await signOut(auth);
    window.location.href = "./login.html";
}

