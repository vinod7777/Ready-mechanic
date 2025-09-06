// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-storage.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNaavKygiGHPlC1ukYq5ClVk0YPlQ1Kkg",
  authDomain: "readymechanic-f07ca.firebaseapp.com",
  projectId: "readymechanic-f07ca",
  storageBucket: "readymechanic-f07ca.appspot.com", // Corrected from your README, .appspot.com is standard
  messagingSenderId: "954137926104",
  appId: "1:954137926104:web:f2ce6c9a91d0a25847baad",
  measurementId: "G-M860060V3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);