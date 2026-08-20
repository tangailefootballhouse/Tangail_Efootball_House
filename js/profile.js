// js/profile.js - Manage Profile & Logout
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }
  await loadUserData(user);
});

async function loadUserData(user) {
  try {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("profile-name").textContent = data.name || "User";
      document.getElementById("profile-email").textContent = data.email || user.email;
      document.getElementById("profile-phone").textContent = data.phone || "Not Provided";
      document.getElementById("profile-points").textContent = `${data.points || 0} Points`;
      document.getElementById("profile-avatar").textContent = (data.name || "U").charAt(0).toUpperCase();
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

document.getElementById("btn-logout")?.addEventListener("click", async () => {
  if (confirm("আপনি কি নিশ্চিত লগআউট করতে চান?")) {
    await signOut(auth);
    window.location.href = "auth.html";
  }
});
