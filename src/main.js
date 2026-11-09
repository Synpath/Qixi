import * as THREE from 'three'

// const clock = new THREE.Timer();

let scene, camera, renderer

let FOV, boidDistance, height, width

let boidNum, range
let boids = [];

const container = document.getElementById("container");
const HEIGHT = container.clientHeight;
const WIDTH = container.clientWidth;

// fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
// npx vite

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02132e);

    camera = new THREE.PerspectiveCamera( 75, WIDTH / HEIGHT, 0.1, 1000 );
    camera.position.set(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById("canvas"),
        antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( WIDTH, HEIGHT );
    container.appendChild( renderer.domElement );

    window.addEventListener('resize', () => {
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();

        renderer.setSize(WIDTH, HEIGHT);
    });

    boidDistance = 20; //20
    boidNum = 1000;
    range = 7;

    FOV = THREE.MathUtils.degToRad(camera.fov);
    height = 2 * Math.tan(FOV / 2) * boidDistance;
    width = height * camera.aspect;

    for (let i = 0; i < boidNum; i++) {
        let geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        let mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
        let cube = new THREE.Mesh(geom, mat);
        boids[boids.length] = {
            mesh: cube,
            dx: Math.random(),
            dy: Math.random(),
            dz: 0
        }

        cube.position.x = (Math.random() - 0.5) * (width - 0.5);
        cube.position.y = (Math.random() - 0.5) * (height - 0.5);
        cube.position.z = -boidDistance;
        scene.add(cube);
    }

    if (5) {
        console.log(width);
        console.log(height);
    }

    animate();

    let test = "hello world! my name is blah blah and today i'll be doing pblah blah again\n hello again its me :D";
    typeWriter(test, "textBox", 50, false);
}

// ---------------------------------------
function inBounds(boid) {
    const turnFactor = 0.015;
    const margin = 10;

    if ((boid.mesh.position.x < (-width/2 + 0.5) + margin)) {
        boid.dx += turnFactor;
    }

    if ((boid.mesh.position.x > (width / 2 - 0.5) - margin)) {
        boid.dx -= turnFactor;
    }

    if ((boid.mesh.position.y < (-height/2 + 0.5) + margin)) {
        boid.dy += turnFactor;
    }

    if ((boid.mesh.position.y > (height / 2 - 0.5) - margin)) {
        boid.dy -= turnFactor;
    }

    if ((boid.mesh.position.z > -boidDistance)) {
        boid.dz -= turnFactor;
    }

    if ((boid.mesh.position.z < -boidDistance - 50)) {
        boid.dz += turnFactor;
    }
}

function limitSpeed(boid) {
  const speedLimit = 0.5;
  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy + boid.dz * boid.dz);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
    boid.dz = (boid.dz / speed) * speedLimit;
  }

}

function distance(boid1, boid2) {
    let xDist = boid1.mesh.position.x - boid2.mesh.position.x;
    let yDist = boid1.mesh.position.y - boid2.mesh.position.y;
    let zDist = boid1.mesh.position.z - boid2.mesh.position.z;

    return Math.sqrt(xDist * xDist + yDist * yDist + zDist * zDist);
}

// write a character to an html element
function writeText(char, target) {
    if (char === '\n') {
      document.getElementById(target).innerHTML += '<br>'; // Add a line break
    } else {
      document.getElementById(target).innerHTML += char;
    }
}

