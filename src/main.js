import * as THREE from 'three'

// const clock = new THREE.Timer();

// fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
// npx vite

let scene, camera, renderer

let FOV, boidDistance, height, width

let boidNum, range, cube, cellSize

let boids = [];
let grid = new Map();
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
    boidNum = 2000;
    range = 7;
    cellSize = range;

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
            dz: 0,

            nextDX: 0,
            nextDY:0,
        });

        dummy.position.set(x, y, z);
        dummy.updateMatrix();

        cube.setMatrixAt(i, dummy.matrix);
    }
    scene.add(cube);

    animate();

    let test = "hello world! my name is blah blah and today i'll be doing pblah blah again\n hello again its me :D";
    typeWriter(test, "textBox", 50, false);
}

// get the cell where the boid is in
// 

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
    const marginX = 3; //10
    const marginY = 10;

    let x = boids[index].x;
    let y = boids[index].y;

    if ((x < (-width/2 + 0.5) + marginX)) {
        boids[index].dx += turnFactor;
    }

    if ((x > (width / 2 - 0.5) - marginX)) {
        boids[index].dx -= turnFactor;
    }

    if ((y < (-height/2 + 0.5) + marginY)) {
        boids[index].dy += turnFactor;
    }

    if ((y > (height / 2 - 0.5) - marginY)) {
        boids[index].dy -= turnFactor;
    }
}

function limitSpeed(index) {
  const speedLimit = 0.5;
  const speed = Math.sqrt(boids[index].dx * boids[index].dx + boids[index].dy * boids[index].dy + boids[index].dz * boids[index].dz);
  
  if (speed > speedLimit) {
    boids[index].dx = (boids[index].dx / speed) * speedLimit;
    boids[index].dy = (boids[index].dy / speed) * speedLimit;
    // boids[index].dz = (boids[index].dz / speed) * speedLimit;
  } 
}

function distance(boid1, boid2) {
    // boid1/boid2 are indices

    let xDist = boids[boid1].x - boids[boid2].x;
    let yDist = boids[boid1].y - boids[boid2].y;

    return xDist * xDist + yDist * yDist;
}

function getCell(x, y) {
    let cellX = Math.floor(x / cellSize);
    let cellY = Math.floor(y / cellSize);

    return `${cellX},${cellY}`
}

function buildGrid() {
    grid.clear();

    for (let i = 0; i < boidNum; i++) {

        let key = getCell(boids[i].x, boids[i].y);

        if (!grid.has(key)) {
            grid.set(key, []);
        }
        
        grid.get(key).push(i);
    }
} //buildGrid

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
function collect(boid) {
    // boid is index
    let minDist = 2;

    let cellX = Math.floor(boids[boid].x / cellSize);
    let cellY = Math.floor(boids[boid].y / cellSize);

    let search = Math.ceil(range / cellSize);

    for (let x = -search; x <= search; x++) {
        for (let y = -search; y <= search; y++) {
            let key = `${cellX + x},${cellY + y}`;

            if (!grid.has(key)) continue;

            let neighbors = grid.get(key);

            for (let bird of neighbors) {

                let distQ = distance(boid, bird);

                if (distQ < range * range) {
                    avgX += boids[bird].dx;
                    avgY += boids[bird].dy;

                    centerX += boids[bird].x;
                    centerY += boids[bird].y;

                    numBoids++;
                }

                if (bird !== boid) {
                    if (distQ < minDist * minDist && distQ > 0) {

                        let dx = boids[boid].x - boids[bird].x;
                    let dy = boids[boid].y - boids[bird].y;

                    moveX += dx / distQ;
                    moveY += dy / distQ;

                        // moveX += (boids[boid].x - boids[bird].x);
                        // moveY += (boids[boid].y - boids[bird].y);
                    }
                }
            }
        } //forY
    } //forX 
} // collect

// steer to move towards the average position (center of mass) of local flockmates
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

function alignment(boid) {
    let ratio = 0.05;

    if (numBoids != 0) {
        avgX /= numBoids;
        avgY /= numBoids;

        boids[boid].dx += (avgX - boids[boid].dx) * ratio;
        boids[boid].dy += (avgY - boids[boid].dy) * ratio;
    }
} // alignment

function separation(boid) {
    let ratio = 0.05;

    boids[boid].dx += moveX * ratio;
    boids[boid].dy += moveY * ratio;
} // separation

function animate() {
    buildGrid();

  for (let boid = 0; boid < boidNum; boid++) {

    numBoids = 0;
    avgX = 0;
    avgY = 0;
    moveX = 0;
    moveY = 0;
    centerX = 0;
    centerY = 0;

    collect(boid);
    cohesion(boid);
    separation(boid);
    alignment(boid);
    limitSpeed(boid);
    inBounds(boid);
    updateMat(boid);
  }

  cube.instanceMatrix.needsUpdate = true;
  renderer.render( scene, camera );
  requestAnimationFrame(animate);
}

init();