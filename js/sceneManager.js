import * as THREE from 'three';

let camera, scene, renderer;

function init() {
    const canvas = document.querySelector('#canvas');
    // We must get the WebGL2 context to use modern shaders.
    const context = canvas.getContext('webgl2', { alpha: false });

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: context,
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 100;
    
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
