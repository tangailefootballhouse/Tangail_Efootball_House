import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  loadStorePackages();
});

// Fetch and render packages from Firestore Database
async function loadStorePackages() {
  const container = document.getElementById("services-grid");
  if (!container) return;

  try {
    const packagesSnap = await getDocs(collection(db, "packages"));
    
    if (packagesSnap.empty) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8 glass-card rounded-xl text-gray-400 text-xs border border-gray-800">
          কোনো প্যাকেজ পাওয়া যায়নি। অ্যাডমিন প্যানেল (admin.html) থেকে নতুন প্যাকেজ যোগ করুন।
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    packagesSnap.forEach((docSnap) => {
      const pkg = docSnap.data();
      const displayPrice = pkg.offerPrice ? pkg.offerPrice : pkg.regularPrice;
      const strikePrice = pkg.offerPrice ? `<span class="line-through text-gray-500 text-[10px] ml-1.5">৳${pkg.regularPrice}</span>` : '';

      container.innerHTML += `
        <div class="glass-card p-4 rounded-xl border border-gray-800 hover:border-amber-400/40 transition-all flex items-center justify-between shadow-md">
          <div class="flex items-center gap-3">
            <img src="${pkg.image}" alt="${pkg.name}" class="h-12 w-12 object-contain rounded-lg border border-amber-400/20 bg-black/20" onerror="this.src='logo.png'">
            <div>
              <h4 class="text-xs font-extrabold text-white leading-tight">${pkg.name}</h4>
              <p class="text-xs font-bold text-amber-400 mt-1">৳${displayPrice} ${strikePrice}</p>
            </div>
          </div>
          <button onclick="buyPackage('${docSnap.id}')" class="bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg shadow-md transition-all">
            BUY
          </button>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error fetching store packages:", err);
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-red-400 text-xs glass-card rounded-xl border border-red-500/20">
        ডাটা লোড করতে সমস্যা হয়েছে: ${err.message}
      </div>
    `;
  }
}

// Global Purchase Function Trigger
window.buyPackage = function(packageId) {
  window.location.href = `order.html?packageId=${packageId}`;
};
