// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNaavKygiGHPlC1ukYq5ClVk0YPlQ1Kkg",
  authDomain: "readymechanic-f07ca.firebaseapp.com",
  projectId: "readymechanic-f07ca",
  storageBucket: "readymechanic-f07ca.firebasestorage.app",
  messagingSenderId: "954137926104",
  appId: "1:954137926104:web:f2ce6c9a91d0a25847baad",
  measurementId: "G-M860060V3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };