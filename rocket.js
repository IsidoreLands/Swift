import * as THREE from 'three';

let rocketPlaceholder;
let afterburnerSystem, smokeSystem;
let isLaunching = false;
let launchVelocity = 0;
const launchAcceleration = 0.05;

// --- Toon Shaders for the Rocket ---
const toonVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const toonFragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uLightDirection;
    varying vec3 vNormal;
    
    void main() {
        float intensity = dot(vNormal, uLightDirection);
        vec3 finalColor;

        if (intensity > 0.8) {
            finalColor = uColor * 1.5; // Highlight
        } else if (intensity > 0.4) {
            finalColor = uColor; // Base color
        } else {
            finalColor = uColor * 0.5; // Shadow
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;


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

    // Uniforms for the shader material
    const lightDirection = new THREE.Vector3(0.5, 0.5, 1).normalize();
    
    const bodyMat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(0xADD8E6) }, // Light Blue
            uLightDirection: { value: lightDirection }
        },
        vertexShader: toonVertexShader,
        fragmentShader: toonFragmentShader
    });
    
    const coneMat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(0xFF4500) }, // Orange-Red
            uLightDirection: { value: lightDirection }
        },
        vertexShader: toonVertexShader,
        fragmentShader: toonFragmentShader
    });

    const bodyGeo = new THREE.CylinderGeometry(2, 2, 15, 32);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    rocketPlaceholder.add(body);
    
    const coneGeo = new THREE.ConeGeometry(2, 5, 32);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 10;
    rocketPlaceholder.add(cone);

    createAfterburner();
    createSmoke();
}

function createAfterburner() {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = (Math.random() * -5) - 7.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3] = (Math.random() - 0.5) * 0.1;
        velocities[i * 3 + 1] = -5 - Math.random();
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    const material = new THREE.PointsMaterial({
        size: 2,
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
        positions[i * 3] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = -8.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        velocities[i * 3] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 1] = Math.random() * 0.5;
        // Corrected typo on this line
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    const material = new THREE.PointsMaterial({
        size: 10,
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
            afterburnerPos[i + 1] += afterburnerVel[i + 1] * 0.05;
            if (afterburnerPos[i + 1] < -20) {
                afterburnerPos[i] = (Math.random() - 0.5) * 0.5;
                afterburnerPos[i + 1] = -7.5;
                afterburnerPos[i + 2] = (Math.random() - 0.5) * 0.5;
            }
        }
        afterburnerSystem.geometry.attributes.position.needsUpdate = true;

        const smokePos = smokeSystem.geometry.attributes.position.array;
        const smokeVel = smokeSystem.geometry.attributes.velocity.array;
        for (let i = 0; i < smokePos.length; i += 3) {
            smokePos[i] += smokeVel[i] * 0.1;
            smokePos[i + 1] += smokeVel[i + 1] * 0.1;
            smokePos[i + 2] += smokeVel[i + 2] * 0.1;
            if (smokePos[i + 1] > 0 || Math.abs(smokePos[i]) > 15) {
                smokePos[i] = (Math.random() - 0.5) * 2;
                smokePos[i + 1] = -8.5;
                smokePos[i + 2] = (Math.random() - 0.5) * 2;
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
