document.addEventListener("DOMContentLoaded", function () {
    const formular = document.getElementById("kontaktformular");
    const meldung = document.getElementById("formular-meldung");

    formular.addEventListener("submit", function (e) {
        e.preventDefault(); // verhindert das Abschicken

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const nachricht = document.getElementById("nachricht").value.trim();

        if (name === "" || email === "" || nachricht === "") {
            meldung.textContent = "Bitte fülle alle Pflichtfelder aus.";
            return;
        }

        // einfache E-Mail-Validierung
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            meldung.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
            return;
        }

        meldung.style.color = "green";
        meldung.textContent = "Vielen Dank für deine Nachricht!";

        // Formular leeren (optional)
        formular.reset();
    });
});
