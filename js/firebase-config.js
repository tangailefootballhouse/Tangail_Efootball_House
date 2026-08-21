// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyALRuLT_7ZLUdjxnMakl5sVbYtV3LFsFnI",
  authDomain: "tangail-efootball-house-dd4c9.firebaseapp.com",
  projectId: "tangail-efootball-house-dd4c9",
  storageBucket: "tangail-efootball-house-dd4c9.firebasestorage.app",
  messagingSenderId: "188200689515",
  appId: "1:188200689515:web:3ac13972a56ac55ebcf62e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();
