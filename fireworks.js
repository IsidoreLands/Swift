import * as THREE from 'three';

let sceneRef;
const fireworks = [];
const gravity = new THREE.Vector3(0, -0.02, 0);

// --- Firework Class ---
class Firework {
    constructor({ x, y, z, color }) {
        this.color = color;
        this.hasBurst = false;

        // 1. Create the launch particle (the streak)
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
        const material = new THREE.PointsMaterial({
            size: 5,
            color: this.color,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });
        this.leader = new THREE.Points(geometry, material);
        this.leader.position.set(x, y, z);
        this.leader.velocity = new THREE.Vector3(0, Math.random() * 0.8 + 1.2, 0);

        sceneRef.add(this.leader);
    }

    update() {
        if (!this.hasBurst) {
            // Animate the launch streak
            this.leader.velocity.add(gravity);
            this.leader.position.add(this.leader.velocity);

            // Burst when it reaches its apex
            if (this.leader.velocity.y < 0) {
                this.burst();
            }
        } else {
            // Animate the burst particles
            this.burstParticles.material.opacity -= 0.01;
            const positions = this.burstParticles.geometry.attributes.position;
            const velocities = this.burstParticles.geometry.attributes.velocity;

            for (let i = 0; i < positions.count; i++) {
                velocities.setY(i, velocities.getY(i) - 0.003); // Apply gravity
                positions.setX(i, positions.getX(i) + velocities.getX(i));
                positions.setY(i, positions.getY(i) + velocities.getY(i));
                positions.setZ(i, positions.getZ(i) + velocities.getZ(i));
            }
            positions.needsUpdate = true;
        }
    }

    burst() {
        this.hasBurst = true;
        sceneRef.remove(this.leader);

        const count = 300;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;
            velocities[i3] = velocity.x;
            velocities[i3 + 1] = velocity.y;
            velocities[i3 + 2] = velocity.z;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        const material = new THREE.PointsMaterial({
            size: 2,
            color: this.color,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        this.burstParticles = new THREE.Points(geometry, material);
        this.burstParticles.position.copy(this.leader.position);
        sceneRef.add(this.burstParticles);

        // Remove the burst after a short time
        setTimeout(() => {
            sceneRef.remove(this.burstParticles);
        }, 2500);
    }

    isDone() {
        return this.hasBurst && this.burstParticles.material.opacity <= 0;
    }
}

// --- Module Functions ---
function init(scene) {
    sceneRef = scene;
}

function update() {
    // Randomly create new fireworks
    if (Math.random() < 0.03) {
        const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.5);
        fireworks.push(new Firework({
            x: (Math.random() - 0.5) * 150,
            y: 10,
            z: -100 - Math.random() * 50,
            color: color
        }));
    }

    // Update existing fireworks and remove them when finished
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        if (fireworks[i].isDone()) {
            fireworks.splice(i, 1);
        }
    }
}

export { init, update };
