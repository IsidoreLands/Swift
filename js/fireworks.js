import * as THREE from 'three';

let scene, files;
const fireworks = [];

function init(threeScene, shaderFiles) {
    scene = threeScene;
    files = shaderFiles;
    // Start with one firework for demonstration
    createFirework(); 
}

function createFirework() {
    fireworks.push(new Firework());
}

function update() {
    // Randomly launch more fireworks over time
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

// --- Firework Class (moved from main.js) ---
class Firework {
    constructor() {
        this.done = false;
        var vertices = [];
        var velocities = [];
        var hu = Math.random();

        var x = Math.random() * 40 - 20;
        var y = Math.random() * 20 - 5;
        var z = Math.random() * 40 - 20;
        var pos = new THREE.Vector3(x, y, z);
        
        var g = new THREE.BufferGeometry();
        var m = new THREE.ShaderMaterial({
            vertexShader: files[0],
            fragmentShader: files[1],
            uniforms: {
                time: { type: 'f', value: 0.0 },
                size: { type: 'f', value: 5.0 },
                hu: { type: 'f', value: hu },
            },
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
        });

        this.mesh = new THREE.Points(g, m);
        this.mesh.position.copy(pos);
        scene.add(this.mesh);

        var point = new THREE.Vector3();
        var vel = new THREE.Vector3();
        for (var i = 0; i < 5000; i++) {
            var r = Math.random() * 3.0;
            var ang = Math.random() * Math.PI * 2;
            var ang2 = Math.random() * Math.PI * 2;
            point.x = r * Math.sin(ang) * Math.cos(ang2);
            point.y = r * Math.sin(ang) * Math.sin(ang2);
            point.z = r * Math.cos(ang);
            vertices.push(point.x, point.y, point.z);
            vel.copy(point).multiplyScalar(0.02);
            velocities.push(vel.x, vel.y, vel.z);
        }

        g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        g.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    }

    update() {
        this.mesh.material.uniforms.time.value += 0.02;
        if (this.mesh.material.uniforms.time.value > 2.0) {
            this.done = true;
            scene.remove(this.mesh);
        }
    }
}

export { init, update, createFirework };
