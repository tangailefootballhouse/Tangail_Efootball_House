import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Master Super Admin Permission List
const SUPER_ADMINS = ["hackbyjh@gmail.com"];

onAuthStateChanged(auth, async (user) => {
  if (user && SUPER_ADMINS.includes(user.email)) {
    document.getElementById("admin-email").textContent = user.email;
    initAdminFormDropdowns();
  } else {
    alert("Unauthorized Access! Super Admin Rights Required.");
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  }
});

// Logout Event
document.getElementById("admin-logout-btn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});

// 1. Add Game Action
document.getElementById("add-game-form").addEventListener("submit", async (e) => {
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
    alert("Game Added Successfully!");
    e.target.reset();
    initAdminFormDropdowns();
  } catch (err) {
    alert("Error adding game: " + err.message);
  }
});

// Load Dropdowns for Services and Packages
async function initAdminFormDropdowns() {
  const gameSelect = document.getElementById("service-game-id");
  gameSelect.innerHTML = '<option value="">Select Game...</option>';
  
  const gamesSnap = await getDocs(collection(db, "games"));
  gamesSnap.forEach((docSnap) => {
    gameSelect.innerHTML += `<option value="${docSnap.id}">${docSnap.data().name}</option>`;
  });

  const serviceSelect = document.getElementById("package-service-id");
  serviceSelect.innerHTML = '<option value="">Select Service...</option>';
  
  const servicesSnap = await getDocs(collection(db, "services"));
  servicesSnap.forEach((docSnap) => {
    serviceSelect.innerHTML += `<option value="${docSnap.id}">${docSnap.data().name}</option>`;
  });
}

// 2. Add Service Action
document.getElementById("add-service-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await addDoc(collection(db, "services"), {
      gameId: document.getElementById("service-game-id").value,
      name: document.getElementById("service-name").value,
      banner: document.getElementById("service-banner").value,
      createdAt: serverTimestamp()
    });
    alert("Service Added Successfully!");
    e.target.reset();
    initAdminFormDropdowns();
  } catch (err) {
    alert("Error adding service: " + err.message);
  }
});

// 3. Add Package Action
document.getElementById("add-package-form").addEventListener("submit", async (e) => {
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
    alert("Package Added Successfully!");
    e.target.reset();
  } catch (err) {
    alert("Error adding package: " + err.message);
  }
});
