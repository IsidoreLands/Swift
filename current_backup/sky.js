import * as THREE from 'three';

let galaxyGroup; // Group for textured mesh and overlay particles
let backgroundParticles; // Full-sphere background stars

// Shaders for particles (soft circular points with alpha fade)
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

// Custom shader for textured mesh with edge fade, color adjustment, and improved blending
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
        // Dim and desaturate for cool, ethereal background
        float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        texColor.rgb = mix(texColor.rgb, vec3(gray), 0.5) * 0.4;
        // Softer edge fade over wider margin (TYPO CORRECTED HERE)
        float fade = min(min(vUv.x * 5.0, (1.0 - vUv.x) * 5.0), min(vUv.y * 5.0, (1.0 - vUv.y) * 5.0));
        fade = clamp(fade, 0.0, 1.0);
        gl_FragColor = texColor * opacity * fade;
    }
`;

async function init(scene) {
    const radius = 1900;

    // Create a group for galaxy elements to simplify rotation
    galaxyGroup = new THREE.Group();
    galaxyGroup.rotation.z = Math.PI / 12;
    scene.add(galaxyGroup);

    // Background particles (full sphere of dim stars)
    const bgPositions = [];
    const bgColors = [];
    const bgSizes = [];
    const numStars = 10000;

    for (let i = 0; i < numStars; i++) {
        const polarAngle = Math.random() * Math.PI;
        const azimuthalAngle = Math.random() * 2 * Math.PI;

        const x = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
        const y = radius * Math.cos(polarAngle);
        const z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);

        bgPositions.push(x, y, z);

        const intensity = Math.random() * 0.5 + 0.3;
        bgColors.push(intensity, intensity, intensity * 0.9); // Slight blue tint
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

    // Load texture and image data concurrently for efficiency
    const textureLoader = new THREE.TextureLoader();
    const texturePromise = new Promise((resolve) => {
        textureLoader.load('eso0932a.jpg', (texture) => {
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.encoding = THREE.sRGBEncoding;
            resolve(texture);
        });
    });

    const imagePromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = 'eso0932a.jpg';
    });

    const [texture, img] = await Promise.all([texturePromise, imagePromise]);

    // Milky Way textured diffuse layer (partial sphere patch)
    const phiStart = 7 * Math.PI / 4 - Math.PI / 2; // 180° azimuthal width
    const phiLength = Math.PI;
    const thetaStart = Math.PI / 2 - (0.5 * Math.PI / 2); // ~90° polar height
    const thetaLength = 0.5 * Math.PI;

    const meshGeometry = new THREE.SphereGeometry(radius, 128, 64, phiStart, phiLength, thetaStart, thetaLength);

    const meshMaterial = new THREE.ShaderMaterial({
        uniforms: {
            map: { value: texture },
            opacity: { value: 0.6 } // Subtle gas glow
        },
        vertexShader: meshVertexShader,
        fragmentShader: meshFragmentShader,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.NormalBlending,
        depthTest: true,
        depthWrite: false
    });

    const galaxyMesh = new THREE.Mesh(meshGeometry, meshMaterial);
    galaxyGroup.add(galaxyMesh);

    // Overlay particles: Extract resolved stars from image data
    const canvas = document.createElement('canvas'); // Create canvas dynamically
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const positions = [];
    const colors = [];
    const sizes = [];
    const brightnessThreshold = 120; // Threshold for brighter stars
    const jitterStrength = 15.0; // Position jitter for depth effect
    const subsampleStep = 3; // Subsampling for performance

    const startXRatio = 0.25;
    const endXRatio = 0.75;
    const startYRatio = 0.25;
    const endYRatio = 0.75;
    const originalAzCenter = ((startXRatio + endXRatio) / 2) * Math.PI * 2;
    const originalPolCenter = ((startYRatio + endYRatio) / 2) * Math.PI;

    const centerAz = 7 * Math.PI / 4;
    const centerPol = Math.PI / 2;

    for (let y = Math.floor(h * startYRatio); y < h * endYRatio; y += subsampleStep) {
        for (let x = Math.floor(w * startXRatio); x < w * endXRatio; x += subsampleStep) {
            const i = (y * w + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            if (brightness > brightnessThreshold) {
                let azimuthalAngle = (x / w) * Math.PI * 2;
                let polarAngle = (y / h) * Math.PI;

                azimuthalAngle = azimuthalAngle - originalAzCenter + centerAz;
                polarAngle = polarAngle - originalPolCenter + centerPol;

                const X = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
                const Y = radius * Math.cos(polarAngle);
                const Z = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);

                const jx = (Math.random() - 0.5) * jitterStrength;
                const jy = (Math.random() - 0.5) * jitterStrength;
                const jz = (Math.random() - 0.5) * jitterStrength;

                positions.push(X + jx, Y + jy, Z + jz);
                colors.push(r / 255 * 0.7, g / 255 * 0.7, b / 255 * 0.8);
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

    const galaxyParticles = new THREE.Points(geometry, material);
    galaxyGroup.add(galaxyParticles);
}

function updateSky() {
    // Reverted to subtle production speed
    if (galaxyGroup) {
        galaxyGroup.rotation.y -= 0.0001; 
    }
    if (backgroundParticles) {
        backgroundParticles.rotation.y -= 0.0001;
    }
}

export { init, updateSky };
