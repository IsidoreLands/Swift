import * as THREE from 'three';

let skyParticles;

// --- Shaders (from Gist) ---
const vertexShader = `
    varying vec4 vColor;
    attribute vec4 color;
    attribute float size;

    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying vec4 vColor;

    void main() {
        gl_FragColor = vec4(vColor.xyz, 1.0);
    }
`;


function init(scene) {
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();

    img.onload = function() {
        // --- Image Processing ---
        const w = this.naturalWidth;
        const h = this.naturalHeight;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(this, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        // --- Geometry Generation ---
        const positions = [];
        const colors = [];
        const sizes = [];
        const brightnessThreshold = 20; // Ignore very dim pixels

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            if (brightness > brightnessThreshold) {
                const x = (i / 4) % w;
                const y = Math.floor((i / 4) / w);
                
                // Center the image and scale it down
                positions.push((x - w / 2) * 0.5);
                positions.push((-y + h / 2) * 0.5); 
                positions.push(-1000); // Position far back

                colors.push(r / 255, g / 255, b / 255);
                sizes.push(brightness / 100); // Particle size based on brightness
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
        });

        skyParticles = new THREE.Points(geometry, material);
        scene.add(skyParticles);
    };

    img.src = 'eso0932a.jpg';
}

function updateSky() {
    // We can add rotation or other animations here later if needed.
    if (skyParticles) {
        skyParticles.rotation.y -= 0.00005;
    }
}

export { init, updateSky };
