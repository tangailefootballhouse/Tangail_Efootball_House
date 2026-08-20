// js/wallet.js - Customer Wallet Management & Trx
import { auth, db, SYSTEM_CONFIG } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;
let currentPoints = 0;

// Tab Toggles
const btnTopup = document.getElementById("btn-show-topup");
const btnCashout = document.getElementById("btn-show-cashout");
const formTopup = document.getElementById("form-topup");
const formCashout = document.getElementById("form-cashout");

btnTopup?.addEventListener("click", () => {
  btnTopup.classList.add("bg-[#07090e]", "text-amber-400");
  btnCashout.classList.remove("bg-[#07090e]", "text-amber-400");
  btnCashout.classList.add("text-gray-400");
  formTopup.classList.remove("hidden");
  formCashout.classList.add("hidden");
});

btnCashout?.addEventListener("click", () => {
  btnCashout.classList.add("bg-[#07090e]", "text-amber-400");
  btnTopup.classList.remove("bg-[#07090e]", "text-amber-400");
  btnTopup.classList.add("text-gray-400");
  formCashout.classList.remove("hidden");
  formTopup.classList.add("hidden");
});

// Auth Listener
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }
  currentUser = user;
  await loadWalletData();
  await loadWalletHistory();
});

// Load Wallet Balance
async function loadWalletData() {
  try {
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (userSnap.exists()) {
      currentPoints = userSnap.data().points || 0;
      document.getElementById("wallet-balance").textContent = `${currentPoints} Points`;
    }
  } catch (error) {
    console.error("Error loading balance:", error);
  }
}

// Top Up Form Submission
formTopup?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = Number(document.getElementById("topup-amount").value);
  const number = document.getElementById("topup-number").value.trim();
  const trxId = document.getElementById("topup-trxid").value.trim().toUpperCase();

  try {
    // Check duplicate TrxID
    const duplicateQuery = query(collection(db, "wallet_requests"), where("trxId", "==", trxId));
    const duplicateSnap = await getDocs(duplicateQuery);

    if (!duplicateSnap.empty) {
      alert("এই TrxID টি দিয়ে ইতিমধ্যেই রিকুয়েস্ট করা হয়েছে!");
      return;
    }

    await addDoc(collection(db, "wallet_requests"), {
      requestId: `${SYSTEM_CONFIG.ID_PREFIX.WALLET}${Date.now()}`,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      type: "TOPUP",
      amount: amount,
      senderNumber: number,
      trxId: trxId,
      status: "Pending",
      createdAt: serverTimestamp()
    });

    alert("টপ-আপ রিকুয়েস্ট সফলভাবে জমা হয়েছে। অ্যাডমিন ভেরিফাই করে পয়েন্ট যোগ করে দেবে।");
    formTopup.reset();
    await loadWalletHistory();
  } catch (error) {
    alert("রিকুয়েস্ট সাবমিট করতে সমস্যা হয়েছে!");
  }
});

// Cash Out Submission
formCashout?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = Number(document.getElementById("cashout-amount").value);
  const method = document.getElementById("cashout-method").value.trim();
  const totalDeduction = amount + SYSTEM_CONFIG.WALLET_RULES.CASH_OUT_FEE_POINTS;

  if (currentPoints < totalDeduction) {
    alert(`পর্যাপ্ত ব্যালেন্স নেই! ক্যাশ-আউট ফি সহ মোট ${totalDeduction} Points প্রয়োজন।`);
    return;
  }

  try {
    await addDoc(collection(db, "wallet_requests"), {
      requestId: `${SYSTEM_CONFIG.ID_PREFIX.WALLET}${Date.now()}`,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      type: "CASHOUT",
      amount: amount,
      fee: SYSTEM_CONFIG.WALLET_RULES.CASH_OUT_FEE_POINTS,
      paymentMethod: method,
      status: "Pending",
      createdAt: serverTimestamp()
    });

    alert("ক্যাশ-আউট রিকুয়েস্ট সফলভাবে জমা হয়েছে!");
    formCashout.reset();
    await loadWalletHistory();
  } catch (error) {
    alert("ক্যাশ-আউট রিকুয়েস্ট প্রসেস করতে ব্যর্থ হয়েছে!");
  }
});

// Load Wallet Transaction History
async function loadWalletHistory() {
  const container = document.getElementById("wallet-history-list");
  if (!container) return;

  try {
    const q = query(collection(db, "wallet_requests"), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<div class="text-center py-6 text-xs text-gray-500 bg-[#0f1420] rounded-xl border border-gray-800">কোনো ওয়ালেট ট্রানজেকশন পাওয়া যায়নি।</div>`;
      return;
    }

    container.innerHTML = "";
    snap.forEach((docSnap) => {
      const item = docSnap.data();
      const statusColor = item.status === "Approved" ? "text-green-400" : item.status === "Rejected" ? "text-red-400" : "text-amber-400";
      
      const html = `
        <div class="glass-card p-3 flex justify-between items-center text-xs">
          <div>
            <span class="font-extrabold text-white block">${item.type === "TOPUP" ? "Top-Up" : "Cash-Out"}</span>
            <span class="text-[10px] text-gray-400">${item.trxId || item.paymentMethod || 'Wallet Tx'}</span>
          </div>
          <div class="text-right">
            <span class="font-bold block text-white">${item.amount} Pts</span>
            <span class="text-[10px] font-bold ${statusColor}">${item.status}</span>
          </div>
        </div>
      `;
      container.innerHTML += html;
    });
  } catch (error) {
    console.error("Error loading history:", error);
  }
}
