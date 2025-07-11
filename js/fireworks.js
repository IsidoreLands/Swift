import * as THREE from 'three';

let scene;
const fireworks = [];

// --- Simplified and Corrected Shaders ---
const vertexShader = `
    precision mediump float;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float time;
    uniform float size;

    attribute vec3 position;
    attribute vec3 velocity;
    
    varying vec3 vColor;

    void main() {
        vColor = vec3(1.0, 1.0, 1.0); // We will control color with uniforms
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        // Simple turbulence from the original shader logic
        mvPosition.x += sin(mvPosition.y * 0.5 + time) * 0.5;
        mvPosition.y += cos(mvPosition.x * 0.5 + time) * 0.5;

        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform float hu; // Hue
    varying vec3 vColor;

    // Function to convert HSL to RGB
    vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
        return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
    }

    void main() {
        vec3 color = hsl2rgb(vec3(hu, 1.0, 0.5));
        gl_FragColor = vec4(color, 1.0);
    }
`;


function init(threeScene) { // No longer needs shaderFiles
    scene = threeScene;
    createFirework(); 
}

function createFirework() {
    fireworks.push(new Firework());
}

function update() {
    if (Math.random() < 0.02) {
        createFirework();
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
        if (fireworks[i].done) {
            fireworks.splice(i, 1);
            continue;
        }
        fireworks[i].update();
    }
}

class Firework {
    constructor() {
        this.done = false;
        const vertices = [];
        const velocities = [];
        const hu = Math.random();

        const x = Math.random() * 40 - 20;
        const y = Math.random() * 20 - 5;
        const z = Math.random() * 40 - 20;
        const pos = new THREE.Vector3(x, y, z);
        
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.RawShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                time: { type: 'f', value: 0.0 },
                size: { type: 'f', value: 5.0 + Math.random() * 5.0 },
                hu: { type: 'f', value: hu },
            },
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
        });

        this.mesh = new THREE.Points(geometry, material);
        this.mesh.position.copy(pos);
        scene.add(this.mesh);

        const point = new THREE.Vector3();
        const vel = new THREE.Vector3();
        for (let i = 0; i < 5000; i++) {
            const r = Math.random() * 3.0;
            const ang = Math.random() * Math.PI * 2;
            const ang2 = Math.random() * Math.PI * 2;
            point.x = r * Math.sin(ang) * Math.cos(ang2);
            point.y = r * Math.sin(ang) * Math.sin(ang2);
            point.z = r * Math.cos(ang);
            vertices.push(point.x, point.y, point.z);
            vel.copy(point).multiplyScalar(0.02);
            velocities.push(vel.x, vel.y, vel.z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    }

    update() {
        this.mesh.material.uniforms.time.value += 0.02;
        if (this.mesh.material.uniforms.time.value > 2.0) {
            this.done = true;
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            scene.remove(this.mesh);
        }
    }
}

export { init, update, createFirework };
