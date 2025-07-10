import * as THREE from 'three';

let galaxyParticles; // Milky Way patch
let backgroundParticles; // Full-sphere background

// --- Shaders (Retained with soft edges) ---
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
        // Constant point size (tuned higher to avoid subpixel aliasing)
        gl_PointSize = size * 4.0; 
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
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
    }
`;


function init(scene) {
    // --- Procedural Background Starfield (Full Sphere) ---
    const radius = 1900;
    const bgPositions = [];
    const bgColors = [];
    const bgSizes = [];
    const numStars = 10000; // Low density to minimize moiré

    for (let i = 0; i < numStars; i++) {
        const polarAngle = Math.random() * Math.PI;
        const azimuthalAngle = Math.random() * 2 * Math.PI;

        const X = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
        const Y = radius * Math.cos(polarAngle);
        const Z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);

        bgPositions.push(X, Y, Z);

        const intensity = Math.random() * 0.5 + 0.3; // Dim, neutral stars
        bgColors.push(intensity, intensity, intensity * 0.9); // Slight blue tint
        bgSizes.push(Math.random() * 1.5 + 0.5); // Small variation
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
        depthTest: false, // Added for sky layers
        depthWrite: false
    });

    backgroundParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(backgroundParticles);

    // --- Milky Way Patch from eso0932a.jpg (Localized to Northwestern Horizon) ---
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();

    img.onload = function() {
        const w = this.naturalWidth;
        const h = this.naturalHeight;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(this, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        const positions = [];
        const colors = [];
        const sizes = [];
        const brightnessThreshold = 50;
        const jitterStrength = 30.0;

        // Patch clipping (central section for smaller insert, e.g., ~180° az x ~72° pol)
        const start_x_ratio = 0.25; // Left of galactic center
        const end_x_ratio = 0.75; // Right
        const start_y_ratio = 0.3; // Slightly above/below band
        const end_y_ratio = 0.7;
        const original_az_center = ((start_x_ratio + end_x_ratio) / 2) * Math.PI * 2;
        const original_pol_center = ((start_y_ratio + end_y_ratio) / 2) * Math.PI;

        // Target position: Northwestern horizon (adjust as needed)
        const center_az = 7 * Math.PI / 4; // 315° (northwest)
        const center_pol = Math.PI / 2; // 90° (horizon/equator)

        // Subsample for density reduction
        for (let y = Math.floor(h * start_y_ratio); y < h * end_y_ratio; y += 2) {
            for (let x = Math.floor(w * start_x_ratio); x < w * end_x_ratio; x += 2) {
                const i = (y * w + x) * 4;
                const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

                if (brightness > brightnessThreshold) {
                    let azimuthalAngle = (x / w) * Math.PI * 2;
                    let polarAngle = (y / h) * Math.PI;

                    // Shift to target position
                    azimuthalAngle = azimuthalAngle - original_az_center + center_az;
                    polarAngle = polarAngle - original_pol_center + center_pol;

                    const X = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
                    const Y = radius * Math.cos(polarAngle);
                    const Z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);
                    
                    const jx = (Math.random() - 0.5) * jitterStrength;
                    const jy = (Math.random() - 0.5) * jitterStrength;
                    const jz = (Math.random() - 0.5) * jitterStrength;

                    positions.push(X + jx, Y + jy, Z + jz);
                    colors.push(data[i] / 255, data[i+1] / 255, data[i+2] / 255);
                    sizes.push((brightness / 100) * (0.7 + Math.random() * 0.6));
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.RawShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        galaxyParticles = new THREE.Points(geometry, material);
        galaxyParticles.rotation.z = Math.PI / 12; // Retained tilt
        scene.add(galaxyParticles);
    };

    img.src = 'eso0932a.jpg';
}

function updateSky() {
    if (galaxyParticles) {
        galaxyParticles.rotation.y -= 0.001; // Temporary for testing
    }
    if (backgroundParticles) {
        backgroundParticles.rotation.y -= 0.001; // Sync rotation
    }
}

export { init, updateSky };
