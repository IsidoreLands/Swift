import * as THREE from 'three';

let skyPlane;

function createSky(scene) {
    const textureLoader = new THREE.TextureLoader();
    const skyTexture = textureLoader.load('eso0932a.jpg', (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
    });

    const skyGeo = new THREE.PlaneGeometry(8000, 2000);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture });
    skyPlane = new THREE.Mesh(skyGeo, skyMat);
    skyPlane.position.set(0, 200, -3000); // Position it far in the background
    scene.add(skyPlane);
}

function updateSky() {
    if (skyPlane) {
        // This creates the slow, continuous scrolling effect
        skyPlane.material.map.offset.x -= 0.0001;
    }
}

export { createSky, updateSky };
