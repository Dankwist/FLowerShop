import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBaTNwEuV6iPnXhCd8IE2tjHYAv9J_FPpY",
    authDomain: "flowershop-236ed.firebaseapp.com",
    projectId: "flowershop-236ed",
    storageBucket: "flowershop-236ed.firebasestorage.app",
    messagingSenderId: "841066499273",
    appId: "1:841066499273:web:e2bef1ad29d2477da69118"
  };

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);