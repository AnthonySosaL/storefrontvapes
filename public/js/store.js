import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, getDocs , doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { API_BASE_URL } from "./config.js";


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
const db = getFirestore(app);

let currentUser = null; // Declarar variable global

const productsList = document.getElementById("productsList");
const resultDiv = document.getElementById("result");
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
    const errorModalElement = document.getElementById("errorModal");
    if (modalBody && errorModalElement) {
      modalBody.textContent = message;
      const errorModalInstance = new bootstrap.Modal(errorModalElement);
      errorModalInstance.show();
    } else {
      console.error("El modal de error no está disponible.");
    }
  }
});
btnCloseModal.addEventListener("click", () => {
  const bootstrapModal = bootstrap.Modal.getInstance(cartModal);
  if (bootstrapModal) {
    bootstrapModal.hide();
  }
});

btnCheckout.addEventListener("click", () => {
  // Redirigir al carrito completo
  window.location.href = "cart.html";
});
async function updateCartQuantity(uid, productId, change) {
  try {
      const cartRef = doc(db, "carts", uid);
      const cartSnap = await getDoc(cartRef);

      if (!cartSnap.exists()) return;

      let cartData = cartSnap.data();
      let items = cartData.items || [];

      // Buscar el producto en el carrito
      let itemIndex = items.findIndex(item => item.productId === productId);
      if (itemIndex === -1) return;

      // Obtener la nueva cantidad
      let newQuantity = items[itemIndex].quantity + change;

      if (newQuantity <= 0) {
          // Si la cantidad es 0, eliminar el producto del carrito
          items.splice(itemIndex, 1);
      } else {
          items[itemIndex].quantity = newQuantity;
      }

      // Guardar el carrito actualizado
      await updateDoc(cartRef, { items });

      // Recargar el carrito para mostrar los cambios
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
                          console.warn(`Producto inactivo eliminado del carrito: ${item.productId}`);
                          return "";
                      }
                  } else {
                      console.warn(`Producto desconocido eliminado del carrito: ${item.productId}`);
                      return "";
                  }
              } catch (error) {
                  console.error(`Error recuperando producto ${item.productId}:`, error);
                  return `<div>Error al cargar producto (Cantidad: ${item.quantity})</div>`;
              }
          })
      );

      if (validItems.length !== cartData.items.length) {
          await updateDoc(cartRef, { items: validItems });
      }

      cartItemsDiv.innerHTML = itemsList.filter((item) => item !== "").join("");

      if (validItems.length === 0) {
          cartItemsDiv.textContent = "Carrito vacío.";
      }

      // Agregar eventos a los botones de aumentar y disminuir cantidad
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
      cartItemsDiv.textContent = "Error cargando carrito: " + error.message;
  }
}

  
// Escuchar cambios en la autenticación
onAuthStateChanged(auth, (user) => {
    currentUser = user; // Actualizar la variable global
  
    const logoutButton = document.getElementById("logoutButton");
    const cartLink = document.getElementById("cartLink"); // Enlace al carrito en la navbar
  
    // Validar si los elementos existen
    if (logoutButton) {
      logoutButton.style.display = user ? "inline" : "none";
  
      if (user) {
        logoutButton.addEventListener("click", async () => {
          try {
            await signOut(auth);
            alert("Sesión cerrada correctamente");
            window.location.href = "index.html"; // Redirigir a la página principal
          } catch (error) {
            console.error("Error cerrando sesión:", error);
          }
        });
      }
    }
  
    if (cartLink) {
      cartLink.style.display = user ? "inline" : "none";
    }
    const modelLoadedEvent = new Event("modelLoaded");
    window.dispatchEvent(modelLoadedEvent);
    loadProducts(); // Cargar productos independientemente del estado de sesión
  });
  
  
// Función para cargar los productos
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    productsList.innerHTML = ""; // Limpia la lista

    if (snapshot.empty) {
      productsList.textContent = "No hay productos disponibles en la tienda.";
      return;
    }

    snapshot.forEach((docSnap) => {
      const prod = docSnap.data();

      // Validar si el producto está activo
      if (prod.status !== "activo") {
        return; // Ignorar productos inactivos
      }

      // Crear un contenedor para cada producto
// Crear un contenedor para cada producto
const prodDiv = document.createElement("div");
prodDiv.classList.add("card-item"); // Clase para el diseño de las cards
prodDiv.innerHTML = `
  <img src="${API_BASE_URL}${prod.imagePath || '/default-product.jpg'}" alt="${prod.name}" class="card-item-img">
  <h5 class="card-item-name">${prod.name}</h5>
  <p class="card-item-price">Precio: $${prod.price}</p>
  <p class="card-item-stock">Stock: ${prod.stock}</p>
  <div class="quantity-controls">
    <input type="number" id="quantity-${docSnap.id}" value="1" min="1" max="${prod.stock}" ${prod.stock === 0 ? "disabled" : ""}>
    <button class="btn-quantity" data-action="decrease" ${prod.stock === 0 ? "disabled" : ""}>-</button>
    <button class="btn-quantity" data-action="increase" ${prod.stock === 0 ? "disabled" : ""}>+</button>
  </div>
  <button class="btn-add-cart" ${prod.stock === 0 ? "disabled" : ""}>Agregar al carrito</button>
`;

// Lógica para los botones "+" y "-"
const quantityInput = prodDiv.querySelector(`#quantity-${docSnap.id}`);
const decreaseButton = prodDiv.querySelector('button[data-action="decrease"]'); // Botón "-"
const increaseButton = prodDiv.querySelector('button[data-action="increase"]'); // Botón "+"


// Verificar si los botones existen antes de añadir eventos
if (decreaseButton) {
  decreaseButton.addEventListener("click", () => {
    const currentQuantity = parseInt(quantityInput.value, 10);
    if (currentQuantity > 1) {
      quantityInput.value = currentQuantity - 1;
    }
  });
}

if (increaseButton) {
  increaseButton.addEventListener("click", () => {
    const currentQuantity = parseInt(quantityInput.value, 10);
    const maxQuantity = parseInt(quantityInput.max, 10);
    if (currentQuantity < maxQuantity) {
      quantityInput.value = currentQuantity + 1;
    }
  });
}

      

      // Agregar evento al botón de agregar al carrito
      const btn = prodDiv.querySelector(".btn-add-cart");
      btn.addEventListener("click", () => {
        if (!currentUser) {
          showErrorModal("Debes iniciar sesión para agregar productos al carrito.");
          return;
        }
        if (prod.stock > 0) {
          const quantity = parseInt(
            document.getElementById(`quantity-${docSnap.id}`).value
          );
          addToCart(docSnap.id, quantity, currentUser);
        } else {
          showErrorModal("Producto agotado.");
        }
      });

      productsList.appendChild(prodDiv);
    });
  } catch (error) {
    console.error("Error cargando productos:", error.message);
    resultDiv.textContent = "Error cargando productos: " + error.message;
  }
}




  
  
  // Función para agregar productos al carrito
  async function addToCart(productId, quantity, user) {
    try {
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
  
      const data = await resp.json();
      resultDiv.textContent = data.message;
  
      // Actualizar el carrito después de añadir un producto
      await loadCart(user.uid);
    } catch (error) {
      resultDiv.textContent = "Error al añadir al carrito: " + error.message;
    }
  }