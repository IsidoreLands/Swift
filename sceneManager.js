import * as THREE from 'three';

let scene, camera, renderer;

// Initializes and returns the core Three.js components.
function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10, 50);
    camera.lookAt(0, 10, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    
    // --- New Lighting Setup ---
    // A dim ambient light to fill in shadows slightly.
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // A strong directional light to create highlights and shadows.
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(10, 20, 10); // Coming from the top-right
    scene.add(directionalLight);

    return { scene, camera, renderer };
}

// Handles window resizing.
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Export the functions to be used by other modules.
export { init, onWindowResize };
