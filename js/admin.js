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
const messagesChartCtx = document.getElementById("messagesChart").getContext("2d");

let messagesChart;

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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginSection.style.display = "none";
    adminSection.style.display = "block";

    
    try {
      const docSnap = await getDoc(doc(db, "content", "about"));
      aboutText.value = docSnap.exists() ? docSnap.data().text : "";
    } catch (error) {
      console.error("Fehler beim Laden des About-Texts:", error);
      aboutText.value = "";
    }

    await loadMessagesAndStats();
  } else {
    loginSection.style.display = "block";
    adminSection.style.display = "none";
    loginMessage.textContent = "";
    aboutText.value = "";
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

saveAboutBtn.addEventListener("click", async () => {
  const text = aboutText.value.trim();
  try {
    await setDoc(doc(db, "content", "about"), { text });
    saveStatus.textContent = "Gespeichert!";
    setTimeout(() => (saveStatus.textContent = ""), 3000);
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    saveStatus.textContent = "Fehler beim Speichern.";
  }
});

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
