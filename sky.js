import * as THREE from 'three';

let skyPlane;

function createSky(scene) {
    const textureLoader = new THREE.TextureLoader();
    const skyTexture = textureLoader.load('eso0932a.jpg', (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
    });

    const skyGeo = new THREE.PlaneGeometry(12000, 3000);
    // Add the 'color' property to dim the texture, reducing noise.
    const skyMat = new THREE.MeshBasicMaterial({ 
        map: skyTexture,
        color: 0x999999 
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
