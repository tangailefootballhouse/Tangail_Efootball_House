// js/auth.js - Authentication Functionality
import { auth, db } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tab Switching
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

tabLogin?.addEventListener("click", () => {
  tabLogin.classList.add("bg-[#0f1420]", "text-amber-400");
  tabSignup.classList.remove("bg-[#0f1420]", "text-amber-400");
  tabSignup.classList.add("text-gray-400");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
});

tabSignup?.addEventListener("click", () => {
  tabSignup.classList.add("bg-[#0f1420]", "text-amber-400");
  tabLogin.classList.remove("bg-[#0f1420]", "text-amber-400");
  tabLogin.classList.add("text-gray-400");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

// Login Execution
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("লগইন সফল হয়েছে!");
    window.location.href = "index.html";
  } catch (error) {
    alert("ভুল ইমেইল বা পাসওয়ার্ড দিয়েছেন!");
  }
});

// Sign Up Execution
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const phone = document.getElementById("signup-phone").value;
  const password = document.getElementById("signup-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Initialize User Data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      phone: phone,
      points: 0,
      createdAt: serverTimestamp()
    });

    alert("অ্যাসিউন্ট তৈরি সফল হয়েছে!");
    window.location.href = "index.html";
  } catch (error) {
    alert(error.message || "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।");
  }
});

// Forgot Password
document.getElementById("btn-forgot")?.addEventListener("click", async () => {
  const email = prompt("আপনার রেজিস্টার্ড ইমেইল এড্রেসটি লিখুন:");
  if (email) {
    try {
      await sendPasswordResetEmail(auth, email);
      alert("ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!");
    } catch (error) {
      alert("ইমেইলটি পাওয়া যায়নি।");
    }
  }
});
