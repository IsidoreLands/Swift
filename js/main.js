import * as THREE from 'three';
import * as fireworks from './fireworks.js';

// Self-invoking main function, replaces $(document).ready()
(function main() {
    let renderer, scene, camera;

    // Use a class to manage state, replacing the old 'self' pattern
    class App {
        constructor() {
            this.init();
        }

        init() {
            const canvas = document.querySelector('#canvas');
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            this.onResize(); // Set initial size
            window.addEventListener('resize', this.onResize);

            this.loadFiles();
        }

        loadFiles() {
            const loader = new THREE.FileLoader();
            const files = ['glsl/quad.vert', 'glsl/quad.frag'];

            const promises = files.map(file => 
                new Promise(resolve => loader.load(file, resolve))
            );

            Promise.all(promises).then(shaderFiles => {
                fireworks.init(scene, shaderFiles);
                this.render();
            });
        }

        render() {
            renderer.render(scene, camera);
            fireworks.update();
            requestAnimationFrame(() => this.render());
        }

        onResize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    }

    new App();
})();
