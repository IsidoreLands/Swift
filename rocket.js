import * as THREE from 'three';

let rocketPlaceholder;
let afterburnerSystem;
let isLaunching = false;

// Creates the static placeholder models
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

    createAfterburner();
}

// Sets up the afterburner particle system
function createAfterburner() {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 0.5; // Emerge from a small area
        positions[i3 + 1] = (Math.random() * -5) - 7.5; // Start at rocket base
        positions[i3 + 2] = (Math.random() - 0.5) * 0.5;

        velocities[i3] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 1] = -5 - Math.random(); // Strong downward velocity
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load('flame-png-transparent-4.png');

    const material = new THREE.PointsMaterial({
        size: 2,
        map: particleTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        color: 0xffa500 // Orange tint
    });

    afterburnerSystem = new THREE.Points(geometry, material);
    afterburnerSystem.visible = false; // Initially hidden
    rocketPlaceholder.add(afterburnerSystem);
}

// Starts the launch sequence
function launch() {
    if (!isLaunching) {
        isLaunching = true;
        afterburnerSystem.visible = true;
    }
}

// Animates the particles on each frame
function update() {
    if (isLaunching && afterburnerSystem) {
        const positions = afterburnerSystem.geometry.attributes.position.array;
        const velocities = afterburnerSystem.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += velocities[i + 1] * 0.05; // Move particles down

            // Reset particle when it goes too far
            if (positions[i + 1] < -20) {
                positions[i] = (Math.random() - 0.5) * 0.5;
                positions[i + 1] = -7.5;
                positions[i + 2] = (Math.random() - 0.5) * 0.5;
            }
        }
        afterburnerSystem.geometry.attributes.position.needsUpdate = true;
    }
}

export { createPlaceholders, launch, update };
