import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    document.getElementById("user-email-display").textContent = user.email;
    loadWalletBalance(user.uid);
  } else {
    window.location.href = "auth.html";
  }
});

async function loadWalletBalance(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const balance = userDoc.data().walletBalance || 0;
      document.getElementById("wallet-balance").textContent = `${balance} Points`;
    }
  } catch (err) {
    console.error("Error loading wallet balance:", err);
  }
}

// Request Store Points Action
document.getElementById("buy-points-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = Number(document.getElementById("point-amount").value);
  const method = document.getElementById("wallet-payment-method").value;
  const trxId = document.getElementById("wallet-trx-id").value;
  const senderNumber = document.getElementById("wallet-sender-number").value;

  try {
    await addDoc(collection(db, "walletRequests"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      amount: amount,
      paymentMethod: method,
      transactionId: trxId,
      senderNumber: senderNumber,
      status: "Pending Verification",
      createdAt: serverTimestamp()
    });

    alert("পয়েন্ট রিকোয়েস্ট সাবমিট হয়েছে! এডমিন ভেরিফাই করে পয়েন্ট যোগ করে দেবে।");
    document.getElementById("buy-points-form").reset();
  } catch (err) {
    alert("Error submitting request: " + err.message);
  }
});
