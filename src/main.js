import * as THREE from 'three';
import {boidNum, height, width} from './boids.js'
import {zeroOut, updateInstance, initBoids, updateMat, inBounds, limitSpeed, buildGrid, createBoid} from './boids.js'
import {collect, cohesion, alignment, separation} from './boids.js'

// const clock = new THREE.Timer();

// press Enter to start, fully refresh page if nothing appears since event listener is one time use
// fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
// npx vite

let scene, camera, renderer
let textMap
const numLines = 21;

const container = document.getElementById("container");
const json = "./src/text.json"
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
    test();
    animate();
}

async function prepText() {
  const response = await fetch(json);
  const data = await response.json();

  let map = new Map(
    Object.entries(data).map(([key, value]) => [
      Number(key),
      {
        text: value.text,
        num: value.num
      }
    ])
  );

  return map;
} // prepText

async function printText(test) {
  await typeWriter(test.text, "textBox", 35, false); //90?
  await reverseTypeWriter("textBox", 50);
  createBoid(width, height, test.num - boidNum, boidNum)
  await new Promise((resolve) => setTimeout(resolve, 4000));
}

async function test() {
      for (let i = 0; i < numLines; i++) {
      await printText(textMap.get(i));
    }
}

async function reverseTypeWriter(targetElement, speed) {

    let textCon = document.getElementById(targetElement).textContent;
    let target = document.getElementById(targetElement)

    for (let i = textCon.length; i > 0; i -= 3) {

        target.textContent = textCon.substring(0, i - 3);

        await new Promise(resolve => setTimeout(resolve, speed));

    }
} // reverseTypeWriter

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

    if (script) {
      textCon = document.getElementById(text).textContent;
    } else {
      textCon = text;
    }

  return new Promise(async (resolve) => {

    let i = 0;

    while (i < textCon.length) {
      let char = textCon.charAt(i);
      let temp = char;

      if (char == ']') {
        char = ','
      } else if (char == '/') {
        char = ' ';
      }

      writeText(char, targetElement);
      char = temp;

      if (char === '\n' || char === ',' || char === '?') {
        await new Promise((resolve) => setTimeout(resolve, 550)); 
      } else if (char == '/') {
        await new Promise(resolve => setTimeout(resolve, 800));
      } else if (char === '.') {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      else {
        await new Promise(resolve => setTimeout(resolve, speed));
      }

      i++;
    }

    await new Promise((resolve) => setTimeout(resolve, 1300));
    resolve();
  });
} // typeWriter

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