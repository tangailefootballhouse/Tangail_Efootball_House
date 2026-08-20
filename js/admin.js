// js/admin.js - Admin Dashboard Functionality
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  runTransaction, 
  serverTimestamp,
  query,
  where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Check Admin Access
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }
  document.getElementById("admin-email").textContent = user.email;

  await loadTopUpRequests();
  await loadCustomerOrders();
});

// 1. LOAD TOPUP REQUESTS
async function loadTopUpRequests() {
  const container = document.getElementById("admin-topup-list");
  try {
    const q = query(collection(db, "wallet_requests"), where("status", "==", "Pending"));
    const snap = await getDocs(q);

    document.getElementById("topup-count").textContent = snap.size;

    if (snap.empty) {
      container.innerHTML = `<div class="text-center py-3 text-gray-500 text-[11px]">কোনো পেন্ডিং টপ-আপ রিকোয়েস্ট নেই।</div>`;
      return;
    }

    container.innerHTML = "";
    snap.forEach((docSnap) => {
      const item = docSnap.data();
      const html = `
        <div class="p-3 bg-[#07090e] rounded-xl border border-gray-800 space-y-2">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-bold text-white block">${item.userEmail}</span>
              <span class="text-[10px] text-gray-400">TrxID: <strong class="text-amber-400">${item.trxId}</strong> (${item.senderNumber})</span>
            </div>
            <span class="font-black text-amber-400 text-sm">${item.amount} Pts</span>
          </div>
          <div class="flex gap-2">
            <button onclick="approveTopUp('${docSnap.id}', '${item.userId}', ${item.amount})" class="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 py-1 rounded font-bold text-[11px]">Approve</button>
            <button onclick="rejectTopUp('${docSnap.id}')" class="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 py-1 rounded font-bold text-[11px]">Reject</button>
          </div>
        </div>
      `;
      container.innerHTML += html;
    });
  } catch (error) {
    console.error("Error loading topups:", error);
  }
}

// APPROVE TOPUP (Add points transactionally)
window.approveTopUp = async function(requestId, userId, pointsToAdd) {
  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) throw new Error("ইউজার অ্যাকাউন্ট নেই!");

      const currentPoints = userSnap.data().points || 0;
      transaction.update(userRef, { points: currentPoints + pointsToAdd });

      const reqRef = doc(db, "wallet_requests", requestId);
      transaction.update(reqRef, { status: "Approved" });
    });

    alert("টপ-আপ এপ্রুভ হয়েছে এবং পয়েন্ট যোগ করা হয়েছে!");
    await loadTopUpRequests();
  } catch (error) {
    alert(error.message || "এপ্রুভ করতে ব্যর্থ হয়েছে!");
  }
};

// REJECT TOPUP
window.rejectTopUp = async function(requestId) {
  try {
    await updateDoc(doc(db, "wallet_requests", requestId), { status: "Rejected" });
    alert("রিকুয়েস্ট বাতিল করা হয়েছে!");
    await loadTopUpRequests();
  } catch (error) {
    alert("বাতিল করতে সমস্যা হয়েছে!");
  }
};

// 2. LOAD CUSTOMER ORDERS
async function loadCustomerOrders() {
  const container = document.getElementById("admin-orders-list");
  try {
    const snap = await getDocs(collection(db, "orders"));
    document.getElementById("orders-count").textContent = snap.size;

    if (snap.empty) {
      container.innerHTML = `<div class="text-center py-3 text-gray-500 text-[11px]">কোনো কাস্টমার অর্ডার নেই।</div>`;
      return;
    }

    container.innerHTML = "";
    snap.forEach((docSnap) => {
      const order = docSnap.data();
      const html = `
        <div class="p-3 bg-[#07090e] rounded-xl border border-gray-800 space-y-2">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[10px] text-gray-500 block">ID: ${order.orderId || docSnap.id}</span>
              <span class="font-bold text-white block">${order.packageName}</span>
              <span class="text-[10px] text-gray-400">${order.userEmail}</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-amber-400">${order.status}</span>
          </div>
          <div class="flex gap-2">
            <button onclick="updateOrderStatus('${docSnap.id}', 'Completed')" class="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 py-1 rounded font-bold text-[10px]">Complete</button>
            <button onclick="updateOrderStatus('${docSnap.id}', 'Processing')" class="flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 py-1 rounded font-bold text-[10px]">Processing</button>
            <button onclick="updateOrderStatus('${docSnap.id}', 'Cancelled')" class="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 py-1 rounded font-bold text-[10px]">Cancel</button>
          </div>
        </div>
      `;
      container.innerHTML += html;
    });
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

// UPDATE ORDER STATUS
window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    alert(`অর্ডার স্ট্যাটাস '${newStatus}' করা হয়েছে!`);
    await loadCustomerOrders();
  } catch (error) {
    alert("স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে!");
  }
};

// 3. ADD NEW PACKAGE
document.getElementById("form-add-package")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("pkg-name").value;
  const price = Number(document.getElementById("pkg-price").value);
  const badge = document.getElementById("pkg-badge").value;

  try {
    await addDoc(collection(db, "services"), {
      name: name,
      game: "efootball",
      price: price,
      pointsPrice: price,
      badge: badge || "",
      active: true,
      createdAt: serverTimestamp()
    });

    alert("প্যাকেজ সফলভাবে যুক্ত করা হয়েছে!");
    document.getElementById("form-add-package").reset();
  } catch (error) {
    alert("প্যাকেজ যোগ করতে সমস্যা হয়েছে!");
  }
});
