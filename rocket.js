import * as THREE from 'three';

let rocketPlaceholder;

function createPlaceholders(scene) {
    // Grassy Hill
    const hillGeo = new THREE.CircleGeometry(200, 64);
    const hillMat = new THREE.MeshBasicMaterial({ color: 0x004d00 });
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.rotation.x = -Math.PI / 2;
    hill.position.y = -5;
    scene.add(hill);

    // --- Rocket Group ---
    rocketPlaceholder = new THREE.Group();
    rocketPlaceholder.position.set(0, 10, 0);
    scene.add(rocketPlaceholder);

    // Rocket Body
    const bodyGeo = new THREE.CylinderGeometry(2, 2, 15, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    rocketPlaceholder.add(body);
    
    // Rocket Cone
    const coneGeo = new THREE.ConeGeometry(2, 5, 32);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xb22222, metalness: 0.5, roughness: 0.2 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 10;
    rocketPlaceholder.add(cone);
}

// This function will be called by the uiController to start the launch.
function launch() {
    console.log("Launch function in rocket.js successfully called.");
    // Afterburner, smoke, and animation logic will be added here.
}

export { createPlaceholders, launch };
