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

            fireworks.init(scene);
            this.render();
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
