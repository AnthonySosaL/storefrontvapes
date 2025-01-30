document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("loader");
    const loaderCircle = document.querySelector(".loader-circle");

    // Simulación de carga del modelo
    window.addEventListener("modelLoaded", () => {
        // Inicia la animación de apertura inicial
        loaderCircle.style.animation = "lensOpen 4s cubic-bezier(0.25, 1, 0.5, 1) forwards";

        // Esperar a que la apertura inicial termine antes de la animación de cierre
        setTimeout(() => {
            // Agregar un pequeño retraso para que se note el tamaño máximo
            loaderCircle.style.animation = "lensClose 3s cubic-bezier(0.25, 1, 0.5, 1) forwards";
            loader.style.animation = "fadeOutBackground 3s cubic-bezier(0.25, 1, 0.5, 1) forwards";

            // Remover el loader del DOM después de la animación de cierre
            setTimeout(() => {
                loader.remove();
            }, 1500); // Tiempo sincronizado con lensClose y fadeOutBackground
        }, 1500); // Duración de lensOpen
    });
});
