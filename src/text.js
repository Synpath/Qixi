const json = "./src/text.json"
const regularPause = 550;
const forwardPause = 800;
const periodPause = 400;
const endText = 1300;

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
export function typeWriter(text, targetElement, speed) {

  return new Promise(async (resolve) => {

    let i = 0;

    while (i < text.length) {
      let char = text.charAt(i);
      let temp = char;

      // switch to actual char for printing purposes
      if (char == ']') {
        char = ','
      } else if (char == '/') {
        char = ' ';
      }

      writeText(char, targetElement);
      char = temp; //switch back to implement pausing

      if (char === '\n' || char === ',' || char === '?') {
        await new Promise((resolve) => setTimeout(resolve, regularPause)); 
      } else if (char == '/') {
        await new Promise(resolve => setTimeout(resolve, forwardPause));
      } else if (char === '.') {
        await new Promise((resolve) => setTimeout(resolve, periodPause));
      }
      else {
        await new Promise(resolve => setTimeout(resolve, speed));
      }

      i++;
    }

    await new Promise((resolve) => setTimeout(resolve, endText));
    resolve();
  });
} // typeWriter

export async function reverseType(targetElement, speed) {

    let textCon = document.getElementById(targetElement).textContent;
    let target = document.getElementById(targetElement)

    for (let i = textCon.length; i > 0; i -= 3) {

        target.textContent = textCon.substring(0, i - 3);

        await new Promise(resolve => setTimeout(resolve, speed));

    }
} // reverseType

export async function prepText() {
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