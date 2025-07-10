import * as THREE from 'three';

let galaxyMesh; // Milky Way textured patch
let backgroundParticles; // Full-sphere background

// --- Shaders for background particles (Adjusted for sharper, smaller stars) ---
const vertexShader = `
    precision mediump float;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    attribute vec3 position;
    attribute vec3 color;
    attribute float size;
    varying vec3 vColor;

    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // Reduced multiplier for smaller, distant star appearance
        gl_PointSize = size * 1.5; 
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    precision mediump float;
    varying vec3 vColor;

    void main() {
        vec2 coord = gl_PointCoord - vec2(0.5, 0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        // Tightened smoothstep for sharper edges, less bubbly/snowy look
        float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
    }
`;


function init(scene) {
    // --- Procedural Background Starfield (Full Sphere) ---
    const radius = 1900;
    const bgPositions = [];
    const bgColors = [];
    const bgSizes = [];
    const numStars = 10000; // Low density

    for (let i = 0; i < numStars; i++) {
        const polarAngle = Math.random() * Math.PI;
        const azimuthalAngle = Math.random() * 2 * Math.PI;

        const X = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
        const Y = radius * Math.cos(polarAngle);
        const Z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);

        bgPositions.push(X, Y, Z);

        const intensity = Math.random() * 0.5 + 0.3;
        bgColors.push(intensity, intensity, intensity * 0.9);
        bgSizes.push(Math.random() * 1.5 + 0.5);
    }

    const bgGeometry = new THREE.BufferGeometry();
    bgGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.Float32BufferAttribute(bgColors, 3));
    bgGeometry.setAttribute('size', new THREE.Float32BufferAttribute(bgSizes, 1));

    const bgMaterial = new THREE.RawShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: true,
        depthWrite: false
    });

    backgroundParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(backgroundParticles);

    // --- Milky Way Patch as Textured Partial Sphere (for diffuse gas, unresolved stars, and dark rifts) ---
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('eso0932a.jpg', (texture) => {
        texture.minFilter = THREE.LinearMipMapLinearFilter; // Anti-aliasing and smooth scaling
        texture.magFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding; // Better color for astronomical image

        // Define patch angular size (e.g., 180° azimuthal x 72° polar)
        const phiStart = 7 * Math.PI / 4 - Math.PI / 2; // Center at northwest, width 180° (Math.PI radians)
        const phiLength = Math.PI; // 180°
        const thetaStart = Math.PI / 2 - (0.4 * Math.PI); // Center at horizon, height ~72° (0.4 * Math.PI ~72° total, from ~54° to 126° polar)
        const thetaLength = 0.4 * Math.PI;

        const geometry = new THREE.SphereGeometry(radius, 128, 64, phiStart, phiLength, thetaStart, thetaLength);
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide, // Render inside the sphere
            transparent: true,
            opacity: 0.8, // Slight transparency to blend with background stars
            blending: THREE.AdditiveBlending, // Additive for glowing effect
            depthTest: true,
            depthWrite: false
        });

        galaxyMesh = new THREE.Mesh(geometry, material);
        galaxyMesh.rotation.z = Math.PI / 12; // Retained tilt if needed
        scene.add(galaxyMesh);
    });
}

function updateSky() {
    if (galaxyMesh) {
        galaxyMesh.rotation.y -= 0.001; // Temporary for testing
    }
    if (backgroundParticles) {
        backgroundParticles.rotation.y -= 0.001; // Sync rotation
    }
}

export { init, updateSky };
