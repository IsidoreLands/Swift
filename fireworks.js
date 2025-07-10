import * as THREE from 'three';

const FIREWORK_POOL_SIZE = 5;
const FIREWORK_RESPAWN_TIME = 2; // seconds for burst to fade

let fireworks = [];
let sceneRef, clockRef;

function init(scene, clock) {
    sceneRef = scene;
    clockRef = clock;

    for (let i = 0; i < FIREWORK_POOL_SIZE; i++) {
        const firework = {
            active: false,
            burstTime: 0,
            particles: null,
            // Schedules the next spawn
            reset: function() {
                this.active = false;
                if (this.particles) sceneRef.remove(this.particles);
                // Set a random timeout for the next spawn
                setTimeout(() => this.spawn(), Math.random() * 5000 + 1000);
            },
            // Creates a new firework burst
            spawn: function() {
                const geometry = new THREE.BufferGeometry();
                const positions = [];
                const color = new THREE.Color();
                color.setHSL(Math.random(), 1.0, 0.5); // Random hue
                
                // Create 100 particles at the origin for this firework
                for (let i = 0; i < 100; i++) {
                    positions.push(0, 0, 0);
                }
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                
                const material = new THREE.PointsMaterial({
                    size: 5,
                    color: color,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    transparent: true,
                    opacity: 1.0
                });
                
                this.particles = new THREE.Points(geometry, material);
                
                // Position the burst randomly in the distant sky
                this.particles.position.set(
                    (Math.random() - 0.5) * 1000,
                    200 + Math.random() * 300,
                    -1500 - Math.random() * 1000
                );

                sceneRef.add(this.particles);
                this.active = true;
                this.burstTime = clockRef.getElapsedTime();
            }
        };
        fireworks.push(firework);
        firework.reset(); // Initial spawn scheduling
    }
}

function update() {
    if (!clockRef) return;
    const elapsedTime = clockRef.getElapsedTime();

    fireworks.forEach(fw => {
        if (fw.active) {
            const progress = (elapsedTime - fw.burstTime) / FIREWORK_RESPAWN_TIME;
            
            if (progress > 1) {
                fw.reset(); // If fade is complete, reset for next spawn
            } else {
                // Fade out the firework
                fw.particles.material.opacity = 1.0 - progress;
                
                // Expand the particles outwards
                const positions = fw.particles.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                   positions[i] += (Math.random() - 0.5) * 0.5;
                   positions[i+1] += (Math.random() - 0.5) * 0.5;
                   positions[i+2] += (Math.random() - 0.5) * 0.5;
                }
                fw.particles.geometry.attributes.position.needsUpdate = true;
            }
        }
    });
}

export { init, update };