// targetElement: string name of the element
// text: string or variable pointing to the HTML element containing the text you want to print
// script: boolean to switch between string or element text
function typeWriter(text, targetElement, speed, script) {
    let textCon;

  return new Promise((resolve) => {
    if (script) {
      textCon = document.getElementById(text).textContent;
    } else {
      textCon = text;
    }

    let i = 0;
    let timer = setInterval(() => {
      if ((i < textCon.length)) {
        const char = textCon.charAt(i);
        writeText(char, targetElement);
        i++;
      } else {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

// -----------------------------------------------
let avgXX = 0;
let avgYY = 0;
let Num = 0;
let moveXX = 0;
let moveYY = 0;
let cenX = 0;
let cenY = 0;

function collect(boid) {
    
    let minDist = 1.5;

    for (let bird of boids) {
        if (distance(boid, bird) < range) {
            avgXX += bird.dx;
            avgYY += bird.dy;
            cenX += bird.mesh.position.x;
            cenY += bird.mesh.position.y;

            Num++;
        }

        if (bird != boid) {
            if (distance(boid, bird) < minDist) {
                moveXX += (boid.mesh.position.x - bird.mesh.position.x);
                moveYY += (boid.mesh.position.y - bird.mesh.position.y);
                // moveZ += (boid.mesh.position.z - bird.mesh.position.z);
            }
        }
    }
}

function Cohesion(boid) {
    let ratio = 0.009;

    if (Num != 0) {
        cenX /= Num; 
        cenY /= Num; 
        boid.dx += (cenX - boid.mesh.position.x) * ratio;
        boid.dy += (cenY - boid.mesh.position.y) * ratio;
    }
    
}

// steer to move towards the average position (center of mass) of local flockmates
function cohesion(boid) {
    let centerX = 0;
    let centerY = 0;
    let centerZ = 0;
    let ratio = 0.009;
    let num = 0;

    for (let bird of boids) {
        if (distance(boid, bird) < range) {
            centerX += bird.mesh.position.x;
            centerY += bird.mesh.position.y; 
            centerZ += bird.mesh.position.z;

            num++;
        }
    }

    if (num != 0) {
        centerX /= num; 
        centerY /= num; 
        centerZ /= num;
        boid.dx += (centerX - boid.mesh.position.x) * ratio;
        boid.dy += (centerY - boid.mesh.position.y) * ratio;
        boid.dz += (centerZ - boid.mesh.position.z) * ratio;
    }
    
}

function Alignment(boid) {
    let ratio = 0.05;

    let num = Num - 1;

    if (num != 0) {
        avgXX /= num;
        avgYY /= num;

        boid.dx += (avgXX - boid.dx) * ratio;
        boid.dy += (avgYY - boid.dy) * ratio;
    }
}

function alignment(boid) {
    let avgX = 0;
    let avgY = 0;
    let avgZ = 0;
    let ratio = 0.05;
    let num = 0;

    for (let bird of boids) {
        if (distance(boid, bird) < range) {
            avgX += bird.dx;
            avgY += bird.dy;
            avgZ += bird.dz;   
            
            if (bird != boid) {
                num++;
            }
        }
    }

    if (num != 0) {
        avgX /= num;
        avgY /= num; 
        avgZ /= num;

        boid.dx += (avgX - boid.dx) * ratio;
        boid.dy += (avgY - boid.dy) * ratio;
        boid.dz += (avgZ - boid.dz) * ratio;            
    }
}

function Separation(boid) {
    let ratio = 0.05;

    boid.dx += moveXX * ratio;
    boid.dy += moveYY * ratio;
}

function separation(boid) {
    let minDist = 1.5;
    let ratio = 0.05;
    let moveX = 0;
    let moveY = 0;
    let moveZ = 0;

    for (let bird of boids) {
        if (bird != boid) {
            if (distance(boid, bird) < minDist) {
                moveX += (boid.mesh.position.x - bird.mesh.position.x);
                moveY += (boid.mesh.position.y - bird.mesh.position.y);
                moveZ += (boid.mesh.position.z - bird.mesh.position.z);
            }
        }
    }

    boid.dx += moveX * ratio;
    boid.dy += moveY * ratio;
    boid.dz += moveZ * ratio;
}

// ------------------------------------------------
function animate() {
  renderer.render( scene, camera );

  for (let boid of boids) {
    collect(boid);
    Cohesion(boid);
    Separation(boid);
    Alignment(boid);

    limitSpeed(boid);
    inBounds(boid);
    boid.mesh.position.x += boid.dx;
    boid.mesh.position.y += boid.dy;
    // boid.mesh.position.z += boid.dz;
    Num = 0;
    avgXX = 0;
    avgYY = 0;
    moveXX = 0;
    moveYY = 0;
    cenX = 0;
    cenY = 0;
  }

  requestAnimationFrame(animate);
}

init();