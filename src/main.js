import * as THREE from 'three'

// const clock = new THREE.Timer();

// fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
// npx vite

let scene, camera, renderer

let FOV, boidDistance, height, width

let boidNum, range, cube
let boids = [];
let dummy = new THREE.Object3D();

const container = document.getElementById("container");
const HEIGHT = container.clientHeight;
const WIDTH = container.clientWidth;

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
    boidNum = 100;
    range = 7;

    FOV = THREE.MathUtils.degToRad(camera.fov);
    height = 2 * Math.tan(FOV / 2) * boidDistance;
    width = height * camera.aspect;

    let geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    let mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
    cube = new THREE.InstancedMesh(geom, mat, boidNum);

    for (let i = 0; i < boidNum; i++) {

        let x = (Math.random() - 0.5) * (width - 0.5);
        let y = (Math.random() - 0.5) * (height - 0.5);
        let z = -boidDistance;

        boids.push({
            x: x,
            y: y,
            dx: Math.random(),
            dy: Math.random(),
            dz: 0
        });

        dummy.position.set(x, y, z);
        dummy.updateMatrix();

        cube.setMatrixAt(i, dummy.matrix);
    }
    scene.add(cube);

    // for (let i = 0; i < boidNum; i++) {
    //     let geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    //     let mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
    //     let cube = new THREE.Mesh(geom, mat);
    //     boids[boids.length] = {
    //         mesh: cube,
    //         dx: Math.random(),
    //         dy: Math.random(),
    //         dz: 0
    //     }

    //     cube.position.x = (Math.random() - 0.5) * (width - 0.5);
    //     cube.position.y = (Math.random() - 0.5) * (height - 0.5);
    //     cube.position.z = -boidDistance;
    //     scene.add(cube);
    // }

    animate();

    let test = "hello world! my name is blah blah and today i'll be doing pblah blah again\n hello again its me :D";
    typeWriter(test, "textBox", 50, false);
}

// ---------------------------------------
function updateMat(index) {

    boids[index].x += boids[index].dx;
    boids[index].y += boids[index].dy;

    dummy.position.set(boids[index].x, boids[index].y, -boidDistance);
    dummy.updateMatrix();
    cube.setMatrixAt(index, dummy.matrix);
}

function inBounds(index) {
    const turnFactor = 0.015;
    const margin = 10;

    let x = boids[index].x;
    let y = boids[index].y;

    if ((x < (-width/2 + 0.5) + margin)) {
        boids[index].dx += turnFactor;
    }

    if ((x > (width / 2 - 0.5) - margin)) {
        boids[index].dx -= turnFactor;
    }

    if ((y < (-height/2 + 0.5) + margin)) {
        boids[index].dy += turnFactor;
    }

    if ((y > (height / 2 - 0.5) - margin)) {
        boids[index].dy -= turnFactor;
    }
}

// function inBounds(boid) {
//     const turnFactor = 0.015;
//     const margin = 10;

//     if ((boid.mesh.position.x < (-width/2 + 0.5) + margin)) {
//         boid.dx += turnFactor;
//     }

//     if ((boid.mesh.position.x > (width / 2 - 0.5) - margin)) {
//         boid.dx -= turnFactor;
//     }

//     if ((boid.mesh.position.y < (-height/2 + 0.5) + margin)) {
//         boid.dy += turnFactor;
//     }

//     if ((boid.mesh.position.y > (height / 2 - 0.5) - margin)) {
//         boid.dy -= turnFactor;
//     }

//     if ((boid.mesh.position.z > -boidDistance)) {
//         boid.dz -= turnFactor;
//     }

//     if ((boid.mesh.position.z < -boidDistance - 50)) {
//         boid.dz += turnFactor;
//     }
// }

function limitSpeed(index) {
  const speedLimit = 0.5;
  const speed = Math.sqrt(boids[index].dx * boids[index].dx + boids[index].dy * boids[index].dy + boids[index].dz * boids[index].dz);
  if (speed > speedLimit) {
    boids[index].dx = (boids[index].dx / speed) * speedLimit;
    boids[index].dy = (boids[index].dy / speed) * speedLimit;
    boids[index].dz = (boids[index].dz / speed) * speedLimit;
  }

}

// function limitSpeed(boid) {
//   const speedLimit = 0.5;
//   const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy + boid.dz * boid.dz);
//   if (speed > speedLimit) {
//     boid.dx = (boid.dx / speed) * speedLimit;
//     boid.dy = (boid.dy / speed) * speedLimit;
//     boid.dz = (boid.dz / speed) * speedLimit;
//   }

// }

