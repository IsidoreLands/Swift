import * as THREE from 'three';

let diffuseParticles; // Unresolved gas and faint stars
let starParticles; // Resolved bright stars
let backgroundParticles; // Procedural full-sky faint stars for blending

// Shared shaders for particles
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
        gl_PointSize = size;
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
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist); // Softer for gas, adjustable
        gl_FragColor = vec4(vColor, alpha);
    }
`;

function init(scene) {
    const radius = 1900;
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

        // Positions, colors, sizes for diffuse (gas/faint) and stars (bright)
        const diffusePositions = [];
        const diffuseColors = [];
        const diffuseSizes = [];
        const starPositions = [];
        const starColors = [];
        const starSizes = [];

        const faintThreshold = 20; // Low for unresolved gas/faint stars
        const brightThreshold = 100; // High for resolved stars
        const jitterStrength = 20.0;
        const depthVariation = 0.02; // Small radius variation for depth

        // Target northwestern horizon focus
        const center_az = 7 * Math.PI / 4; // 315°
        const center_pol = Math.PI / 2; // Horizon
        const azSpread = Math.PI / 2; // 90° spread for fade
        const polSpread = Math.PI / 4; // 45° vertical

        for (let y = 0; y < h; y += 2) { // Subsample for performance
            for (let x = 0; x < w; x += 2) {
                const i = (y * w + x) * 4;
                const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

                if (brightness > faintThreshold) {
                    const azimuthalAngle = (x / w) * Math.PI * 2;
                    const polarAngle = (y / h) * Math.PI;

                    // Fade based on distance from northwestern region
                    const azDiff = Math.min(Math.abs(azimuthalAngle - center_az), 2 * Math.PI - Math.abs(azimuthalAngle - center_az));
                    const polDiff = Math.abs(polarAngle - center_pol);
                    const fade = Math.max(0, 1 - (azDiff / azSpread)) * Math.max(0, 1 - (polDiff / polSpread));

                    if (fade > 0) {
                        const adjRadius = radius * (1 + (Math.random() - 0.5) * depthVariation);
                        const X = adjRadius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
                        const Y = adjRadius * Math.cos(polarAngle);
                        const Z = adjRadius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);

                        const jx = (Math.random() - 0.5) * jitterStrength;
                        const jy = (Math.random() - 0.5) * jitterStrength;
                        const jz = (Math.random() - 0.5) * jitterStrength;

                        const r = data[i] / 255 * fade;
                        const g = data[i+1] / 255 * fade;
                        const b = data[i+2] / 255 * fade;

                        if (brightness < brightThreshold) {
                            // Diffuse gas/faint stars: larger, softer
                            diffusePositions.push(X + jx, Y + jy, Z + jz);
                            diffuseColors.push(r * 0.6, g * 0.6, b * 0.7); // Dimmed, cool tint
                            diffuseSizes.push((brightness / 50) + Math.random() * 2); // Larger variation
                        } else {
                            // Resolved stars: smaller, sharper
                            starPositions.push(X + jx, Y + jy, Z + jz);
                            starColors.push(r, g, b);
                            starSizes.push((brightness / 200) + Math.random() * 0.5); // Small
                        }
                    }
                }
            }
        }

        // Create diffuse particles
        const diffuseGeometry = new THREE.BufferGeometry();
        diffuseGeometry.setAttribute('position', new THREE.Float32BufferAttribute(diffusePositions, 3));
        diffuseGeometry.setAttribute('color', new THREE.Float32BufferAttribute(diffuseColors, 3));
        diffuseGeometry.setAttribute('size', new THREE.Float32BufferAttribute(diffuseSizes, 1));

        const diffuseMaterial = new THREE.RawShaderMaterial({
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: true,
            depthWrite: false
        });

        diffuseParticles = new THREE.Points(diffuseGeometry, diffuseMaterial);
        scene.add(diffuseParticles);

        // Create star particles
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

        const starMaterial = new THREE.RawShaderMaterial({
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: true,
            depthWrite: false
        });

        starParticles = new THREE.Points(starGeometry, starMaterial);
        scene.add(starParticles);
    };

    img.src = 'eso0932a.jpg';

    // Procedural background for full sky blending
    const bgPositions = [];
    const bgColors = [];
    const bgSizes = [];
    const numStars = 15000; // Increased slightly for density

    for (let i = 0; i < numStars; i++) {
        const polarAngle = Math.random() * Math.PI;
        const azimuthalAngle = Math.random() * 2 * Math.PI;
        const adjRadius = radius * (1 + (Math.random() - 0.5) * 0.01);

        const X = adjRadius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
        const Y = adjRadius * Math.cos(polarAngle);
        const Z = adjRadius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);

        bgPositions.push(X, Y, Z);

        const intensity = Math.random() * 0.4 + 0.2;
        bgColors.push(intensity, intensity, intensity * 0.95);
        bgSizes.push(Math.random() + 0.5);
    }

    const bgGeometry = new THREE.BufferGeometry();
    bgGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.Float32BufferAttribute(bgColors, 3));
    bgGeometry.setAttribute('size', new THREE.Float32BufferAttribute(bgSizes, 1));

    const bgMaterial = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: true,
        depthWrite: false
    });

    backgroundParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(backgroundParticles);
}

function updateSky() {
    if (diffuseParticles) diffuseParticles.rotation.y -= 0.00011;
    if (starParticles) starParticles.rotation.y -= 0.00011;
    if (backgroundParticles) backgroundParticles.rotation.y -= 0.00011;
}

export { init, updateSky };
