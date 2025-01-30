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
document.addEventListener("navbarLoaded", () => {
  const navCartButton = document.getElementById("navCartButton");

  if (navCartButton) {
    navCartButton.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        showErrorModal("Debes iniciar sesión para ver tu carrito.");
        return;
      }

      try {
        await loadCart(user.uid);
        const bootstrapModal = new bootstrap.Modal(document.getElementById("cartModal"));
        bootstrapModal.show();
      } catch (error) {
        console.error("Error al cargar el carrito:", error.message);
      }
    });
  }
  function showErrorModal(message) {
    const modalBody = document.getElementById("errorModalBody");
    if (modalBody) {
      modalBody.textContent = message;
      const errorModalInstance = new bootstrap.Modal(errorModal);
      errorModalInstance.show();
    } else {
      console.error("El modal de error no está disponible.");
    }
  }
});

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
        window.location.href = "index.html";
      } else {
        // Si es un usuario normal, redirigir a la tienda
        window.location.href = "store.html";
      }
    } catch (error) {
      document.getElementById("result").textContent = "Error login: " + error.message;
    }
  });

const btnSignupUser = document.getElementById("btnSignupUser");
// frontend/public/js/login.js
btnSignupUser.addEventListener("click", async () => {
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPass").value;

  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/createUser`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await resp.json();
    
    if (!resp.ok) {
      // Manejar errores HTTP
      const errorMsg = data.error || 'Error desconocido';
      throw new Error(`Error ${resp.status}: ${errorMsg}`);
    }

    document.getElementById("result").textContent = "Usuario creado: " + data.data.email;
    
  } catch (error) {
    console.error("Error completo:", error);
    document.getElementById("result").textContent = error.message;
    
    // Mostrar el error en el modal
    const errorBody = document.getElementById("errorModalBody");
    if (errorBody) {
      errorBody.textContent = error.message;
      new bootstrap.Modal(document.getElementById('errorModal')).show();
    }
  }
});
