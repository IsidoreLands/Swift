import * as THREE from 'three';

let skyParticles;

// --- Shaders for RawShaderMaterial ---
const vertexShader = `
    precision mediump float;

    // Uniforms (provided by Three.js)
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    // Attributes (from our geometry)
    attribute vec3 position;
    attribute vec3 color;
    attribute float size;

    // Varying (to pass to fragment shader)
    varying vec3 vColor;

    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (500.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    precision mediump float;
    varying vec3 vColor;

    void main() {
        if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
        gl_FragColor = vec4(vColor, 1.0);
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
        const brightnessThreshold = 5;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            if (brightness > brightnessThreshold) {
                const x = (i / 4) % w;
                const y = Math.floor((i / 4) / w);
                
                // Centered and scaled the particle cloud
                positions.push((x - w / 2) * 0.5);
                positions.push((-y + h / 2) * 0.5); 
                positions.push(-1500); // Pushed much farther back

                colors.push(r / 255, g / 255, b / 255);
                sizes.push(brightness / 150); // Adjusted size scaling
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // Switched to RawShaderMaterial
        const material = new THREE.RawShaderMaterial({
            uniforms: {}, // No custom uniforms needed for now
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false // Important for background elements
        });

        skyParticles = new THREE.Points(geometry, material);
        scene.add(skyParticles);
    };

    img.src = 'eso0932a.jpg';
}

function updateSky() {
    if (skyParticles) {
        skyParticles.rotation.y -= 0.00005;
    }
}

export { init, updateSky };
