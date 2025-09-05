# Ready-mechanic



firebase 


opy and paste these scripts into the bottom of your <body> tag, but before you use any Firebase services:

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);
</script>