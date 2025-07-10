import * as sceneManager from './sceneManager.js';
import * as sky from './sky.js';
import * as rocket from './rocket.js';

let scene, camera, renderer;

// Initialize the core components
function init() {
    // Get the scene, camera, and renderer from the sceneManager
    const components = sceneManager.init();
    scene = components.scene;
    camera = components.camera;
    renderer = components.renderer;

    // Create the visual elements
    sky.createSky(scene);
    rocket.createPlaceholders(scene);

    // Add event listener for window resizing
    window.addEventListener('resize', sceneManager.onWindowResize);

    // Start the animation loop
    animate();
}

// The main animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update animated components
    sky.updateSky();

    // Render the scene with the camera
    renderer.render(scene, camera);
}

// --- START THE APPLICATION ---
init();
