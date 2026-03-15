let port;
let iAngle = 0, iDistance = 0;
let noObject = "";

function setup() {
  // 화면 크기에 맞게 캔버스 생성
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container');

  port = createSerial();

  // 이전에 연결된 적이 있다면 자동 오픈
  let usedPorts = port.getPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 115200);
  }
}

function draw() {
  if (port.available() > 0) {
    let str = port.readUntil('.'); 
    if (str) {
      let data = str.replace('.', '');
      let parts = split(data, ',');
      if (parts.length >= 2) {
        iAngle = int(parts[0]);
        iDistance = int(parts[1]);
      }
    }
  }

  background(0, 20); 
  drawRadar();
  drawLine();
  drawObject();
  drawText();
}

function drawRadar() {
  push();
  translate(width/2, height * 0.8);
  noFill();
  strokeWeight(2);
  stroke(98, 245, 31, 150);
  
  let r = min(width, height) * 0.8;
  for (let i = 1; i <= 4; i++) {
    let d = (r / 4) * i;
    arc(0, 0, d, d, PI, TWO_PI);
  }
  
  for (let a = 30; a <= 150; a += 30) {
    line(0, 0, -(r/2) * cos(radians(a)), -(r/2) * sin(radians(a)));
  }
  line(-width/2, 0, width/2, 0);
  pop();
}

function drawObject() {
  push();
  translate(width/2, height * 0.8);
  let r = min(width, height) * 0.8;
  let maxR = r / 2;
  let pixsDistance = map(iDistance, 0, 40, 0, maxR);
  
  if (iDistance < 40) {
    strokeWeight(8);
    stroke(255, 10, 10);
    line(pixsDistance * cos(radians(iAngle)), -pixsDistance * sin(radians(iAngle)), 
         maxR * cos(radians(iAngle)), -maxR * sin(radians(iAngle)));
  }
  pop();
}

function drawLine() {
  push();
  translate(width/2, height * 0.8);
  strokeWeight(5);
  stroke(30, 250, 60);
  let r = (min(width, height) * 0.8) / 2;
  line(0, 0, r * cos(radians(iAngle)), -r * sin(radians(iAngle)));
  pop();
}

function drawText() {
  noObject = (iDistance > 40) ? "OUT" : "IN";
  fill(98, 245, 31);
  noStroke();
  textAlign(CENTER);
  textSize(width * 0.03);
  text(`ANG: ${iAngle}° | DIST: ${iDistance}cm | OBJ: ${noObject}`, width/2, height * 0.92);
  
  if (!port.opened()) {
    fill(255, 200, 0);
    text("TAP TO CONNECT ARDUINO", width/2, height/2);
  }
}

function mousePressed() {
  if (!port.opened()) {
    port.open(115200);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
