import * as THREE from 'three';
import * as sceneManager from './sceneManager.js';
import * as sky from './sky.js';
import * as rocket from './rocket.js';
import * as fireworks from './fireworks.js';
import * as uiController from './uiController.js';

let scene, camera, renderer, clock;
const cameraLookAtTarget = new THREE.Vector3(0, 10, 0);

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

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Get time since last frame
    const rocketState = rocket.getRocketState();

    sky.updateSky();
    fireworks.update();
    rocket.update(delta); // Pass delta to the rocket's update function

    if (rocketState.isLaunching && rocketState.model) {
        cameraLookAtTarget.lerp(rocketState.model.position, 0.05);
        camera.lookAt(cameraLookAtTarget);
    }

    renderer.render(scene, camera);
}

// --- START THE APPLICATION ---
init();
