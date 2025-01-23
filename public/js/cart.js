import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { API_BASE_URL } from "./config.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
  authDomain: "tiendavapes-4458b.firebaseapp.com",
  projectId: "tiendavapes-4458b",
  storageBucket: "tiendavapes-4458b.firebasestorage.app",
  messagingSenderId: "133976223765",
  appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
  measurementId: "G-D33T0423S5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const cartItemsDiv = document.getElementById("cartItems");
const cartResultDiv = document.getElementById("cartResult");
const btnCheckout = document.getElementById("btnCheckout");
const btnClearCart = document.getElementById("btnClearCart");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loadCart(user.uid);
  } else {
    cartResultDiv.textContent = "No estás autenticado. Redirigiendo...";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  }
});

// Cargar productos del carrito
// Cargar productos del carrito
async function loadCart(uid) {
    try {
      const cartRef = doc(db, "carts", uid);
      const cartSnap = await getDoc(cartRef);
  
      if (!cartSnap.exists()) {
        cartItemsDiv.textContent = "Carrito vacío.";
        return;
      }
  
      let cartData = cartSnap.data();
      if (!cartData.items || cartData.items.length === 0) {
        cartItemsDiv.textContent = "Carrito vacío.";
        return;
      }
  
      const validItems = [];
      const itemsList = await Promise.all(
        cartData.items.map(async (item) => {
          try {
            const productSnap = await getDoc(doc(db, "products", item.productId));
            if (productSnap.exists()) {
              const productData = productSnap.data();
              if (productData.status === "activo") {
                validItems.push(item); // Solo mantener productos activos
                return `
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <img src="${API_BASE_URL}${productData.imagePath || '/default-product.jpg'}" alt="${productData.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                    <p>${productData.name}</p>
                    <p>Cantidad: 
                      <input type="number" id="quantity-${item.productId}" value="${item.quantity}" min="1" />
                    </p>
                    <button onclick="updateCart('${item.productId}')">Actualizar</button>
                    <button onclick="removeFromCart('${item.productId}')">Eliminar</button>
                  </div>
                `;
              } else {
                console.warn(`Producto inactivo eliminado del carrito: ${item.productId}`);
                return "";
              }
            } else {
              console.warn(`Producto no encontrado eliminado del carrito: ${item.productId}`);
              return "";
            }
          } catch (error) {
            console.error(`Error recuperando producto ${item.productId}:`, error);
            return `<div>Error al cargar producto (Cantidad: ${item.quantity})</div>`;
          }
        })
      );
  
      // Actualizar Firestore si hubo cambios en los productos válidos
      if (validItems.length !== cartData.items.length) {
        await updateDoc(cartRef, { items: validItems });
      }
  
      cartItemsDiv.innerHTML = itemsList.filter((item) => item !== "").join("");
  
      if (validItems.length === 0) {
        cartItemsDiv.textContent = "Carrito vacío.";
      }
    } catch (error) {
      cartResultDiv.textContent = "Error cargando carrito: " + error.message;
    }
  }
  
  
  // Actualizar cantidad de producto en el carrito
  async function updateCart(productId) {
    const user = auth.currentUser;
    if (!user) {
      cartResultDiv.textContent = "Debes iniciar sesión.";
      return;
    }
    const newQuantity = parseInt(document.getElementById(`quantity-${productId}`).value, 10);
    if (newQuantity <= 0) {
      cartResultDiv.textContent = "La cantidad debe ser mayor a 0.";
      return;
    }
  
    try {
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });
      const data = await resp.json();
      cartResultDiv.textContent = data.message;
      loadCart(user.uid); // Recargar el carrito
    } catch (error) {
      cartResultDiv.textContent = "Error actualizando carrito: " + error.message;
    }
  }
  
  // Eliminar producto del carrito
  async function removeFromCart(productId) {
    const user = auth.currentUser;
    if (!user) {
      cartResultDiv.textContent = "Debes iniciar sesión.";
      return;
    }
    try {
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE_URL}/api/cart/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      const data = await resp.json();
      cartResultDiv.textContent = data.message;
      loadCart(user.uid); // Recargar el carrito
    } catch (error) {
      cartResultDiv.textContent = "Error eliminando producto: " + error.message;
    }
  }
  window.updateCart = updateCart;
  window.removeFromCart = removeFromCart;
  
  // Vaciar todo el carrito
  btnClearCart.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      cartResultDiv.textContent = "Debes iniciar sesión.";
      return;
    }
    try {
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await resp.json();
      cartResultDiv.textContent = data.message;
      loadCart(user.uid); // Recargar el carrito
    } catch (error) {
      cartResultDiv.textContent = "Error vaciando carrito: " + error.message;
    }
  });
  

// Crear sesión de Stripe Checkout y redirigir
// Crear sesión de Stripe Checkout y redirigir
// Crear sesión de Stripe Checkout y redirigir
btnCheckout.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      cartResultDiv.textContent = "Debes iniciar sesión.";
      return;
    }
  
    try {
      const token = await user.getIdToken();
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);
      const cartData = cartSnap.data();
  
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        cartResultDiv.textContent = "Tu carrito está vacío.";
        return;
      }
  
      // Validar y formatear los datos antes de enviarlos a Stripe
      const items = cartData.items.map((item) => {
        const quantity = parseInt(item.quantity, 10);
      
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Cantidad inválida para el producto: ${item.productId}`);
        }
      
        const priceInCents = 1000; // Simulado, reemplázalo con el precio real
      
        if (isNaN(priceInCents) || priceInCents <= 0) {
          throw new Error(`Precio inválido para el producto: ${item.productId}`);
        }
      
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Producto ${item.productId}`,
            },
            unit_amount: priceInCents,
          },
          quantity,
        };
      });
      
  
      // Imprimir el objeto `items` completo para depuración
      console.log("Datos enviados a Stripe:", items);
  
      const resp = await fetch(`${API_BASE_URL}/api/checkout/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
  
      const data = await resp.json();
      if (resp.ok) {
        // Redirigir a la página de pago de Stripe
        window.location.href = data.url;
      } else {
        cartResultDiv.textContent = "Error al iniciar el pago: " + data.error;
      }
    } catch (error) {
      cartResultDiv.textContent = "Error al procesar la compra: " + error.message;
      console.error("Error detallado:", error);
    }
  });
  
  
