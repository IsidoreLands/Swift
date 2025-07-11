import * as THREE from 'three';

let scene;
const fireworks = [];

function init(threeScene, shaderFiles) {
    scene = threeScene;

    // Modify the loaded shaders to work with RawShaderMaterial
    const vertexShader = `
        precision mediump float;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float time;
        uniform float size;
        attribute vec3 position;
        attribute vec3 velocity;
        
        void main() {
            vec2 pos = position.xy;
            pos.x = pos.x + sin(pos.y * 10.0 + time) * 0.01;
            pos.y = pos.y + cos(pos.x * 10.0 + time) * 0.01;

            vec4 mvPosition = modelViewMatrix * vec4(pos, position.z);
            gl_PointSize = size * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = shaderFiles[1]; // Use the original fragment shader

    // The Firework class now gets the modern shaders passed to it
    Firework.vertexShader = vertexShader;
    Firework.fragmentShader = fragmentShader;

    createFirework(); 
}

function createFirework() {
    fireworks.push(new Firework());
}

function update() {
    if (Math.random() < 0.01) {
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
    static vertexShader = '';
    static fragmentShader = '';

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
            vertexShader: Firework.vertexShader,
            fragmentShader: Firework.fragmentShader,
            uniforms: {
                time: { type: 'f', value: 0.0 },
                size: { type: 'f', value: 5.0 },
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

        // Use modern .setAttribute()
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
