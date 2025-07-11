import * as THREE from 'three';
import * as sceneManager from './sceneManager.js';
import * as fireworks from './fireworks.js';

$(document).ready(function() {
  main();
});

function main() {
  var renderer, scene, camera, stats, gui;
  var self = this;

  var MyGUI = function() {
    this.launch = function() {
      fireworks.createFirework(); // Call the module's function
    }
    this.launchMultiple = function() {
      for (var i = 0; i < 5; i++) {
        setTimeout(function() {
          fireworks.createFirework(); // Call the module's function
        }, (i + 1) * 200);
      }
    }
    this.clear = function() {
      // This functionality will need to be added to the fireworks module if desired
      console.log("Clear function needs implementation in fireworks.js");
    }
  };

  self.init = function() {
    const components = sceneManager.init();
    camera = components.camera;
    scene = components.scene;
    renderer = components.renderer;

    stats = new Stats();
    stats.showPanel(0); 
    $('body').append(stats.dom);

    var mygui = new MyGUI();
    gui = new dat.GUI();
    gui.add(mygui, 'launch');
    gui.add(mygui, 'launchMultiple');
    gui.add(mygui, 'clear');

    self.loadFiles();
  }

  self.loadFiles = function() {
    var loader = new THREE.FileLoader();
    var files = ['glsl/quad.vert', 'glsl/quad.frag'];
    var promises = [];
    for (var i = 0; i < files.length; i++) {
      var p = new Promise(function(resolve, reject) {
        loader.load(files[i], function(data) {
          resolve(data);
        });
      });
      promises.push(p);
    }

    Promise.all(promises).then(function(data) {
      // Pass the scene and shader files to the fireworks module
      fireworks.init(scene, data); 
      self.render();
    });
  }

  self.render = function() {
    stats.begin();
    renderer.render(scene, camera);
    stats.end();

    // The main update call is now handled by the module
    fireworks.update(); 

    requestAnimationFrame(self.render);
  }

  self.onResize = function() {
    sceneManager.onResize();
  }

  $(window).on('resize', self.onResize);

  // The Firework class is now entirely within fireworks.js
  
  self.init();
}
