import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async function () {
  const formular = document.getElementById("kontaktformular");
  const meldung = document.getElementById("formular-meldung");

  formular?.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const nachricht = document.getElementById("nachricht").value.trim();

    if (name === "" || email === "" || nachricht === "") {
      meldung.textContent = "Bitte fülle alle Pflichtfelder aus.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      meldung.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
      return;
    }

    meldung.style.color = "green";
    meldung.textContent = "Vielen Dank für deine Nachricht!";
    formular.reset();
  });

  const firebaseConfig = {
    apiKey: "AIzaSyAQrOILKOCE0Ye5NQ60ADF1H36m26nEdQ4",
    authDomain: "eweb-portfolio.firebaseapp.com",
    projectId: "eweb-portfolio",
    storageBucket: "eweb-portfolio.appspot.com",
    messagingSenderId: "904754836120",
    appId: "1:904754836120:web:4a7cecf0d6bd0502b6d6ed",
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  
  const aboutOutput = document.getElementById("about-output");
  try {
    const docSnap = await getDoc(doc(db, "content", "about"));
    if (docSnap.exists()) {
      aboutOutput.textContent = docSnap.data().text;
    } else {
      aboutOutput.textContent = "Noch kein Text vorhanden.";
    }
  } catch (error) {
    console.error("Fehler beim Laden des 'Über Mich'-Textes:", error);
    aboutOutput.textContent = "Fehler beim Laden.";
  }
});
