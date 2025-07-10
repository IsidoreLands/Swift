import * as THREE from 'three';
import * as sceneManager from './sceneManager.js';
import * as sky from './sky.js';
import * as rocket from './rocket.js';
import * as fireworks from './fireworks.js';

let scene, camera, renderer, clock;

// Initialize the core components
function init() {
    // Get the scene, camera, and renderer from the sceneManager
    const components = sceneManager.init();
    scene = components.scene;
    camera = components.camera;
    renderer = components.renderer;
    
    // Create a clock for time-based animations
    clock = new THREE.Clock();

    // Create the visual elements
    sky.createSky(scene);
    rocket.createPlaceholders(scene);
    fireworks.init(scene, clock);

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
    fireworks.update();

    // Render the scene with the camera
    renderer.render(scene, camera);
}

// --- START THE APPLICATION ---
init();
