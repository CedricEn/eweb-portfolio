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
  collection,
  getDocs,
  query,
  orderBy,
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
const messagesContainer = document.getElementById("messages-container");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginMessage.textContent = "";
    })
    .catch((error) => {
      console.error(error);
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

    // Kontaktanfragen laden
    try {
      messagesContainer.innerHTML = "<p>Lade Kontaktanfragen...</p>";
      const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        messagesContainer.innerHTML = "<p>Keine Kontaktanfragen gefunden.</p>";
        return;
      }

      messagesContainer.innerHTML = "";
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const messageEl = document.createElement("div");
        messageEl.style.border = "1px solid #ccc";
        messageEl.style.padding = "10px";
        messageEl.style.marginBottom = "10px";
        messageEl.style.borderRadius = "5px";
        messageEl.style.backgroundColor = "#fff";

        const dateStr = data.timestamp?.toDate().toLocaleString() || "kein Datum";

        messageEl.innerHTML = `
          <strong>${data.name}</strong> – <em>${data.email}</em><br />
          <small>${dateStr}</small>
          <p>${data.nachricht}</p>
        `;
        messagesContainer.appendChild(messageEl);
      });
    } catch (error) {
      console.error("Fehler beim Laden der Kontaktanfragen:", error);
      messagesContainer.innerHTML = "<p style='color:red'>Fehler beim Laden der Kontaktanfragen.</p>";
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
