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

document.addEventListener("navbarLoaded", () => {
  const navCartButton = document.getElementById("navCartButton");
  
  if (navCartButton) {
    navCartButton.style.display = "none"; // 🔹 Oculta el botón "Ver Carrito" en cart.html
  }
  console.log("hola");
});


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
async function loadCart(uid) {
  try {
    const cartRef = doc(db, "carts", uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists() || !cartSnap.data().items.length) {
      cartItemsDiv.innerHTML = `<p class="cart-empty">Tu carrito está vacío.</p>`;
      return;
    }

    const itemsList = await Promise.all(
      cartSnap.data().items.map(async (item) => {
        const productSnap = await getDoc(doc(db, "products", item.productId));
        if (productSnap.exists()) {
          const product = productSnap.data();
          const totalPrice = (item.quantity * product.price).toFixed(2); // Precio total calculado

          return `
            <div class="cart-item" id="cart-item-${item.productId}">
              <!-- Imagen -->
              <img src="${API_BASE_URL}${product.imagePath || '/default-product.jpg'}" alt="${product.name}" class="cart-item-img">
              
              <!-- Contenido -->
              <div class="cart-item-content">
                <!-- Nombre del producto -->
                <h5 class="cart-item-name">${product.name}</h5>
                <!-- Precio total -->
                <p class="cart-item-price">Precio total: $<span id="total-price-${item.productId}">${totalPrice}</span></p>
              </div>

              <!-- Controles de cantidad y botón eliminar -->
              <div class="cart-item-actions">
                <div class="quantity-controls">
                  <input 
                    type="number" 
                    id="quantity-${item.productId}" 
                    value="${item.quantity}" 
                    min="1" 
                    class="cart-item-quantity" 
                    readonly
                  />
                  <button 
                    class="btn-quantity" 
                    onclick="updateQuantity('${item.productId}', 1)"
                  >+</button>
                  <button 
                    class="btn-quantity" 
                    onclick="updateQuantity('${item.productId}', -1)"
                  >−</button>
                </div>
                <button 
                  class="btn btn-danger btn-icon" 
                  onclick="removeFromCart('${item.productId}')"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          `;
        }
        return ""; // Si el producto no existe, devuelve una cadena vacía
      })
    );

    cartItemsDiv.innerHTML = itemsList.filter(Boolean).join("");
  } catch (error) {
    cartResultDiv.textContent = `Error cargando carrito: ${error.message}`;
  }
}


async function updateQuantity(productId, change) {
  const user = auth.currentUser;
  if (!user) {
    cartResultDiv.textContent = "Debes iniciar sesión.";
    return;
  }

  // Obtener el input de cantidad y el precio total
  const input = document.getElementById(`quantity-${productId}`);
  const totalPriceSpan = document.getElementById(`total-price-${productId}`);

  let currentQuantity = parseInt(input.value, 10);
  const newQuantity = currentQuantity + change;

  // Evitar que la cantidad sea menor que 1
  if (newQuantity < 1) return;

  input.value = newQuantity;

  // Actualizar el precio total dinámicamente
  const productPrice = parseFloat(totalPriceSpan.textContent) / currentQuantity;
  const newTotalPrice = (newQuantity * productPrice).toFixed(2);
  totalPriceSpan.textContent = newTotalPrice;

  // Actualizar la base de datos
  try {
    const cartRef = doc(db, "carts", user.uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      cartResultDiv.textContent = "El carrito no existe.";
      return;
    }

    const cartData = cartSnap.data();
    const updatedItems = cartData.items.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    await updateDoc(cartRef, { items: updatedItems });
    cartResultDiv.textContent = "Cantidad actualizada correctamente.";
  } catch (error) {
    cartResultDiv.textContent = "Error actualizando cantidad: " + error.message;
  }
}






// Vaciar carrito y actualizar cantidades al comprar
btnCheckout.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    cartResultDiv.textContent = "Debes iniciar sesión.";
    return;
  }

  try {
    // Actualizar las cantidades en la base de datos
    const inputs = document.querySelectorAll(".cart-item-quantity");
    const cartRef = doc(db, "carts", user.uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      cartResultDiv.textContent = "Tu carrito está vacío.";
      return;
    }

    const cartData = cartSnap.data();
    const updatedItems = cartData.items.map((item) => {
      const input = document.getElementById(`quantity-${item.productId}`);
      const newQuantity = parseInt(input.value, 10);
      return { ...item, quantity: newQuantity };
    });

    // Actualizar la base de datos con las nuevas cantidades
    await updateDoc(cartRef, { items: updatedItems });

    // Proceder al pago
    const token = await user.getIdToken();
    const items = updatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Producto ${item.productId}`,
        },
        unit_amount: 1000, // Simulado, reemplázalo con el precio real
      },
      quantity: item.quantity,
    }));

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
  }
});


// Vaciar carrito y actualizar cantidades al comprar
btnCheckout.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    cartResultDiv.textContent = "Debes iniciar sesión.";
    return;
  }

  try {
    // Actualizar las cantidades en la base de datos
    const inputs = document.querySelectorAll(".cart-item-quantity");
    const cartRef = doc(db, "carts", user.uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      cartResultDiv.textContent = "Tu carrito está vacío.";
      return;
    }

    const cartData = cartSnap.data();
    const updatedItems = cartData.items.map((item) => {
      const input = document.getElementById(`quantity-${item.productId}`);
      const newQuantity = parseInt(input.value, 10);
      return { ...item, quantity: newQuantity };
    });

    // Actualizar la base de datos con las nuevas cantidades
    await updateDoc(cartRef, { items: updatedItems });

    // Proceder al pago
    const token = await user.getIdToken();
    const items = updatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Producto ${item.productId}`,
        },
        unit_amount: 1000, // Simulado, reemplázalo con el precio real
      },
      quantity: item.quantity,
    }));

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
  }
});

  
  
window.updateQuantity = updateQuantity;
