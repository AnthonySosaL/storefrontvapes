import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { API_BASE_URL } from "./config.js";

// 🔹 Verifica si ya existe una instancia de Firebase App, si no, la inicializa
const firebaseConfig = {
    apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
    authDomain: "tiendavapes-4458b.firebaseapp.com",
    projectId: "tiendavapes-4458b",
    storageBucket: "tiendavapes-4458b.firebasestorage.app",
    messagingSenderId: "133976223765",
    appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
    measurementId: "G-D33T0423S5"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig); // 🔹 Evita inicializar Firebase más de una vez
const auth = getAuth(app);
const db = getFirestore(app);
const cartModal = document.getElementById("cartModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const cartItemsDiv = document.getElementById("cartItems");
const btnCheckout = document.getElementById("btnCheckout");

document.addEventListener("navbarLoaded", () => {
  const navCartButton = document.getElementById("navCartButton");
  if (navCartButton) {
    navCartButton.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("Debes iniciar sesión para ver tu carrito.");
        return;
      }
      try {
        await loadCart(user.uid);
        const bootstrapModal = new bootstrap.Modal(cartModal);
        bootstrapModal.show();
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
      }
    });
  }
});

async function updateCartQuantity(uid, productId, change) {
  try {
    const cartRef = doc(db, "carts", uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) return;

    let cartData = cartSnap.data();
    let items = cartData.items || [];
    let itemIndex = items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) return;

    let newQuantity = items[itemIndex].quantity + change;

    if (newQuantity <= 0) {
      items.splice(itemIndex, 1);
    } else {
      items[itemIndex].quantity = newQuantity;
    }

    await updateDoc(cartRef, { items });
    await loadCart(uid);
  } catch (error) {
    console.error("Error actualizando cantidad en el carrito:", error);
  }
}

async function loadCart(uid) {
  try {
    const cartRef = doc(db, "carts", uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      cartItemsDiv.innerHTML = "<p class='empty-cart'>Carrito vacío.</p>";
      return;
    }

    let cartData = cartSnap.data();
    if (!cartData.items || cartData.items.length === 0) {
      cartItemsDiv.innerHTML = "<p class='empty-cart'>Carrito vacío.</p>";
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
              validItems.push(item);
              return `
                <div class="cart-item">
                  <img src="${API_BASE_URL}${productData.imagePath || '/default-product.jpg'}" alt="${productData.name}" class="cart-item-img">
                  <div class="cart-item-info">
                    <h5>${productData.name}</h5>
                    <p>Cantidad: <span id="qty-${item.productId}">${item.quantity}</span></p>
                    <div class="quantity-controls">
                      <button class="btn btn-sm btn-purple decrease-btn" data-product-id="${item.productId}">-</button>
                      <button class="btn btn-sm btn-purple increase-btn" data-product-id="${item.productId}">+</button>
                    </div>
                  </div>
                </div>
              `;
            } else {
              return "";
            }
          } else {
            return "";
          }
        } catch (error) {
          console.error(`Error recuperando producto ${item.productId}:`, error);
          return `<div class='cart-item-error'>Error al cargar producto (Cantidad: ${item.quantity})</div>`;
        }
      })
    );

    if (validItems.length !== cartData.items.length) {
      await updateDoc(cartRef, { items: validItems });
    }

    cartItemsDiv.innerHTML = itemsList.filter((item) => item !== "").join("");

    if (validItems.length === 0) {
      cartItemsDiv.innerHTML = "<p class='empty-cart'>Carrito vacío.</p>";
    }

    document.querySelectorAll(".increase-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const productId = event.target.getAttribute("data-product-id");
        await updateCartQuantity(uid, productId, 1);
      });
    });

    document.querySelectorAll(".decrease-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const productId = event.target.getAttribute("data-product-id");
        await updateCartQuantity(uid, productId, -1);
      });
    });
  } catch (error) {
    cartItemsDiv.innerHTML = "<p class='error-message'>Error cargando carrito: " + error.message + "</p>";
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadCart(user.uid);
  }
});

btnCloseModal.addEventListener("click", () => {
  const bootstrapModal = bootstrap.Modal.getInstance(cartModal);
  if (bootstrapModal) {
    bootstrapModal.hide();
  }
});

btnCheckout.addEventListener("click", () => {
  window.location.href = "cart.html";
});
