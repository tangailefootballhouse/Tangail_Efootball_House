// js/order.js - Fetch & Display Customer Orders
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }
  await loadUserOrders(user.uid);
});

async function loadUserOrders(uid) {
  const container = document.getElementById("orders-list-container");
  if (!container) return;

  try {
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="text-center py-10 text-xs text-gray-400 bg-[#0f1420] rounded-2xl border border-gray-800 p-6">
          আপনার কোনো অর্ডার পাওয়া যায়নি।
        </div>`;
      return;
    }

    container.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      const order = docSnap.data();
      
      let statusBadge = "bg-amber-400/10 text-amber-400 border-amber-400/30";
      if (order.status === "Completed") statusBadge = "bg-green-400/10 text-green-400 border-green-400/30";
      if (order.status === "Cancelled") statusBadge = "bg-red-400/10 text-red-400 border-red-400/30";
      if (order.status === "Processing") statusBadge = "bg-cyan-400/10 text-cyan-400 border-cyan-400/30";

      const html = `
        <div class="glass-card p-4 space-y-3 relative">
          <div class="flex justify-between items-start border-b border-gray-800/60 pb-2">
            <div>
              <span class="text-[10px] text-gray-500 font-bold block">ID: ${order.orderId || docSnap.id}</span>
              <h3 class="font-extrabold text-sm text-white mt-0.5">${order.packageName}</h3>
            </div>
            <span class="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${statusBadge}">
              ${order.status}
            </span>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-400">
            <span>Price: <strong class="text-amber-400">${order.amountPaid} Points</strong></span>
            <span class="text-[10px] text-gray-500">${order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("bn-BD") : 'N/A'}</span>
          </div>
        </div>
      `;
      container.innerHTML += html;
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    container.innerHTML = `<div class="text-center py-6 text-xs text-red-400">অর্ডার লোড করতে সমস্যা হয়েছে।</div>`;
  }
}
