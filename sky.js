import * as THREE from 'three';

let galaxyMesh; // Textured gas/rift layer
let galaxyParticles; // Overlay stars for patch
let backgroundParticles; // Full-sphere background

// Shaders for particles
const particleVertexShader = `
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
        gl_PointSize = size * 1.5;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const particleFragmentShader = `
    precision mediump float;
    varying vec3 vColor;

    void main() {
        vec2 coord = gl_PointCoord - vec2(0.5, 0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
    }
`;

// Custom shader for textured mesh with edge fade and color adjustment
const meshVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const meshFragmentShader = `
    uniform sampler2D map;
    uniform float opacity;
    varying vec2 vUv;

    void main() {
        vec4 texColor = texture2D(map, vUv);
        // Dim and desaturate to match cool, dim background
        float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        texColor.rgb = mix(texColor.rgb, vec3(gray), 0.5) * 0.4;
        // Edge fade: softer over wider margin
        float fade = min(min(vUv.x * 5.0, (1.0 - vUv.x) * 5.0), min(vUv.y * 5.0, (1.0 - vUv.y) * 5.0));
        fade = clamp(fade, 0.0, 1.0);
        gl_FragColor = texColor * opacity * fade;
    }
`;

function init(scene) {
    const radius = 1900;

    // Background particles (unchanged)
    const bgPositions = [];
    const bgColors = [];
    const bgSizes = [];
    const numStars = 10000;

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
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: true,
        depthWrite: false
    });

    backgroundParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(backgroundParticles);

    // Milky Way textured diffuse layer
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('eso0932a.jpg', (texture) => {
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        // Adjusted patch size for better rift coverage (wider height)
        const phiStart = 7 * Math.PI / 4 - Math.PI / 2; // 180° width
        const phiLength = Math.PI;
        const thetaStart = Math.PI / 2 - (0.5 * Math.PI / 2); // Increased height ~90° total
        const thetaLength = 0.5 * Math.PI;

        const meshGeometry = new THREE.SphereGeometry(radius, 128, 64, phiStart, phiLength, thetaStart, thetaLength);

        const meshMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                opacity: { value: 0.6 } // Tuned for subtle gas glow
            },
            vertexShader: meshVertexShader,
            fragmentShader: meshFragmentShader,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.NormalBlending,
            depthTest: true,
            depthWrite: false
        });

        galaxyMesh = new THREE.Mesh(meshGeometry, meshMaterial);
        galaxyMesh.rotation.z = Math.PI / 12;
        scene.add(galaxyMesh);
    });

    // Overlay particles for resolved stars in Milky Way
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
        const brightnessThreshold = 120; // Select brighter stars only
        const jitterStrength = 15.0;

        const start_x_ratio = 0.25;
        const end_x_ratio = 0.75;
        const start_y_ratio = 0.25; // Adjusted for taller patch
        const end_y_ratio = 0.75;
        const original_az_center = ((start_x_ratio + end_x_ratio) / 2) * Math.PI * 2;
        const original_pol_center = ((start_y_ratio + end_y_ratio) / 2) * Math.PI;

        const center_az = 7 * Math.PI / 4;
        const center_pol = Math.PI / 2;

        for (let y = Math.floor(h * start_y_ratio); y < h * end_y_ratio; y += 3) { // Moderate subsampling
            for (let x = Math.floor(w * start_x_ratio); x < w * end_x_ratio; x += 3) {
                const i = (y * w + x) * 4;
                const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

                if (brightness > brightnessThreshold) {
                    let azimuthalAngle = (x / w) * Math.PI * 2;
                    let polarAngle = (y / h) * Math.PI;

                    azimuthalAngle = azimuthalAngle - original_az_center + center_az;
                    polarAngle = polarAngle - original_pol_center + center_pol;

                    const X = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
                    const Y = radius * Math.cos(polarAngle);
                    const Z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);

                    const jx = (Math.random() - 0.5) * jitterStrength;
                    const jy = (Math.random() - 0.5) * jitterStrength;
                    const jz = (Math.random() - 0.5) * jitterStrength;

                    positions.push(X + jx, Y + jy, Z + jz);
                    // Dim and cool tint to match background
                    colors.push(data[i] / 255 * 0.7, data[i+1] / 255 * 0.7, data[i+2] / 255 * 0.8);
                    sizes.push((brightness / 100) * (0.6 + Math.random() * 0.4));
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const material = new THREE.RawShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: true,
            depthWrite: false
        });

        galaxyParticles = new THREE.Points(geometry, material);
        galaxyParticles.rotation.z = Math.PI / 12;
        scene.add(galaxyParticles);
    };

    img.src = 'eso0932a.jpg';
}

function updateSky() {
    if (galaxyMesh) {
        galaxyMesh.rotation.y -= 0.001;
    }
    if (galaxyParticles) {
        galaxyParticles.rotation.y -= 0.001;
    }
    if (backgroundParticles) {
        backgroundParticles.rotation.y -= 0.001;
    }
}

export { init, updateSky };
