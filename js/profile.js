import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SUPER_ADMINS = ["hackbyjh@gmail.com"];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Set Email & Avatar
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("avatar-initial").textContent = user.email.charAt(0).toUpperCase();

  // Check Admin Rights for Special Link
  if (SUPER_ADMINS.includes(user.email)) {
    document.getElementById("profile-role").textContent = "Super Admin Account";
    document.getElementById("profile-role").classList.add("text-amber-400");
    const adminLink = document.getElementById("admin-hub-link");
    if (adminLink) adminLink.classList.remove("hidden");
  }

  // Load Firestore Wallet Balance
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const balance = userDoc.data().walletBalance || 0;
      document.getElementById("profile-wallet").textContent = `${balance} Points`;
    }
  } catch (err) {
    console.error("Error loading profile details:", err);
  }
});

// Logout Listener
document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
