import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQrOILKOCE0Ye5NQ60ADF1H36m26nEdQ4",
  authDomain: "eweb-portfolio.firebaseapp.com",
  projectId: "eweb-portfolio",
  storageBucket: "eweb-portfolio.appspot.com",
  messagingSenderId: "904754836120",
  appId: "1:904754836120:web:4a7cecf0d6bd0502b6d6ed",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const logoutButton = document.getElementById("logout-button");
const aboutText = document.getElementById("aboutText");
const saveAboutBtn = document.getElementById("saveAboutBtn");
const saveStatus = document.getElementById("save-status");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginMessage.textContent = "";
    })
    .catch((error) => {
      console.error(error); // wichtig zur Fehlersuche
      loginMessage.textContent = "Login fehlgeschlagen: " + error.message;
    });
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginSection.style.display = "none";
    adminSection.style.display = "block";

    try {
      const docSnap = await getDoc(doc(db, "content", "about"));
      if (docSnap.exists()) {
        aboutText.value = docSnap.data().text;
      }
    } catch (error) {
      console.error("Fehler beim Laden des About-Texts:", error);
    }
  } else {
    loginSection.style.display = "block";
    adminSection.style.display = "none";
  }
});

logoutButton.addEventListener("click", () => {
  signOut(auth);
});

saveAboutBtn.addEventListener("click", async () => {
  const text = aboutText.value;
  try {
    await setDoc(doc(db, "content", "about"), { text });
    saveStatus.textContent = "Gespeichert!";
    setTimeout(() => (saveStatus.textContent = ""), 3000);
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    saveStatus.textContent = "Fehler beim Speichern.";
  }
});
