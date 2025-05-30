// Firebaseimporte für Datenbank und Authentifizierung
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

// Konfiguration und Initialisierung von Firebase
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

// DOM-Elemente referenzieren
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const logoutButton = document.getElementById("logout-button");
const saveAboutBtn = document.getElementById("saveAboutBtn");
const saveStatus = document.getElementById("save-status");
const messagesContainer = document.getElementById("messages-container");
const messagesChartCtx = document.getElementById("messagesChart").getContext("2d");

// Referenz auf Chart-Objekt für Aktualisierung
let messagesChart;

// Quill Rich-Text-Editor initialisieren
const aboutEditor = new Quill("#aboutEditor", {
  theme: "snow",
  placeholder: "Schreibe hier deinen ‚Über mich‘-Text...",
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      ["link", "blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  },
});

// Authentifizierung für das Login mit Firebase
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginMessage.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      console.error(error);
      loginMessage.textContent = "Login fehlgeschlagen: " + error.message;
    });
});

// Login und Logout Status überwachen
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginSection.style.display = "none";
    adminSection.style.display = "block";

    // "Über-Mich" Text laden
    try {
      const docSnap = await getDoc(doc(db, "content", "about"));
      if (docSnap.exists()) {
        
        aboutEditor.root.innerHTML = docSnap.data().text || "";
      } else {
        aboutEditor.root.innerHTML = "";
      }
    } catch (error) {
      console.error("Fehler beim Laden des About-Texts:", error);
      aboutEditor.root.innerHTML = "";
    }

    
    await loadMessagesAndStats();
  } else {
    // Nach Logout Admin-Inhalte zurücksetzen
    loginSection.style.display = "block";
    adminSection.style.display = "none";
    loginMessage.textContent = "";
    aboutEditor.root.innerHTML = "";
    messagesContainer.innerHTML = "";
    if (messagesChart) {
      messagesChart.destroy();
      messagesChart = null;
    }
  }
});

logoutButton.addEventListener("click", () => {
  signOut(auth);
});

// "Über-Mich" Inhalt speichern
saveAboutBtn.addEventListener("click", async () => {
  
  const htmlContent = aboutEditor.root.innerHTML.trim();

  try {
    await setDoc(doc(db, "content", "about"), { text: htmlContent });
    saveStatus.textContent = "Gespeichert!";
    setTimeout(() => (saveStatus.textContent = ""), 3000);
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    saveStatus.textContent = "Fehler beim Speichern.";
  }
});

// Kontaktanfragen und Statisktidaten laden
async function loadMessagesAndStats() {
  messagesContainer.innerHTML = "<p>Lade Kontaktanfragen...</p>";
  try {
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      messagesContainer.innerHTML = "<p>Keine Kontaktanfragen gefunden.</p>";
      updateChart([], []);
      return;
    }

    const stats = {};
    const allMessages = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allMessages.push(data);

      const dateObj = data.timestamp?.toDate();
      if (dateObj) {
        const dayKey = dateObj.toISOString().split("T")[0];
        stats[dayKey] = (stats[dayKey] || 0) + 1;
      }
    });

    renderMessages(allMessages);
    const sortedDates = Object.keys(stats).sort();
    const counts = sortedDates.map((d) => stats[d]);
    updateChart(sortedDates, counts);
  } catch (error) {
    console.error("Fehler beim Laden der Kontaktanfragen:", error);
    messagesContainer.innerHTML = "<p class='error'>Fehler beim Laden der Kontaktanfragen.</p>";
  }
}

// Nachrichten anzeigen, "Mehr Anzeigen" Funktion laden
function renderMessages(messages) {
  messagesContainer.innerHTML = "";

  const initialCount = 3;
  const container = messagesContainer;

  if (messages.length === 0) {
    container.innerHTML = "<p>Keine Kontaktanfragen gefunden.</p>";
    return;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const div = document.createElement("div");
    div.className = "message";
    const dateStr = msg.timestamp?.toDate()?.toLocaleString() || "kein Datum";

    div.innerHTML = `
      <strong>${escapeHtml(msg.name)}</strong><em>&lt;${escapeHtml(msg.email)}&gt;</em>
      <small>${dateStr}</small>
      <p>${escapeHtml(msg.nachricht)}</p>
    `;

    if (i >= initialCount) {
      div.style.display = "none";
      div.classList.add("extra-message");
    }

    container.appendChild(div);
  }

  // Button zum Ein und Ausblenden der weiteren Nachrichten
  if (messages.length > initialCount) {
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "Weitere anzeigen";
    toggleBtn.className = "toggle-more-btn";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.addEventListener("click", () => {
      const extras = container.querySelectorAll(".extra-message");
      const isHidden = extras[0].style.display === "none";
      extras.forEach((el) => (el.style.display = isHidden ? "block" : "none"));
      toggleBtn.textContent = isHidden ? "Weniger anzeigen" : "Weitere anzeigen";
      toggleBtn.setAttribute("aria-expanded", isHidden);
    });
    container.appendChild(toggleBtn);
  }
}

// Charts.js Grafik initialisieren oder aktualisieren
function updateChart(labels, data) {
  if (messagesChart) {
    messagesChart.data.labels = labels;
    messagesChart.data.datasets[0].data = data;
    messagesChart.update();
  } else {
    messagesChart = new Chart(messagesChartCtx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Kontaktanfragen pro Tag",
          data,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75,192,192,0.2)",
          fill: true,
          tension: 0.2,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: {
            title: { display: true, text: "Datum" },
            ticks: { maxRotation: 45, minRotation: 30 },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Anzahl Anfragen" },
            ticks: { stepSize: 1, precision: 0 },
          },
        },
      },
    });
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
