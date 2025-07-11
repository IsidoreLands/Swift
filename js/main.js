// Aguamenti - https://codepen.io/ashthornton/pen/vLBeLg

$(document).ready(function() {
  main();
});

function main() {
  var canvas, renderer, scene, camera, stats, gui;
  var fireworks = [];
  var self = this;

  var MyGUI = function() {
    this.launch = function() {
      self.createFirework();
    }
    this.launchMultiple = function() {
      for (var i = 0; i < 5; i++) {
        setTimeout(function() {
          self.createFirework();
        }, (i + 1) * 200);
      }
    }
    this.clear = function() {
      fireworks = [];
    }
  };

  self.init = function() {
    canvas = $('#canvas')[0];

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    self.onResize();

    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
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
        var fileIndex = i;
        loader.load(files[i], function(data) {
          resolve(data);
        });
      });
      promises.push(p);
    }

    Promise.all(promises).then(function(data) {
      self.files = data;
      self.createFirework();
      self.render();
    });
  }

  self.createFirework = function() {
    fireworks.push(new Firework());
  }

  self.render = function() {
    stats.begin();
    renderer.render(scene, camera);
    stats.end();

    for (var i = fireworks.length - 1; i >= 0; i--) {
      if (fireworks[i].done) {
        fireworks.splice(i, 1);
        continue;
      }
      fireworks[i].update();
    }

    requestAnimationFrame(self.render);
  }

  self.onResize = function() {
    var w = $(window).width();
    var h = $(window).height();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  $(window).on('resize', self.onResize);

  function Firework() {
    var firework = this;
    var a = 8;
    var b = 15;
    var c = 15;
    var m = 2;
    var n1 = 12;
    var n2 = 12;
    var n3 = 12;
    var TWO_PI = Math.PI * 2;
    var vertices = [];
    var velocities = [];
    var explosion = [];

    var hu = Math.random();

    self.init = function() {
      var x = Math.random() * 40 - 20;
      var y = Math.random() * 20 - 5;
      var z = Math.random() * 40 - 20;
      var pos = new THREE.Vector3(x, y, z);
      var vel = new THREE.Vector3(0, Math.random() * 2 + 10, 0);

      firework.mesh = self.setupGL(pos, vel);
    }

    self.setupGL = function(pos, vel) {
      var g = new THREE.BufferGeometry();
      var m = new THREE.ShaderMaterial({
        vertexShader: self.files[0],
        fragmentShader: self.files[1],
        uniforms: {
          time: {
            type: 'f',
            value: 0.0
          },
          size: {
            type: 'f',
            value: 5.0
          },
          hu: {
            type: 'f',
            value: hu
          },
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });

      var p = new THREE.Points(g, m);
      p.position.copy(pos);
      scene.add(p);

      var point = new THREE.Vector3();
      var vel = new THREE.Vector3();
      var r, ang, ang2;
      for (var i = 0; i < 5000; i++) {
        r = Math.random() * 3.0;
        ang = Math.random() * TWO_PI;
        ang2 = Math.random() * TWO_PI;
        point.x = r * Math.sin(ang) * Math.cos(ang2);
        point.y = r * Math.sin(ang) * Math.sin(ang2);
        point.z = r * Math.cos(ang);
        vertices.push(point.x, point.y, point.z);
        vel.copy(point).multiplyScalar(0.02);
        velocities.push(vel.x, vel.y, vel.z);
      }

      g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      g.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
      return p;
    }

    self.update = function() {
      firework.mesh.material.uniforms.time.value += 0.02;

      if (firework.mesh.material.uniforms.time.value > 2.0) {
        firework.done = true;
        scene.remove(firework.mesh);
      }
    }

    self.init();
  }

  self.init();
}
