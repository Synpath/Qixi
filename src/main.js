import * as THREE from 'three';
import birdUrl from './assets/Magpie.mp3'
import {boidNum, height, width} from './boids.js'
import {zeroOut, updateInstance, initBoids, updateMat, inBounds, limitSpeed, buildGrid, createBoid} from './boids.js'
import {collect, cohesion, alignment, separation} from './boids.js'
import {typeWriter, reverseType, prepText, loadSFX} from './text.js'

// press Enter to start, fully refresh page if nothing appears since event listener is one time use
// fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
// npx vite

let scene, camera, renderer
let textMap

const target = "textBox"
const numLines = 21;
const typeSpeed = 35;
const untypeSpeed = 50;
const blankTime = 3000;
const FPS = 60;
const frameInterval = 1000 / FPS;
let lastFrame = 0;

const container = document.getElementById("container");

const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
const birdCall = new THREE.Audio(listener);

let HEIGHT = container.clientHeight;
let WIDTH = container.clientWidth;

function initScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // const loader = new THREE.TextureLoader();
    // loader.load('./src/assets/galaxy.png', function(texture) {
    //   scene.background = texture;
    //   scene.backgroundIntensity = 0.1;
    // });

    camera = new THREE.PerspectiveCamera( 75, WIDTH / HEIGHT, 0.1, 1000 );
    camera.position.set(0, 0, 0);
    camera.add(listener);

    audioLoader.load(birdUrl, function (buffer) {
      birdCall.setBuffer(buffer);
      birdCall.setLoop(true);
      birdCall.setVolume(0.1);
    });

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

} // initScene

async function init() {

    birdCall.play();
    await loadSFX(audioLoader, listener);

    initBoids(scene, camera);
    textMap = prepText();
    printText();
    
    requestAnimationFrame(animate);
}

async function printText() {

  for (let i = 0; i < numLines; i++) {

    if (i == 0) await new Promise((resolve => setTimeout(resolve, 4000)));
    let item = textMap.get(i);

    await typeWriter(item.text, target, typeSpeed); 
    await reverseType(target, untypeSpeed);
    createBoid(width, height, item.num - boidNum, boidNum)
    await new Promise((resolve) => setTimeout(resolve, blankTime));
  }
}

// -----------------------------------------------

function animate(timestamp) {
    requestAnimationFrame(animate);
    if (timestamp - lastFrame < frameInterval) {
      return;
    }

    lastFrame = timestamp - ((timestamp - lastFrame) % frameInterval);

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
}

document.addEventListener('keyup', function(event) {
  if (event.key == 'Enter') {
      init();
      console.log("hello");
  }
}, {once: true});

initScene();