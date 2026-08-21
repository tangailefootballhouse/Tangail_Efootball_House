import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let selectedPackage = null;
let currentUser = null;

const urlParams = new URLSearchParams(window.location.search);
const packageId = urlParams.get("packageId");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    if (packageId) {
      loadPackageDetails(packageId);
    } else {
      alert("No package selected!");
      window.location.href = "index.html";
    }
  } else {
    alert("অর্ডার করতে প্রথমে লগইন করুন!");
    window.location.href = "auth.html";
  }
});

async function loadPackageDetails(id) {
  try {
    const pkgDoc = await getDoc(doc(db, "packages", id));
    if (!pkgDoc.exists()) {
      alert("Package not found!");
      window.location.href = "index.html";
      return;
    }

    selectedPackage = { id: pkgDoc.id, ...pkgDoc.data() };
    renderCheckoutUI();
  } catch (err) {
    console.error("Error loading package:", err);
  }
}

function renderCheckoutUI() {
  const summaryElem = document.getElementById("package-summary");
  const formElem = document.getElementById("checkout-form");
  const displayPrice = selectedPackage.offerPrice || selectedPackage.regularPrice;

  summaryElem.innerHTML = `
    <div class="flex items-center gap-3">
      <img src="${selectedPackage.image}" class="h-12 w-12 object-contain rounded-lg border border-amber-400/20" onerror="this.src='logo.png'">
      <div>
        <h3 class="text-sm font-extrabold text-white">${selectedPackage.name}</h3>
        <p class="text-xs font-bold text-amber-400 mt-0.5">৳${displayPrice}</p>
      </div>
    </div>
  `;

  // Apply Dynamic Requirements Configuration
  const req = selectedPackage.requirements || {};
  if (req.konamiId) document.getElementById("field-konami-id").classList.remove("hidden");
  if (req.konamiPass) document.getElementById("field-konami-pass").classList.remove("hidden");
  if (req.allowWallet) document.getElementById("opt-wallet").classList.remove("hidden");

  formElem.classList.remove("hidden");
}

// Generate Unique Order ID (TEH-YYYYMMDD-XXXX)
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TEH-${dateStr}-${randomNum}`;
}

// Submit Order Form Action
document.getElementById("checkout-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const req = selectedPackage.requirements || {};
  const konamiId = document.getElementById("konami-id").value;
  const konamiPass = document.getElementById("konami-pass").value;
  const paymentMethod = document.getElementById("payment-method").value;
  const trxId = document.getElementById("trx-id").value;
  const senderNumber = document.getElementById("sender-number").value;

  if (req.konamiId && !konamiId) return alert("Please enter Konami Email!");
  if (req.konamiPass && !konamiPass) return alert("Please enter Konami Password!");

  const orderId = generateOrderId();
  const displayPrice = selectedPackage.offerPrice || selectedPackage.regularPrice;

  try {
    await addDoc(collection(db, "orders"), {
      orderId: orderId,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      amount: displayPrice,
      konamiId: konamiId || null,
      konamiPass: konamiPass || null,
      paymentMethod: paymentMethod,
      transactionId: trxId || null,
      senderNumber: senderNumber,
      status: "Pending Verification",
      createdAt: serverTimestamp()
    });

    alert(`অর্ডার সফল হয়েছে! আপনার অর্ডার ID: ${orderId}`);
    window.location.href = "index.html";
  } catch (err) {
    alert("Error placing order: " + err.message);
  }
});
