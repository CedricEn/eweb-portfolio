import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async function () {
  const formular = document.getElementById("kontaktformular");
  const meldung = document.getElementById("formular-meldung");

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

  
  formular?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const nachricht = document.getElementById("nachricht").value.trim();

    if (name === "" || email === "" || nachricht === "") {
      meldung.className = "error";
      meldung.textContent = "Bitte fülle alle Pflichtfelder aus.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      meldung.className = "error";
      meldung.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
      return;
    }

    try {
      await addDoc(collection(db, "messages"), {
        name,
        email,
        nachricht,
        timestamp: serverTimestamp(),
      });

      meldung.className = "success";
      meldung.textContent = "Vielen Dank für deine Nachricht!";
      formular.reset();
    } catch (error) {
      console.error("Fehler beim Speichern der Nachricht:", error);
      meldung.className = "error";
      meldung.textContent = "Fehler beim Senden der Nachricht.";
    }
  });

 
  const aboutOutput = document.getElementById("about-output");
  try {
    const docSnap = await getDoc(doc(db, "content", "about"));
    if (docSnap.exists()) {
      aboutOutput.innerHTML = docSnap.data().text;
    } else {
      aboutOutput.textContent = "Noch kein Text vorhanden.";
    }
  } catch (error) {
    console.error("Fehler beim Laden des 'Über Mich'-Textes:", error);
    aboutOutput.textContent = "Fehler beim Laden.";
  }

  
  const burger = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  const navLinks = document.querySelectorAll("#main-nav a");

  burger?.addEventListener("click", () => {
    const isOpen = nav.classList.contains("active");
    if (isOpen) {
      nav.classList.remove("active");
      burger.classList.remove("open");
    } else {
      nav.classList.add("active");
      burger.classList.add("open");
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      burger.classList.remove("open");
    });
  });
});
