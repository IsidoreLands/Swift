import * as THREE from 'three';
import * as sceneManager from './sceneManager.js';
import * as sky from './sky.js';
import * as rocket from './rocket.js';
import * as fireworks from './fireworks.js';
import * as uiController from './uiController.js';

let scene, camera, renderer, clock;

// Initialize the core components
function init() {
    const components = sceneManager.init();
    scene = components.scene;
    camera = components.camera;
    renderer = components.renderer;
    
    clock = new THREE.Clock();

    // Create the visual elements
    sky.createSky(scene);
    rocket.createPlaceholders(scene);
    fireworks.init(scene, clock);

    // Initialize the UI controls
    uiController.init();

    window.addEventListener('resize', sceneManager.onWindowResize);

    animate();
}

// The main animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update animated components
    sky.updateSky();
    fireworks.update();
    rocket.update(); // Add rocket update to the loop

    // Render the scene with the camera
    renderer.render(scene, camera);
}

// --- START THE APPLICATION ---
init();
