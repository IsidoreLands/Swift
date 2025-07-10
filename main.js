import * as THREE from 'three';
import * as sceneManager from './sceneManager.js';
import * as sky from './sky.js';
import * as rocket from './rocket.js';
import * as fireworks from './fireworks.js';
import * as uiController from './uiController.js';

let scene, camera, renderer, clock;
const cameraLookAtTarget = new THREE.Vector3(0, 10, 0);

// Initialize the core components
function init() {
    const components = sceneManager.init();
    scene = components.scene;
    camera = components.camera;
    renderer = components.renderer;
    
    clock = new THREE.Clock();

    sky.init(scene);
    rocket.createPlaceholders(scene);
    fireworks.init(scene, clock);
    uiController.init();

    window.addEventListener('resize', sceneManager.onWindowResize);

    animate();
}

// The main animation loop
function animate() {
    requestAnimationFrame(animate);

    const rocketState = rocket.getRocketState();

    sky.updateSky();
    fireworks.update();
    rocket.update(); 

    // If the rocket is launching, make the camera follow it
    if (rocketState.isLaunching && rocketState.model) {
        // Smoothly interpolate the camera's look-at target towards the rocket
        cameraLookAtTarget.lerp(rocketState.model.position, 0.05);
        camera.lookAt(cameraLookAtTarget);
    }

    renderer.render(scene, camera);
}

// --- START THE APPLICATION ---
init();
