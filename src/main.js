import * as THREE from 'three';
import {boidNum, height, width} from './boids.js'
import {zeroOut, updateInstance, initBoids, updateMat, inBounds, limitSpeed, buildGrid, createBoid} from './boids.js'
import {collect, cohesion, alignment, separation} from './boids.js'
import {typeWriter, reverseType, prepText} from './text.js'

// const clock = new THREE.Timer();

// press Enter to start, fully refresh page if nothing appears since event listener is one time use
// fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
// npx vite

let scene, camera, renderer
let textMap

const target = "textBox"
const numLines = 21;
const typeSpeed = 35;
const untypeSpeed = 50;
const blankTime = 4000;

const container = document.getElementById("container");

let HEIGHT = container.clientHeight;
let WIDTH = container.clientWidth;

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); //0x02132e

    camera = new THREE.PerspectiveCamera( 75, WIDTH / HEIGHT, 0.1, 1000 );
    camera.position.set(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById("canvas"),
        antialias: false }),
    renderer.setPixelRatio(0.6); //1

    renderer.setSize( WIDTH, HEIGHT );
    container.appendChild( renderer.domElement ); 

    window.addEventListener('resize', () => {
        HEIGHT = container.clientHeight;
        WIDTH = container.clientWidth;
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
        renderer.setSize(WIDTH, HEIGHT);
    });

    initBoids(scene, camera);
    textMap = await prepText();
    printText();
    animate();
}

async function printText() {

  for (let i = 0; i < numLines; i++) {
    let item = textMap.get(i);

    await typeWriter(item.text, target, typeSpeed); 
    await reverseType(target, untypeSpeed);
    createBoid(width, height, item.num - boidNum, boidNum)
    await new Promise((resolve) => setTimeout(resolve, blankTime));
  }
}

// -----------------------------------------------

function animate() {
    buildGrid();

  // TODO: could parallelize this?
  // only caveat is that it wouldnt take into account old boid data which allows the swarm
  // to keep moving around AFAIK
  for (let boid = 0; boid < boidNum; boid++) {
    zeroOut();
    collect(boid);
    cohesion(boid);
    separation(boid);
    alignment(boid);
    limitSpeed(boid);
    inBounds(boid);
    updateMat(boid);
  }

  updateInstance();
  renderer.render( scene, camera );
  requestAnimationFrame(animate);
}

// document.addEventListener('keyup', function(event) {
//   if (event.key == 'Enter') {
//       init();
//       console.log("hello");
//   }
// }, {once: true});

init();