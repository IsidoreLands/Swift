import * as THREE from 'three';

let skyDome; // Textured dome for gas/rifts
let starParticles; // Bright resolved stars
let backgroundParticles; // Procedural faint stars with twinkling

// Particle shader with twinkling (noise-based animation)
const particleVertexShader = `
    precision mediump float;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float time;
    attribute vec3 position;
    attribute vec3 color;
    attribute float size;
    varying vec3 vColor;

    // Simple noise for twinkling
    float noise(vec3 p) {
        return sin(p.x * 10.0 + time) * sin(p.y * 10.0 + time) * sin(p.z * 10.0 + time);
    }

    void main() {
        vColor = color * (1.0 + 0.1 * noise(position)); // Subtle intensity variation
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (1.0 + 0.05 * noise(position)); // Slight size pulse
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
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist); // Soft edges
        gl_FragColor = vec4(vColor, alpha);
    }
`;

// Dome shader for diffuse gas with glow/fade
const domeVertexShader = `
    precision mediump float;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const domeFragmentShader = `
    precision mediump float;
    uniform sampler2D map;
    uniform float opacity;
    uniform float time;
    varying vec2 vUv;

    void main() {
        vec4 texColor = texture2D(map, vUv);
        // Dim/desaturate for natural blend
        float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        texColor.rgb = mix(texColor.rgb, vec3(gray * 0.8, gray * 0.8, gray), 0.6);
        // Subtle glow pulse
        texColor.rgb *= 0.7 + 0.05 * sin(time + vUv.x * 10.0 + vUv.y * 5.0);
        // Edge fade
        float fade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y) * smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        gl_FragColor = texColor * opacity * fade;
    }
`;

function init(scene) {
    const radius = 5000; // Larger for less curvature in first-person

    // Procedural background faint stars (low density, twinkling)
    const bgPositions = [];
    const bgColors = [];
    const bgSizes = [];
    const numBgStars = 5000; // Reduced for better performance

    for (let i = 0; i < numBgStars; i++) {
        const theta = Math.acos(2 * Math.random() - 1); // Uniform distribution
        const phi = Math.random() * 2 * Math.PI;

        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        bgPositions.push(x, y, z);
        const intensity = Math.random() * 0.3 + 0.2;
        bgColors.push(intensity, intensity, intensity * 0.95);
        bgSizes.push(Math.random() * 1.0 + 0.5);
    }

    const bgGeometry = new THREE.BufferGeometry();
    bgGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.Float32BufferAttribute(bgColors, 3));
    bgGeometry.setAttribute('size', new THREE.Float32BufferAttribute(bgSizes, 1));

    const bgMaterial = new THREE.RawShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false, // Background layer
        depthWrite: false
    });

    backgroundParticles = new THREE.Points(bgGeometry, bgMaterial);
    backgroundParticles.renderOrder = -1; // Render first to avoid clipping
    scene.add(backgroundParticles);

    // Textured dome for Milky Way gas/rifts (half-sphere, northwest focus)
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('eso0932a.jpg', (texture) => {
        texture.minFilter = THREE.LinearMipMapLinearFilter; // Anti-moiré
        texture.magFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = 16; // Better filtering to reduce aliasing

        // Dome geometry: half-sphere, positioned northwest
        const domeGeometry = new THREE.SphereGeometry(radius, 128, 64, Math.PI * 1.25, Math.PI / 1.5, 0, Math.PI / 2); // Phi start/length for northwest, theta for hemisphere

        const domeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                opacity: { value: 0.5 }, // Subtle glow
                time: { value: 0 }
            },
            vertexShader: domeVertexShader,
            fragmentShader: domeFragmentShader,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false
        });

        skyDome = new THREE.Mesh(domeGeometry, domeMaterial);
        skyDome.position.y = -10; // Slight offset for hill-base view
        skyDome.renderOrder = -2; // Render even earlier
        scene.add(skyDome);
    });

    // Bright star particles from image (low density)
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
        const brightThreshold = 150; // Only bright stars
        const subsample = 6; // Further reduced density for performance and less moiré
        const jitter = 10.0; // Increased jitter to break patterns

        for (let y = 0; y < h; y += subsample) {
            for (let x = 0; x < w; x += subsample) {
                const i = (y * w + x) * 4;
                const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

                if (brightness > brightThreshold) {
                    const theta = (y / h) * Math.PI / 2; // Hemisphere mapping
                    const phi = (x / w) * Math.PI * 2 + Math.PI * 1.25; // Northwest offset

                    let X = radius * Math.sin(theta) * Math.cos(phi);
                    let Y = radius * Math.cos(theta);
                    let Z = radius * Math.sin(theta) * Math.sin(phi);

                    // Add jitter to positions to reduce moiré
                    X += (Math.random() - 0.5) * jitter;
                    Y += (Math.random() - 0.5) * jitter;
                    Z += (Math.random() - 0.5) * jitter;

                    positions.push(X, Y, Z);
                    colors.push(data[i]/255 * 0.8, data[i+1]/255 * 0.8, data[i+2]/255);
                    sizes.push(brightness / 150 + Math.random() * 0.5); // Smaller sizes
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const material = new THREE.RawShaderMaterial({
            uniforms: { time: { value: 0 } },
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        starParticles = new THREE.Points(geometry, material);
        starParticles.renderOrder = -1; // Render early to avoid clipping
        scene.add(starParticles);
    };

    img.src = 'eso0932a.jpg';
}

function updateSky() {
    const time = performance.now() * 0.001; // For twinkling

    if (backgroundParticles) {
        backgroundParticles.material.uniforms.time.value = time;
        backgroundParticles.rotation.y -= 0.00002; // Slower rotation for performance
    }
    if (skyDome) {
        skyDome.material.uniforms.time.value = time;
        skyDome.rotation.y -= 0.00002;
    }
    if (starParticles) {
        starParticles.material.uniforms.time.value = time;
        starParticles.rotation.y -= 0.00002;
    }
}

export { init, updateSky };
