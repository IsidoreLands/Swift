import * as sceneManager from './sceneManager.js';

let scene, camera, renderer, clock;

// Initialize the core components
function init() {
    // Get the scene, camera, and renderer from the sceneManager
    const components = sceneManager.init();
    scene = components.scene;
    camera = components.camera;
    renderer = components.renderer;

    // Add event listener for window resizing
    window.addEventListener('resize', sceneManager.onWindowResize);

    // Start the animation loop
    animate();
}

// The main animation loop
function animate() {
    requestAnimationFrame(animate);

    // Render the scene with the camera
    renderer.render(scene, camera);
}

// --- START THE APPLICATION ---
init();
