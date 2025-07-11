import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let rocketPlaceholder;
let afterburnerSystem, smokeSystem;
let isLaunching = false;
let launchVelocity = 0;
const launchAcceleration = 0.05;

// This is the GLSL code we will inject into the existing materials
const toonShaderLogic = `
    // This logic replaces the standard lighting model with our toon shading
    float intensity = max(0.0, dot(vNormal, uLightDirection));
    vec3 toonColor;

    if (intensity > 0.85) {
        toonColor = diffuse * 1.4; // Highlight
    } else if (intensity > 0.5) {
        toonColor = diffuse; // Base color
    } else {
        toonColor = diffuse * 0.6; // Shadow
    }
    
    gl_FragColor = vec4(toonColor, 1.0);
`;

function createPlaceholders(scene) {
    const hillGeo = new THREE.CircleGeometry(200, 64);
    const hillMat = new THREE.MeshBasicMaterial({ color: 0x004d00 });
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.rotation.x = -Math.PI / 2;
    hill.position.y = -5;
    scene.add(hill);

    rocketPlaceholder = new THREE.Group();
    rocketPlaceholder.position.set(0, -5, 0);
    scene.add(rocketPlaceholder);

    const loader = new GLTFLoader();

    loader.load('swiftrocket.glb', (gltf) => {
        const model = gltf.scene;
        
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.onBeforeCompile = (shader) => {
                    // Add our custom light direction uniform to the shader
                    shader.uniforms.uLightDirection = { value: new THREE.Vector3(0.5, 0.5, 1.0).normalize() };
                    
                    // Declare the uniform and varying in the fragment shader
                    shader.fragmentShader = 'uniform vec3 uLightDirection;\n' + shader.fragmentShader;
                    
                    // Replace the end of the fragment shader with our logic
                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <dithering_fragment>',
                        '#include <dithering_fragment>\n' + toonShaderLogic
                    );
                };
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

function createAfterburner() {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = (Math.random() * -1);
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        velocities[i * 3] = (Math.random() - 0.5) * 0.1;
        velocities[i * 3 + 1] = -1 - Math.random();
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    const material = new THREE.PointsMaterial({
        size: 0.5,
        map: new THREE.TextureLoader().load('flame-png-transparent-4.png'),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        color: 0xffa500
    });
    afterburnerSystem = new THREE.Points(geometry, material);
    afterburnerSystem.visible = false;
    rocketPlaceholder.add(afterburnerSystem);
}

function createSmoke() {
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
        velocities[i * 3] = (Math.random() - 0.5) * 0.2;
        velocities[i * 3 + 1] = Math.random() * 0.2;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    const material = new THREE.PointsMaterial({
        size: 2,
        map: new THREE.TextureLoader().load('clouds.png'),
        blending: THREE.NormalBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.3
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

function update() {
    if (isLaunching) {
        launchVelocity += launchAcceleration;
        rocketPlaceholder.position.y += launchVelocity;

        const afterburnerPos = afterburnerSystem.geometry.attributes.position.array;
        const afterburnerVel = afterburnerSystem.geometry.attributes.velocity.array;
        for (let i = 0; i < afterburnerPos.length; i += 3) {
            afterburnerPos[i + 1] += afterburnerVel[i + 1] * 0.2;
            if (afterburnerPos[i + 1] < -5) {
                afterburnerPos[i] = (Math.random() - 0.5) * 0.2;
                afterburnerPos[i + 1] = 0;
                afterburnerPos[i + 2] = (Math.random() - 0.5) * 0.2;
            }
        }
        afterburnerSystem.geometry.attributes.position.needsUpdate = true;

        const smokePos = smokeSystem.geometry.attributes.position.array;
        const smokeVel = smokeSystem.geometry.attributes.velocity.array;
        for (let i = 0; i < smokePos.length; i += 3) {
            smokePos[i] += smokeVel[i] * 0.1;
            smokePos[i + 1] += smokeVel[i + 1] * 0.1;
            smokePos[i + 2] += smokeVel[i + 2] * 0.1;
            if (smokePos[i + 1] > 3 || Math.abs(smokePos[i]) > 5) {
                smokePos[i] = (Math.random() - 0.5) * 1;
                smokePos[i + 1] = 0;
                smokePos[i + 2] = (Math.random() - 0.5) * 1;
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
