import * as THREE from 'three';

let camera, scene, renderer;

function init() {
    const canvas = document.querySelector('.mainCanvas');
    
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    
    // Call resize handler once to set initial size
    onResize();

    return { camera, scene, renderer };
}

function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

export { init, onResize };
