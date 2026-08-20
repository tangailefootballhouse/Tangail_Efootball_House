// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ আপনার Firebase Web Config তথ্য দিয়ে এগুলো পরিবর্তন করুন
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "tangail-efootball-house.firebaseapp.com",
  projectId: "tangail-efootball-house",
  storageBucket: "tangail-efootball-house.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase সার্ভিস চালু করা হচ্ছে
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔒 UPDATED SYSTEM CONFIGURATION & BUSINESS RULES
export const SYSTEM_CONFIG = {
  ADMIN_EMAIL: "hackbyjh@gmail.com", // ✅ Corrected Admin Email
  WALLET_RULES: {
    EXPIRY: false,
    ALLOW_CASH_OUT: true,
    CASH_OUT_FEE_POINTS: 10,
    REFUND_POLICY: "ADMIN_DISCRETION"
  },
  DEFAULT_REQUIREMENTS: {
    konamiId: true,
    konamiPass: true,
    trxId: true,
    lastNumber: true,
    walletPayment: true,
    whatsappContact: true
  },
  ID_PREFIX: {
    ORDER: "TEH-",
    WALLET: "WAL-"
  }
};
