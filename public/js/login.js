// frontend/public/js/login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { API_BASE_URL } from "./config.js";
// Config de tu proyecto
const firebaseConfig = {
    apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
    authDomain: "tiendavapes-4458b.firebaseapp.com",
    projectId: "tiendavapes-4458b",
    storageBucket: "tiendavapes-4458b.firebasestorage.app",
    messagingSenderId: "133976223765",
    appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
    measurementId: "G-D33T0423S5"
  };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Botones
const btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;
  
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      document.getElementById("result").textContent = "Login exitoso!";
      console.log("Usuario logeado: ", userCred.user.email);
  
      // Obtener el token del usuario para verificar el rol
      const token = await userCred.user.getIdTokenResult();
  
      if (token.claims.role === "admin") {
        // Si es admin, redirigir al panel de admin
        window.location.href = "admin.html";
      } else {
        // Si es un usuario normal, redirigir a la tienda
        window.location.href = "store.html";
      }
    } catch (error) {
      document.getElementById("result").textContent = "Error login: " + error.message;
    }
  });

const btnSignupUser = document.getElementById("btnSignupUser");
btnSignupUser.addEventListener("click", async () => {
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPass").value;

  try {
    // Llamamos a nuestro backend para crear un user (rol: user)
    const resp = await fetch(`${API_BASE_URL}/api/auth/createUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await resp.json();
    document.getElementById("result").textContent = JSON.stringify(data);
  } catch (error) {
    document.getElementById("result").textContent = "Error signup user: " + error.message;
  }
});
