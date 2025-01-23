import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
  authDomain: "tiendavapes-4458b.firebaseapp.com",
  projectId: "tiendavapes-4458b",
  storageBucket: "tiendavapes-4458b.firebasestorage.app",
  messagingSenderId: "133976223765",
  appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
  measurementId: "G-D33T0423S5"
};

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar Firebase solo si no está inicializado
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  const auth = getAuth(app);
  const navbarDiv = document.getElementById("navbar");

  onAuthStateChanged(auth, async (user) => {
    let navbarPath = "/components/navbar-default.html"; // Por defecto

    if (user) {
      const token = await user.getIdTokenResult();
      if (token.claims.role === "admin") {
        navbarPath = "/components/navbar-admin.html"; // Admin
      } else if (token.claims.role === "user") {
        navbarPath = "/components/navbar-user.html"; // Usuario normal
      }
    }

    // Cargar el archivo de navbar correspondiente
    fetch(navbarPath)
      .then((response) => response.text())
      .then((html) => {
        navbarDiv.innerHTML = html;

        // Si es admin o user, agregar lógica de cierre de sesión
        if (user) {
          const logoutButton = document.getElementById("logoutButton");
          if (logoutButton) {
            logoutButton.addEventListener("click", async () => {
              try {
                await auth.signOut();
                alert("Sesión cerrada correctamente.");
                window.location.href = "index.html";
              } catch (error) {
                console.error("Error cerrando sesión:", error);
              }
            });
          }
        }
      })
      .catch((error) => {
        console.error("Error cargando la navbar:", error);
      });
  });
});
