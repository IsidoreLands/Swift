import * as THREE from 'three';

let scene, camera, renderer;

// Initializes and returns the core Three.js components.
function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10, 50);
    camera.lookAt(0, 10, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha:true makes the canvas transparent
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent background
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    // Add basic lighting to the scene
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xffffff, 1, 500);
    pointLight.position.set(10, 30, 20);
    scene.add(pointLight);

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
