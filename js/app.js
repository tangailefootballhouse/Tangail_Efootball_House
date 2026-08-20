// js/app.js - Main Customer Application Logic
import { auth, db, SYSTEM_CONFIG } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  runTransaction, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;
let userPoints = 0;

// 1. INITIALIZE APP & AUTH LISTENER
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  const walletBadge = document.getElementById("user-wallet-badge");
  const pointsEl = document.getElementById("user-points");

  if (user) {
    walletBadge?.classList.remove("hidden");
    walletBadge?.classList.add("flex");
    await fetchUserWallet(user.uid);
  } else {
    walletBadge?.classList.add("hidden");
  }
  
  // Load initial packages
  loadPackages("efootball");
});

// 2. FETCH USER WALLET BALANCE
async function fetchUserWallet(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      userPoints = userDoc.data().points || 0;
      const pointsEl = document.getElementById("user-points");
      if (pointsEl) pointsEl.textContent = `${userPoints} Pts`;
    }
  } catch (error) {
    console.error("Error fetching wallet:", error);
  }
}

// 3. LOAD DYNAMIC PACKAGES FROM FIRESTORE
async function loadPackages(gameCategory) {
  const container = document.getElementById("dynamic-packages-grid");
  if (!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "services"));
    container.innerHTML = "";

    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="col-span-full py-8 text-center text-gray-400 text-xs bg-[#0f1420] rounded-2xl border border-gray-800">
          বর্তমানে কোনো প্যাকেজ উপলব্ধ নেই। অ্যাডমিন প্যানেল থেকে প্যাকেজ যুক্ত করুন।
        </div>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.game === gameCategory && data.active !== false) {
        const cardHtml = `
          <div class="package-card glass-card">
            ${data.badge ? `<span class="card-badge bg-amber-400/10 text-amber-400 border border-amber-400/30">${data.badge}</span>` : ""}
            <img src="${data.imageUrl || 'assets/logo.png'}" alt="${data.name}" class="package-img">
            <div class="space-y-1">
              <h3 class="font-extrabold text-sm text-white">${data.name}</h3>
              <p class="text-xs text-amber-400 font-bold">${data.price} BDT / ${data.pointsPrice || data.price} Points</p>
            </div>
            <button onclick="placeOrder('${docSnap.id}', '${data.name}', ${data.price})" class="btn-gold w-full text-xs py-2.5">
              Buy Now
            </button>
          </div>
        `;
        container.innerHTML += cardHtml;
      }
    });
  } catch (error) {
    console.error("Error loading packages:", error);
    container.innerHTML = `<div class="col-span-full py-6 text-center text-red-400 text-xs">প্যাকেজ লোড করতে সমস্যা হয়েছে।</div>`;
  }
}

// 4. GENERATE UNIQUE ORDER ID (TEH-YYYYMMDD-XXXX)
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${SYSTEM_CONFIG.ID_PREFIX.ORDER}${dateStr}-${randomNum}`;
}

// 5. PLACE ORDER WITH FRAUD PROTECTION & AUTO-DEDUCT
window.placeOrder = async function(packageId, packageName, price) {
  if (!currentUser) {
    alert("অর্ডার করতে প্রথমে লগইন করুন!");
    window.location.href = "auth.html";
    return;
  }

  const confirmBuy = confirm(`আপনি কি ${packageName} প্যাকেজটি ${price} Points দিয়ে কিনতে চান?`);
  if (!confirmBuy) return;

  try {
    // Transaction for Negative Balance & Double Spending Protection
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("ইউজার অ্যাকাউন্ট পাওয়া যায়নি!");
      }

      const currentBalance = userSnap.data().points || 0;
      if (currentBalance < price) {
        throw new Error("পর্যাপ্ত ওয়ালেট ব্যালেন্স নেই! পয়েন্ট টপ-আপ করুন।");
      }

      // Deduct Points
      const newBalance = currentBalance - price;
      transaction.update(userRef, { points: newBalance });

      // Create Order
      const orderId = generateOrderId();
      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, {
        orderId: orderId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        packageName: packageName,
        packageId: packageId,
        amountPaid: price,
        status: "Pending",
        createdAt: serverTimestamp()
      });

      // Log Audit History
      const logRef = doc(collection(db, "audit_logs"));
      transaction.set(logRef, {
        userId: currentUser.uid,
        action: "ORDER_DEDUCT",
        amount: -price,
        orderId: orderId,
        reason: `Auto-deducted for order #${orderId}`,
        timestamp: serverTimestamp()
      });
    });

    alert("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
    window.location.href = "order.html";
  } catch (error) {
    alert(error.message || "অর্ডার প্রসেস করতে ব্যর্থ হয়েছে।");
  }
};
