import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, getDocs, updateDoc, doc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Super Admin Authorization Gate
const SUPER_ADMINS = ["hackbyjh@gmail.com"];

// Authentication Guard & Initialization
onAuthStateChanged(auth, async (user) => {
  if (user && SUPER_ADMINS.includes(user.email)) {
    const adminEmailElem = document.getElementById("admin-email");
    if (adminEmailElem) adminEmailElem.textContent = user.email;
    initAdminDashboard();
  } else {
    alert("Access Denied! You are not authorized as a Super Admin.");
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  }
});

// Admin Logout Listener
const logoutBtn = document.getElementById("admin-logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  });
}

// Master Admin Initialization Handler
async function initAdminDashboard() {
  await populateDropdowns();
  await renderOrders();
  await renderWalletRequests();
}

// Populate Games & Services Select Options Dynamically
async function populateDropdowns() {
  const gameSelect = document.getElementById("service-game-id");
  const serviceSelect = document.getElementById("package-service-id");

  if (gameSelect) {
    gameSelect.innerHTML = '<option value="">Select Game...</option>';
    try {
      const gamesSnap = await getDocs(collection(db, "games"));
      gamesSnap.forEach((docSnap) => {
        gameSelect.innerHTML += `<option value="${docSnap.id}">${docSnap.data().name}</option>`;
      });
    } catch (err) {
      console.error("Error loading games dropdown:", err);
    }
  }

  if (serviceSelect) {
    serviceSelect.innerHTML = '<option value="">Select Service...</option>';
    try {
      const servicesSnap = await getDocs(collection(db, "services"));
      servicesSnap.forEach((docSnap) => {
        serviceSelect.innerHTML += `<option value="${docSnap.id}">${docSnap.data().name}</option>`;
      });
    } catch (err) {
      console.error("Error loading services dropdown:", err);
    }
  }
}

// 1. Add Game Action
const addGameForm = document.getElementById("add-game-form");
if (addGameForm) {
  addGameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "games"), {
        name: document.getElementById("game-name").value,
        logo: document.getElementById("game-logo").value,
        banner: document.getElementById("game-banner").value,
        displayOrder: Number(document.getElementById("game-order").value),
        description: document.getElementById("game-desc").value,
        active: document.getElementById("game-active").checked,
        comingSoon: document.getElementById("game-coming-soon").checked,
        createdAt: serverTimestamp()
      });
      alert("Game added successfully!");
      addGameForm.reset();
      populateDropdowns();
    } catch (err) {
      alert("Error adding game: " + err.message);
    }
  });
}

// 2. Add Service Action
const addServiceForm = document.getElementById("add-service-form");
if (addServiceForm) {
  addServiceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "services"), {
        gameId: document.getElementById("service-game-id").value,
        name: document.getElementById("service-name").value,
        banner: document.getElementById("service-banner").value || "banner.jpg",
        createdAt: serverTimestamp()
      });
      alert("Service added successfully!");
      addServiceForm.reset();
      populateDropdowns();
    } catch (err) {
      alert("Error adding service: " + err.message);
    }
  });
}

// 3. Add Package Action
const addPackageForm = document.getElementById("add-package-form");
if (addPackageForm) {
  addPackageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "packages"), {
        serviceId: document.getElementById("package-service-id").value,
        name: document.getElementById("pkg-name").value,
        image: document.getElementById("pkg-image").value || "logo.png",
        regularPrice: Number(document.getElementById("pkg-price").value),
        offerPrice: Number(document.getElementById("pkg-offer-price").value) || null,
        requirements: {
          konamiId: document.getElementById("req-konami-id").checked,
          konamiPass: document.getElementById("req-konami-pass").checked,
          trxId: document.getElementById("req-trx-id").checked,
          allowWallet: document.getElementById("req-wallet").checked,
          allowWhatsapp: document.getElementById("req-whatsapp").checked
        },
        createdAt: serverTimestamp()
      });
      alert("Package added successfully!");
      addPackageForm.reset();
    } catch (err) {
      alert("Error adding package: " + err.message);
    }
  });
}

