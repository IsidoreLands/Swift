import * as THREE from 'three';

let galaxyParticles;

// --- Shaders for Particle System ---
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
        gl_PointSize = size * (1000.0 / -mvPosition.z);
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
    // The detailed Milky Way particle layer
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
        const brightnessThreshold = 15;
        const radius = 1900;
        const jitterStrength = 2.5;

        for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

            if (brightness > brightnessThreshold) {
                const x = (i / 4) % w;
                const y = Math.floor((i / 4) / w);

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
                sizes.push(brightness / 100);
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
        galaxyParticles.rotation.y -= 0.00011; 
    }
}

export { init, updateSky };
