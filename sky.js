import * as THREE from 'three';

let galaxyParticles;

// --- Shaders (Consultant's Recommendations) ---
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
        // FIX 1: Use constant point size for uniform appearance
        gl_PointSize = size * 3.0; 
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    precision mediump float;
    varying vec3 vColor;

    void main() {
        // FIX 2: Soften edges for reduced aliasing
        vec2 coord = gl_PointCoord - vec2(0.5, 0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
    }
`;


function init(scene) {
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
        const radius = 1900;
        
        // FIX 3 & 4: Enhanced randomness and reduced density
        const brightnessThreshold = 50;
        const jitterStrength = 30.0;
        
        // Subsample the image pixels (every 2nd pixel on every 2nd row)
        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
                const i = (y * w + x) * 4;
                const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

                if (brightness > brightnessThreshold) {
                    const azimuthalAngle = (x / w) * Math.PI * 2;
                    const polarAngle = (y / h) * Math.PI;

                    const X = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
                    const Y = radius * Math.cos(polarAngle);
                    const Z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);
                    
                    const jx = (Math.random() - 0.5) * jitterStrength;
                    const jy = (Math.random() - 0.5) * jitterStrength;
                    const jz = (Math.random() - 0.5) * jitterStrength;

                    positions.push(X + jx, Y + jy, Z + jz);
                    colors.push(data[i] / 255, data[i+1] / 255, data[i+2] / 255);
                    // Add size variation
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
            transparent: true
        });

        galaxyParticles = new THREE.Points(geometry, material);
        galaxyParticles.rotation.z = Math.PI / 12;
        scene.add(galaxyParticles);
    };

    img.src = 'eso0932a.jpg';
}

function updateSky() {
    if (galaxyParticles) {
        // Temporarily increased speed for testing, as per consultant's suggestion
        galaxyParticles.rotation.y -= 0.001; 
    }
}

export { init, updateSky };
