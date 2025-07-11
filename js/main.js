import * as THREE from 'three';
import * as sceneManager from './sceneManager.js';
import * as fireworks from './fireworks.js';

// Self-invoking main function
(function main() {
    let renderer, scene, camera;

    class App {
        constructor() {
            this.init();
        }

        init() {
            const components = sceneManager.init();
            camera = components.camera;
            scene = components.scene;
            renderer = components.renderer;

            window.addEventListener('resize', this.onResize);

            // Load the shader files, then initialize the fireworks
            this.loadFiles().then(shaderFiles => {
                fireworks.init(scene, shaderFiles);
                this.render();
            });
        }

        loadFiles() {
            const loader = new THREE.FileLoader();
            const files = ['glsl/quad.vert', 'glsl/quad.frag'];
            const promises = files.map(file => 
                new Promise(resolve => loader.load(file, resolve))
            );
            return Promise.all(promises);
        }

        render() {
            renderer.render(scene, camera);
            fireworks.update();
            requestAnimationFrame(() => this.render());
        }

        onResize() {
            sceneManager.onResize();
        }
    }

    new App();
})();
