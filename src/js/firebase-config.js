import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChLLOgR4OTRwcswYyo0Y1JASf5jp8CTTc",
  authDomain: "proyecto-epica-c3d2d.firebaseapp.com",
  projectId: "proyecto-epica-c3d2d",
  storageBucket: "proyecto-epica-c3d2d.firebasestorage.app",
  messagingSenderId: "827017252574",
  appId: "1:827017252574:web:7b8d5d839e12eb0c3efc4f",
  measurementId: "G-WJNVBJYWJ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
