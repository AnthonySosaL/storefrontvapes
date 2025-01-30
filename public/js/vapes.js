// ========== CONFIGURACIÓN INICIAL ==========

const header = document.querySelector("header"); // Asegúrate de tener un <header> en tu HTML o ajusta según necesites

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});

// ========== VARIABLES GLOBALES ==========
let composer = null;
let bokehPass = null;
let vapeModel = null;
let controls = null;
const clock = new THREE.Clock();

// Configuraciones
const CONFIG = {
  initialRotation: -20 * (Math.PI / 180),
  rotationAmplitude: 0.32,
  rotationSpeed: 0.43,
  modelPosition: new THREE.Vector3(35, -45, -8),
  modelScale: 140,
  cameraPosition: new THREE.Vector3(100, -25, 50),
  lookAtPoint: new THREE.Vector3(25, -27, -8)
};

// ========== INICIALIZACIÓN DEL RENDERIZADOR ==========
function initRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(new THREE.Color(0xffd7ff), 1);
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '-2';
  document.body.prepend(renderer.domElement);
}

// ========== CONFIGURACIÓN DE LUCES ==========
function setupLights() {
  scene.add(new THREE.AmbientLight(0xffd7ff, 0.55));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
  directionalLight.position.set(10, 15, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffd7ff, 0.7, 100);
  pointLight.position.set(0, 20, -10);
  scene.add(pointLight);
}

// ========== CONFIGURACIÓN DE CÁMARA ==========
function initCamera() {
  camera.position.copy(CONFIG.cameraPosition);
  camera.lookAt(CONFIG.lookAtPoint);
}

// ========== CONTROLES INTERACTIVOS ==========
function initControls() {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.rotateSpeed = 0.3;
  controls.enableZoom = false;
  controls.minDistance = 35;
  controls.maxDistance = 180;
  controls.enablePan = false;
  controls.minAzimuthAngle = -0.25;
  controls.maxAzimuthAngle = 0.25;
  controls.minPolarAngle = Math.PI / 3.2;
  controls.maxPolarAngle = (2 * Math.PI) / 3.2;
}

// ========== CARGA DEL MODELO 3D ==========
// CARGA DEL MODELO 3D
function loadModel() {
  new THREE.GLTFLoader().load(
    "./models/vape.glb",
    (gltf) => {
      vapeModel = gltf.scene;
      vapeModel.position.copy(CONFIG.modelPosition);
      vapeModel.rotation.y = CONFIG.initialRotation;
      vapeModel.scale.setScalar(CONFIG.modelScale);

      vapeModel.traverse((child) => {
        if (child.isMesh) {
          child.material.metalness = 0.96;
          child.material.roughness = 0.04;
          child.material.envMapIntensity = 0.9;
        }
      });

      scene.add(vapeModel);
      console.log("✅ Modelo 3D cargado correctamente.");

      // Dispara el evento indicando que el modelo ha sido cargado
      const modelLoadedEvent = new Event("modelLoaded");
      window.dispatchEvent(modelLoadedEvent);

      // Inicia el postprocesado y la animación
      initPostProcessing();
      initCamera();
      initControls();
      animate();
    },
    undefined,
    (error) => {
      console.error("Error loading model:", error);

      // Si hay un error, muestra un mensaje en lugar del loader
      const loader = document.getElementById("loader");
      loader.innerHTML = `
        <p class="text-danger fs-4 text-center">Error al cargar la experiencia. Por favor, recarga la página.</p>
      `;
    }
  );
}




// ========== POST-PROCESADO ==========
function initPostProcessing() {
  try {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    const focusPoint = new THREE.Vector3(
      CONFIG.modelPosition.x,
      CONFIG.modelPosition.y,
      CONFIG.modelPosition.z + 3
    );

    bokehPass = new THREE.BokehPass(
      scene,
      camera,
      {
        focus: camera.position.distanceTo(focusPoint),
        aperture: 0.0002,
        maxblur: 0.01,
        width: window.innerWidth,
        height: header ? header.offsetHeight : window.innerHeight
      }
    );

    composer.addPass(bokehPass);

  } catch (error) {
    console.error("Error en post-procesado:", error);
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
  }
}

// ========== ANIMACIÓN PRINCIPAL ==========
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Rotación izquierda a derecha
  if (vapeModel) {
    const t = elapsed * CONFIG.rotationSpeed;
    vapeModel.rotation.y = CONFIG.initialRotation + Math.sin(t) * CONFIG.rotationAmplitude;
  }

  // Actualizamos la profundidad de foco del Bokeh en cada frame
  if (bokehPass?.material?.uniforms?.focus) {
    const focusPoint = new THREE.Vector3(
      CONFIG.modelPosition.x,
      CONFIG.modelPosition.y,
      CONFIG.modelPosition.z + 3
    );
    bokehPass.material.uniforms.focus.value = 
      camera.position.distanceTo(focusPoint);
  }

  controls.update();
  composer.render();
}

// ========== MANEJO DE REDIMENSIONADO ==========
window.addEventListener("resize", () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(newWidth, newHeight);
  
  if (composer) {
    composer.setSize(newWidth, newHeight);
    if (bokehPass?.material?.uniforms) {
      bokehPass.material.uniforms.width.value = newWidth;
      bokehPass.material.uniforms.height.value = newHeight;
    }
  }
});

// ========== INICIALIZAR APLICACIÓN ==========
function init() {
  initRenderer();
  setupLights();
  loadModel();
}

init();
