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
    rocketPlaceholder.position.set(0, 0, 0); 
    scene.add(rocketPlaceholder);

    const loader = new GLTFLoader();

    loader.load('swiftrocket.glb', (gltf) => {
        const model = gltf.scene;
        
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.needsUpdate = true;
            }
        });
        
        const scale = 25 / 197.607;
        model.scale.set(scale, scale, scale);
        model.position.y = 12.5; 
        
        rocketPlaceholder.add(model);
    });

    createAfterburner();
    createSmoke();
}

// --- Rewritten based on afterburner.html ---
function createAfterburner() {
    const particleCount = 5000;
    const trailLength = 8.0;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const flameColors = [new THREE.Color(0xffffff), new THREE.Color(0xffaa00), new THREE.Color(0xff4400)];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        positions[i3] = (Math.random() - 0.5) * 0.5; // Emerge from small radius
        positions[i3 + 1] = (Math.random() * -trailLength); // Start along the trail
        positions[i3 + 2] = (Math.random() - 0.5) * 0.5;

        const color = flameColors[Math.floor(Math.random() * flameColors.length)];
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        velocities[i3] = (Math.random() - 0.5) * 0.2; // X turbulence
        velocities[i3 + 1] = -2.0 - Math.random(); // Y main velocity
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.2; // Z turbulence
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        map: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png'),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
    });
    afterburnerSystem = new THREE.Points(geometry, material);
    afterburnerSystem.visible = false;
    rocketPlaceholder.add(afterburnerSystem);
}

// --- Rewritten based on afterburner.html ---
function createSmoke() {
    const particleCount = 1000;
    const trailLength = 5.0;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 2.0; // Wider radius
        positions[i3 + 1] = (Math.random() * -trailLength);
        positions[i3 + 2] = (Math.random() - 0.5) * 2.0;

        velocities[i3] = (Math.random() - 0.5) * 0.5;
        velocities[i3 + 1] = -0.5 - Math.random();
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    const material = new THREE.PointsMaterial({
        size: 2.5,
        map: new THREE.TextureLoader().load('clouds.png'),
        blending: THREE.NormalBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.2
    });
    smokeSystem = new THREE.Points(geometry, material);
    smokeSystem.visible = false;
    rocketPlaceholder.add(smokeSystem);
}

function launch() {
    if (!isLaunching) {
        isLaunching = true;
        afterburnerSystem.visible = true;
        smokeSystem.visible = true;
    }
}

function update(delta) { // Now accepts delta time
    if (isLaunching) {
        launchVelocity += launchAcceleration * delta;
        rocketPlaceholder.position.y += launchVelocity;

        // Animate Afterburner
        const afterburnerPos = afterburnerSystem.geometry.attributes.position.array;
        const afterburnerVel = afterburnerSystem.geometry.attributes.velocity.array;
        for (let i = 0; i < afterburnerPos.length; i += 3) {
            afterburnerPos[i] += afterburnerVel[i] * delta * 10;
            afterburnerPos[i+1] += afterburnerVel[i+1] * delta * 10;
            afterburnerPos[i+2] += afterburnerVel[i+2] * delta * 10;
            
            if (afterburnerPos[i + 1] < -8.0) {
                afterburnerPos[i] = (Math.random() - 0.5) * 0.5;
                afterburnerPos[i + 1] = 0;
                afterburnerPos[i + 2] = (Math.random() - 0.5) * 0.5;
            }
        }
        afterburnerSystem.geometry.attributes.position.needsUpdate = true;

        // Animate Smoke
        const smokePos = smokeSystem.geometry.attributes.position.array;
        const smokeVel = smokeSystem.geometry.attributes.velocity.array;
        for (let i = 0; i < smokePos.length; i += 3) {
            smokePos[i] += smokeVel[i] * delta * 10;
            smokePos[i+1] += smokeVel[i+1] * delta * 10;
            smokePos[i+2] += smokeVel[i+2] * delta * 10;

            if (smokePos[i + 1] < -5.0) {
                smokePos[i] = (Math.random() - 0.5) * 2.0;
                smokePos[i + 1] = 0;
                smokePos[i + 2] = (Math.random() - 0.5) * 2.0;
            }
        }
        smokeSystem.geometry.attributes.position.needsUpdate = true;
    }
}

function getRocketState() {
    return {
        isLaunching: isLaunching,
        model: rocketPlaceholder
    };
}

export { createPlaceholders, launch, update, getRocketState };