function distance(boid1, boid2) {
    // boid1/boid2 are indices

    let xDist = boids[boid1].x - boids[boid2].x;
    let yDist = boids[boid1].y - boids[boid2].y;

    return xDist * xDist + yDist * yDist;
}

// function distance(boid1, boid2) {
//     let xDist = boid1.mesh.position.x - boid2.mesh.position.x;
//     let yDist = boid1.mesh.position.y - boid2.mesh.position.y;
//     let zDist = boid1.mesh.position.z - boid2.mesh.position.z;

//     return xDist * xDist + yDist * yDist + zDist * zDist;
// }

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
} // typeWriter

// -----------------------------------------------
let avgX = 0;
let avgY = 0;
let numBoids = 0;
let moveX = 0;
let moveY = 0;
let centerX = 0;
let centerY = 0;

// add up all the required params for later functions like avg velocity and avg position
// function collect(boid) {
    
//     let minDist = 1.5;

//     for (let bird of boids) {
//         if (distance(boid, bird) < range * range) {
//             avgX += bird.dx;
//             avgY += bird.dy;
//             centerX += bird.mesh.position.x;
//             centerY += bird.mesh.position.y;

//             numBoids++;
//         }

//         if (bird != boid) {
//             if (distance(boid, bird) < minDist * minDist) {
//                 moveX += (boid.mesh.position.x - bird.mesh.position.x);
//                 moveY += (boid.mesh.position.y - bird.mesh.position.y);
//                 // moveZ += (boid.mesh.position.z - bird.mesh.position.z);
//             }
//         }
//     }
// } // collect

function collect(boid) {
    // boid is index
    let minDist = 1.5;

    for (let i = 0; i < boidNum; i++) {
        if (distance(boid, i) < range * range) {
            avgX += boids[i].dx;
            avgY += boids[i].dy;

            centerX += boids[i].x;
            centerY += boids[i].y;

            numBoids++;
        }

        if (boids[i] != boids[boid]) {
            if (distance(boid, i) < minDist * minDist) {
                moveX += (boids[boid].x - boids[i].x);
                moveY += (boids[boid].y - boids[i].y);
                // moveZ += (boid.mesh.position.z - bird.mesh.position.z);
            }
        }
    }
} // collect

// steer to move towards the average position (center of mass) of local flockmates
// function cohesion(boid) {
//     let ratio = 0.009;

//     if (numBoids != 0) {
//         centerX /= numBoids; 
//         centerY /= numBoids; 
//         boid.dx += (centerX - boid.mesh.position.x) * ratio;
//         boid.dy += (centerY - boid.mesh.position.y) * ratio;
//     }
    
// } // cohesion

function cohesion(boid) {
    // boid is index
    let ratio = 0.009;

    if (numBoids != 0) {
        centerX /= numBoids; 
        centerY /= numBoids; 
        boids[boid].dx += (centerX - boids[boid].x) * ratio;
        boids[boid].dy += (centerY - boids[boid].y) * ratio;
    }
    
} // cohesion

// function alignment(boid) {
//     let ratio = 0.05;

//     let num = numBoids - 1;

//     if (num != 0) {
//         avgX /= num;
//         avgY /= num;

//         boid.dx += (avgX - boid.dx) * ratio;
//         boid.dy += (avgY - boid.dy) * ratio;
//     }
// } // alignment

function alignment(boid) {
    let ratio = 0.05;

    numBoids--;

    if (numBoids != 0) {
        avgX /= numBoids;
        avgY /= numBoids;

        boids[boid].dx += (avgX - boids[boid].dx) * ratio;
        boids[boid].dy += (avgY - boids[boid].dy) * ratio;
    }
} // alignment

// function separation(boid) {
//     let ratio = 0.05;

//     boid.dx += moveX * ratio;
//     boid.dy += moveY * ratio;
// } // separation



// ------------------------------------------------

function separation(boid) {
    let ratio = 0.05;

    boids[boid].dx += moveX * ratio;
    boids[boid].dy += moveY * ratio;
} // separation

function animate() {

  for (let boid = 0; boid < boidNum; boid++) {
    collect(boid);
    cohesion(boid);
    separation(boid);
    alignment(boid);

    limitSpeed(boid);
    inBounds(boid);
    
    updateMat(boid);
    // boid.mesh.position.z += boid.dz;

    numBoids = 0;
    avgX = 0;
    avgY = 0;
    moveX = 0;
    moveY = 0;
    centerX = 0;
    centerY = 0;
  }

  cube.instanceMatrix.needsUpdate = true;
  renderer.render( scene, camera );
  requestAnimationFrame(animate);
}

init();