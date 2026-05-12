import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgASL9k3HJtEmOB34fFc9qCEJNBg1sjR8",
  authDomain: "matchup-27ba9.firebaseapp.com",
  projectId: "matchup-27ba9",
  storageBucket: "matchup-27ba9.firebasestorage.app",
  messagingSenderId: "79814809653",
  appId: "1:79814809653:web:efbb824748ed1f6f3a397c",
  measurementId: "G-V4QKNRZDPW",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
