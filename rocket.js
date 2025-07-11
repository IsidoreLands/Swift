import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let rocketPlaceholder;
let afterburnerSystem, smokeSystem;
let isLaunching = false;
let launchVelocity = 0;
const launchAcceleration = 0.05;

function createPlaceholders(scene) {
    const hillGeo = new THREE.CircleGeometry(200, 64);
    const hillMat = new THREE.MeshBasicMaterial({ color: 0x004d00 });
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.rotation.x = -Math.PI / 2;
    hill.position.y = -5;
    scene.add(hill);

    rocketPlaceholder = new THREE.Group();
    rocketPlaceholder.position.set(0, 10, 0);
    scene.add(rocketPlaceholder);

    // --- DIAGNOSTIC CODE TO MEASURE THE MODEL ---
    const loader = new GLTFLoader();

    loader.load('swiftrocket.glb', (gltf) => {
        const model = gltf.scene;

        // Calculate the model's bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Print the results to the console
        console.log("--- ROCKET MODEL ANALYSIS ---");
        console.log("Model Size (WxHxD):", size.x, size.y, size.z);
        console.log("Model Center (X,Y,Z):", center.x, center.y, center.z);
        console.log("--- END ANALYSIS ---");
        
        // We will not add the model to the scene in this test.
        // rocketPlaceholder.add(model);
    });

    // We still create these so the app doesn't crash, but they won't be used.
    createAfterburner();
    createSmoke();
}

// --- The following functions remain unchanged for now ---

function createAfterburner() {
    // This function is temporarily inert
}

function createSmoke() {
    // This function is temporarily inert
}

function launch() {
    if (!isLaunching) {
        console.log("Launch button pressed, but rocket is hidden for diagnostics.");
        // isLaunching = true; 
        // afterburnerSystem.visible = true;
        // smokeSystem.visible = true;
    }
}

function update() {
    // No updates needed during this test
}

function getRocketState() {
    return {
        isLaunching: isLaunching,
        model: rocketPlaceholder
    };
}

export { createPlaceholders, launch, update, getRocketState };
