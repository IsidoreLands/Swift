import * as THREE from 'three';

let skyPlane;

function createSky(scene) {
    const textureLoader = new THREE.TextureLoader();
    const skyTexture = textureLoader.load('eso0932a.jpg', (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
    });

    const skyGeo = new THREE.PlaneGeometry(12000, 3000);
    // Switched to AdditiveBlending to hide noise and make stars glow.
    const skyMat = new THREE.MeshBasicMaterial({ 
        map: skyTexture,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    skyPlane = new THREE.Mesh(skyGeo, skyMat);
    
    skyPlane.position.set(0, 700, -4000); 
    scene.add(skyPlane);
}

function updateSky() {
    if (skyPlane) {
        skyPlane.material.map.offset.x -= 0.00005;
    }
}

export { createSky, updateSky };
