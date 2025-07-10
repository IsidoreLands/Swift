import * as THREE from 'three';

let skyPlane;

function createSky(scene) {
    const textureLoader = new THREE.TextureLoader();
    const skyTexture = textureLoader.load('eso0932a.jpg', (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
    });

    // Increased plane size significantly to make stars appear smaller
    const skyGeo = new THREE.PlaneGeometry(12000, 3000);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture });
    skyPlane = new THREE.Mesh(skyGeo, skyMat);
    
    // Adjusted Y position to move the texture's center up
    skyPlane.position.set(0, 700, -4000); 
    scene.add(skyPlane);
}

function updateSky() {
    if (skyPlane) {
        // This creates the slow, continuous scrolling effect
        skyPlane.material.map.offset.x -= 0.00005;
    }
}

export { createSky, updateSky };
