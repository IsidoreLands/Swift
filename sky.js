import * as THREE from 'three';

let skybox;

function init(scene) {
    // A large sphere geometry.
    const geometry = new THREE.SphereGeometry(2000, 64, 32);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('8k_stars_milky_way.jpg');

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide // Render the texture on the inside of the sphere
    });

    skybox = new THREE.Mesh(geometry, material);
    scene.add(skybox);
}

function updateSky() {
    // Add a slow rotation to the skybox for a dynamic feel.
    if (skybox) {
        skybox.rotation.y -= 0.0001;
    }
}

export { init, updateSky };
