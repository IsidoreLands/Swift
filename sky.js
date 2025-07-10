import * as THREE from 'three';

let skybox, galaxyParticles;

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
        if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
        gl_FragColor = vec4(vColor, 1.0);
    }
`;


function init(scene) {
    // 1. The main spherical skybox using the 8k starfield
    const skyboxGeo = new THREE.SphereGeometry(2000, 64, 32);
    const skyboxMat = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('8k_stars_milky_way.jpg'),
        side: THREE.BackSide
    });
    skybox = new THREE.Mesh(skyboxGeo, skyboxMat);
    scene.add(skybox);

    // 2. The detailed Milky Way particle layer
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
        const radius = 1900; // Place particles just inside the main skybox

        for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

            if (brightness > brightnessThreshold) {
                const x = (i / 4) % w;
                const y = Math.floor((i / 4) / w);

                // Convert 2D pixel coordinate to a 3D spherical coordinate
                const azimuthalAngle = (x / w) * Math.PI * 2; // Full circle
                const polarAngle = (y / h) * Math.PI; // Half circle (pole to pole)

                // Convert spherical to Cartesian coordinates (X, Y, Z)
                const X = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
                const Y = radius * Math.cos(polarAngle);
                const Z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);
                
                positions.push(X, Y, Z);
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
            transparent: true,
            depthTest: false
        });

        galaxyParticles = new THREE.Points(geometry, material);
        // Rotate the particle system to appear on the "horizon"
        galaxyParticles.rotation.z = Math.PI / 12;
        scene.add(galaxyParticles);
    };

    img.src = 'eso0932a.jpg';
}

function updateSky() {
    // Rotate both layers for a cohesive, deep space effect
    if (skybox) {
        skybox.rotation.y -= 0.0001;
    }
    if (galaxyParticles) {
        galaxyParticles.rotation.y -= 0.00011; // Slightly faster for subtle parallax
    }
}

export { init, updateSky };
