import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Master Super Admin Security Rule List
const SUPER_ADMINS = ["hackbyjh@gmail.com"];

// Verify User Authentication & Authorization
onAuthStateChanged(auth, async (user) => {
  if (user && SUPER_ADMINS.includes(user.email)) {
    const adminEmailElem = document.getElementById("admin-email");
    if (adminEmailElem) adminEmailElem.textContent = user.email;
    initAdminFormDropdowns();
  } else {
    alert("Access Denied! Only designated Super Admins can access this panel.");
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

// Populate Games & Services Select Options dynamically
async function initAdminFormDropdowns() {
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

// 1. Add Game Form Submit Handler
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
      initAdminFormDropdowns();
    } catch (err) {
      alert("Error adding game: " + err.message);
    }
  });
}

// 2. Add Service Form Submit Handler
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
      initAdminFormDropdowns();
    } catch (err) {
      alert("Error adding service: " + err.message);
    }
  });
}

// 3. Add Package Form Submit Handler
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