// 4. Render Customer Orders List
async function renderOrders() {
  const container = document.getElementById("admin-orders-list");
  if (!container) return;

  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    if (ordersSnap.empty) {
      container.innerHTML = `<p class="text-xs text-gray-400">No active customer orders found.</p>`;
      return;
    }

    container.innerHTML = "";
    ordersSnap.forEach((docSnap) => {
      const ord = docSnap.data();
      const statusColor = ord.status === "Completed" ? "text-green-400" : ord.status === "Cancelled" ? "text-red-400" : "text-amber-400";

      container.innerHTML += `
        <div class="bg-[#121722] p-4 rounded-xl border border-gray-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span class="font-extrabold text-amber-400">${ord.orderId}</span> — <span class="text-white">${ord.packageName}</span> (৳${ord.amount})
            <div class="text-[10px] text-gray-400 mt-1">
              User: ${ord.userEmail} | Method: ${ord.paymentMethod} | TrxID: ${ord.transactionId || 'N/A'} | Sender: ${ord.senderNumber}
            </div>
            ${ord.konamiId ? `<div class="text-[10px] text-amber-300 font-mono mt-0.5">Konami ID: ${ord.konamiId} | Pass: ${ord.konamiPass}</div>` : ''}
            <div class="text-[10px] ${statusColor} font-bold mt-1">Status: ${ord.status}</div>
          </div>
          ${ord.status === "Pending Verification" ? `
            <div class="flex gap-2">
              <button onclick="updateOrderStatus('${docSnap.id}', 'Completed')" class="bg-green-500 hover:bg-green-600 text-black font-extrabold px-3 py-1 rounded text-[10px] shadow">Approve</button>
              <button onclick="updateOrderStatus('${docSnap.id}', 'Cancelled')" class="bg-red-500 hover:bg-red-600 text-white font-extrabold px-3 py-1 rounded text-[10px] shadow">Reject</button>
            </div>
          ` : ''}
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

// Update Order Status Action
window.updateOrderStatus = async function(docId, newStatus) {
  try {
    await updateDoc(doc(db, "orders", docId), { status: newStatus });
    alert(`Order updated to: ${newStatus}`);
    renderOrders();
  } catch (err) {
    alert("Error updating order: " + err.message);
  }
};

// 5. Render Wallet Top-up Requests
async function renderWalletRequests() {
  const container = document.getElementById("admin-wallet-list");
  if (!container) return;

  try {
    const walletSnap = await getDocs(collection(db, "walletRequests"));
    if (walletSnap.empty) {
      container.innerHTML = `<p class="text-xs text-gray-400">No pending wallet requests.</p>`;
      return;
    }

    container.innerHTML = "";
    walletSnap.forEach((docSnap) => {
      const req = docSnap.data();
      const isPending = req.status === "Pending Verification";

      container.innerHTML += `
        <div class="bg-[#121722] p-4 rounded-xl border border-gray-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span class="font-extrabold text-white">${req.userEmail}</span> requested <span class="text-amber-400 font-bold">${req.amount} Store Points</span>
            <div class="text-[10px] text-gray-400 mt-1">
              Method: ${req.paymentMethod} | TrxID: ${req.transactionId} | Sender: ${req.senderNumber}
            </div>
            <div class="text-[10px] text-amber-400 font-bold mt-1">Status: ${req.status}</div>
          </div>
          ${isPending ? `
            <button onclick="approveWalletPoint('${docSnap.id}', '${req.userId}', ${req.amount})" class="bg-amber-400 hover:bg-amber-500 text-black font-extrabold px-3 py-1.5 rounded text-[10px] shadow">
              Approve & Add Points
            </button>
          ` : ''}
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading wallet requests:", err);
  }
}

// Approve Wallet Request & Update User Balance
window.approveWalletPoint = async function(requestId, userId, amount) {
  try {
    // 1. Credit Points to User's Firestore Wallet Document
    await updateDoc(doc(db, "users", userId), {
      walletBalance: increment(amount)
    });

    // 2. Update Status in Wallet Requests Collection
    await updateDoc(doc(db, "walletRequests", requestId), {
      status: "Approved"
    });

    alert("Points credited successfully to user account!");
    renderWalletRequests();
  } catch (err) {
    alert("Error adding points: " + err.message);
  }
};
