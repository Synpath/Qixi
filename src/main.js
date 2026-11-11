import * as THREE from 'three';
import {boidNum} from './boids.js'
import {zeroOut, updateInstance, initBoids, updateMat, inBounds, limitSpeed, buildGrid} from './boids.js'
import {collect, cohesion, alignment, separation} from './boids.js'

// const clock = new THREE.Timer();

// fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
// npx vite

let scene, camera, renderer

let FOV, height, width

let cube

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

    initBoids(scene, camera);
    animate();

    let test = "hello world! my name is blah blah and today i'll be doing pblah blah again\n hello again its me :D";
    typeWriter(test, "textBox", 50, false);
}

// -----------------------------------------------
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


function animate() {
    buildGrid();

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

init();