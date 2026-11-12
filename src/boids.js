import * as THREE from 'three'

let boids = [];
let grid = new Map();
let dummy = new THREE.Object3D();

// can modify these when spawning more boids
let MARGINX = 3;
let MARGINY = 10;
let speedLimit = 0.5;
export let boidNum = 2000;
let cohFactor = 0.009;
let alignFactor = 0.05;
let sepFactor = 0.05;
let turnFactor = 0.015;
let minDist = 2;

const boidDistance = 20;
const boidSize = 0.5;
const maxBoids = 2000; //2000 limit?
const range = 7;
const cellSize = range;

let height, width, FOV
let cube

// HELPERS -----------------------------
export function initBoids(scene, camera) {
    FOV = THREE.MathUtils.degToRad(camera.fov);
    height = 2 * Math.tan(FOV / 2) * boidDistance;
    width = height * camera.aspect;

    let geom = new THREE.TetrahedronGeometry(boidSize);
    let mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
    cube = new THREE.InstancedMesh(geom, mat, maxBoids);
    cube.count = boidNum;

    for (let i = 0; i < boidNum; i++) {

        let x = (Math.random() - boidSize) * (width + MARGINX - boidSize);
        let y = (Math.random() - boidSize) * (height + MARGINY - boidSize);
        let z = -boidDistance;

        boids.push({
            x: x,
            y: y,
            dx: Math.random(),
            dy: Math.random(),
            dz: 0,
        });

        dummy.position.set(x, y, z);
        dummy.updateMatrix();

        cube.setMatrixAt(i, dummy.matrix);
    }
    scene.add(cube);
} // initBoids

// reset collection variables
export function zeroOut() {
    numBoids = 0;
    avgX = 0;
    avgY = 0;
    moveX = 0;
    moveY = 0;
    centerX = 0;
    centerY = 0;
} // zeroOut

export function updateInstance() {
    cube.instanceMatrix.needsUpdate = true;
} // updateInstance

export function updateMat(index) {

    boids[index].x += boids[index].dx;
    boids[index].y += boids[index].dy;

    dummy.position.set(boids[index].x, boids[index].y, -boidDistance);
    dummy.updateMatrix();
    cube.setMatrixAt(index, dummy.matrix);
} // updateMat

export function inBounds(index) {

    let x = boids[index].x;
    let y = boids[index].y;

    if ((x < (-width/2 + boidSize) + MARGINX)) {
        boids[index].dx += turnFactor;
    }

    if ((x > (width / 2 - boidSize) - MARGINX)) {
        boids[index].dx -= turnFactor;
    }

    if ((y < (-height/2 + boidSize) + MARGINY)) {
        boids[index].dy += turnFactor;
    }

    if ((y > (height / 2 - boidSize) - MARGINY)) {
        boids[index].dy -= turnFactor;
    }
} // inBounds

export function limitSpeed(index) {
  const speed = Math.sqrt(boids[index].dx * boids[index].dx + boids[index].dy * boids[index].dy);
  
  if (speed > speedLimit) {
    boids[index].dx = (boids[index].dx / speed) * speedLimit;
    boids[index].dy = (boids[index].dy / speed) * speedLimit;
  } 
} // limitSpeed

// returns squared distance to avoid costly square root
// boid1/boid2 are indices
function distance(boid1, boid2) {

    let xDist = boids[boid1].x - boids[boid2].x;
    let yDist = boids[boid1].y - boids[boid2].y;

    return xDist * xDist + yDist * yDist;
} // distance

// get the cell coordinates that a boid is in based on its x/y coords
function getCell(x, y) {
    let cellX = Math.floor(x / cellSize);
    let cellY = Math.floor(y / cellSize);

    return `${cellX},${cellY}`
} // getCell

export function buildGrid() {
    grid.clear();

    for (let i = 0; i < boidNum; i++) {

        let key = getCell(boids[i].x, boids[i].y);

        if (!grid.has(key)) {
            grid.set(key, []);
        }
        
        grid.get(key).push(i);
    }
} //buildGrid

// BOIDS ---------------------
let avgX = 0;
let avgY = 0;
let numBoids = 0;
let moveX = 0;
let moveY = 0;
let centerX = 0;
let centerY = 0;

// aggregate all appropriate variables used for the boid algorithm rules
// avoids having to run a for loop for each boid
// also includes its itself in the collection
// boid is index
export function collect(boid) {

    let cellX = Math.floor(boids[boid].x / cellSize);
    let cellY = Math.floor(boids[boid].y / cellSize);

    let search = Math.ceil(range / cellSize);

    for (let x = -search; x <= search; x++) {
        for (let y = -search; y <= search; y++) {
            let key = `${cellX + x},${cellY + y}`;

            if (!grid.has(key)) continue;

            let neighbors = grid.get(key);

            for (let bird of neighbors) {

                let dist = distance(boid, bird);

                if (dist < range * range) {
                    avgX += boids[bird].dx;
                    avgY += boids[bird].dy;

                    centerX += boids[bird].x;
                    centerY += boids[bird].y;

                    numBoids++;       
                }

                if (bird !== boid) {
                    if (dist < minDist * minDist && dist > 0) {

                        let dx = boids[boid].x - boids[bird].x;
                        let dy = boids[boid].y - boids[bird].y;

                        moveX += dx / dist;
                        moveY += dy / dist;
                    }
                }
            }
        } //forY
    } //forX 
} // collect

// steer to move towards the average position (center of mass) of local flockmates
// boid is index
export function cohesion(boid) {

    centerX /= numBoids; 
    centerY /= numBoids; 
    boids[boid].dx += (centerX - boids[boid].x) * cohFactor;
    boids[boid].dy += (centerY - boids[boid].y) * cohFactor;
    
} // cohesion

// adjusts boid velocities to align with the average velocity of the flock
// boid is index
export function alignment(boid) {

    avgX /= numBoids;
    avgY /= numBoids;

    boids[boid].dx += (avgX - boids[boid].dx) * alignFactor;
    boids[boid].dy += (avgY - boids[boid].dy) * alignFactor;
    
} // alignment

// steers boids away from one another
// boid is index
export function separation(boid) {

    boids[boid].dx += moveX * sepFactor;
    boids[boid].dy += moveY * sepFactor;
} // separation