// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALRuLT_7ZLUdjxnMakl5sVbYtV3LFsFnI",
  authDomain: "tangail-efootball-house-dd4c9.firebaseapp.com",
  projectId: "tangail-efootball-house-dd4c9",
  storageBucket: "tangail-efootball-house-dd4c9.firebasestorage.app",
  messagingSenderId: "188200689515",
  appId: "1:188200689515:web:3ac13972a56ac55ebcf62e"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
