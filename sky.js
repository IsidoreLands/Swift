import * as THREE from 'three';

let skyboxPlane, galaxyPlane;
const GALAXY_SCROLL_SPEED = 0.00004; // Slower speed for the distant galaxy
const SKYBOX_PARALLAX_FACTOR = 0.85; // Makes skybox scroll slightly faster than galaxy

function createSky(scene) {
    const textureLoader = new THREE.TextureLoader();

    // 1. Farthest Layer: The detailed Milky Way (eso0932a.jpg)
    // Displayed on a plane with the correct 2:1 aspect ratio to avoid distortion.
    const galaxyTexture = textureLoader.load('eso0932a.jpg');
    const galaxyGeo = new THREE.PlaneGeometry(8000, 4000); // Correct 2:1 aspect ratio
    const galaxyMat = new THREE.MeshBasicMaterial({
        map: galaxyTexture,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    galaxyPlane = new THREE.Mesh(galaxyGeo, galaxyMat);
    galaxyPlane.position.set(0, 500, -5000); // Positioned very far back
    scene.add(galaxyPlane);

    // 2. Nearer Layer: The main starfield (8k_stars_milky_way.jpg)
    // This plane is larger and closer to create the parallax effect.
    const skyboxTexture = textureLoader.load('8k_stars_milky_way.jpg', (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
    });
    const skyboxGeo = new THREE.PlaneGeometry(10000, 5000);
    const skyboxMat = new THREE.MeshBasicMaterial({
        map: skyboxTexture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.7 // Slightly transparent to ensure galaxy is visible
    });
    skyboxPlane = new THREE.Mesh(skyboxGeo, skyboxMat);
    skyboxPlane.position.set(0, 500, -4500); // Closer than the galaxy plane
    scene.add(skyboxPlane);
}

function updateSky() {
    // Scroll both layers at slightly different speeds for parallax
    if (galaxyPlane) {
        galaxyPlane.material.map.offset.x -= GALAXY_SCROLL_SPEED;
    }
    if (skyboxPlane) {
        skyboxPlane.material.map.offset.x -= GALAXY_SCROLL_SPEED / SKYBOX_PARALLAX_FACTOR;
    }
}

export { createSky, updateSky };
