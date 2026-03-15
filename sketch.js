let port;
let iAngle = 0;
let iDistance = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 1.1.1 버전 시리얼 객체 생성
  port = createSerial();

function draw() {
  background(0, 20); // 잔상 효과

  // 데이터 읽기 로직
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

  drawRadar();
  drawLine();
  drawObject();
  drawText();
}

function drawRadar() {
  push();
  translate(width/2, height * 0.85);
  noFill();
  strokeWeight(2);
  stroke(98, 245, 31, 150);
  
  let r = min(width, height) * 0.9;
  arc(0, 0, r, r, PI, TWO_PI);
  arc(0, 0, r * 0.75, r * 0.75, PI, TWO_PI);
  arc(0, 0, r * 0.5, r * 0.5, PI, TWO_PI);
  arc(0, 0, r * 0.25, r * 0.25, PI, TWO_PI);
  
  for (let a = 30; a <= 150; a += 30) {
    line(0, 0, -(r/2) * cos(radians(a)), -(r/2) * sin(radians(a)));
  }
  line(-width/2, 0, width/2, 0);
  pop();
}

function drawObject() {
  if (iDistance > 40 || iDistance <= 0) return;
  
  push();
  translate(width/2, height * 0.85);
  strokeWeight(10);
  stroke(255, 10, 10);
  
  let maxR = (min(width, height) * 0.9) / 2;
  let pixsDistance = map(iDistance, 0, 40, 0, maxR);
  
  let x = pixsDistance * cos(radians(iAngle));
  let y = -pixsDistance * sin(radians(iAngle));
  let endX = maxR * cos(radians(iAngle));
  let endY = -maxR * sin(radians(iAngle));
  
  line(x, y, endX, endY);
  pop();
}

function drawLine() {
  push();
  translate(width/2, height * 0.85);
  strokeWeight(6);
  stroke(30, 250, 60);
  let r = (min(width, height) * 0.9) / 2;
  line(0, 0, r * cos(radians(iAngle)), -r * sin(radians(iAngle)));
  pop();
}

function drawText() {
  fill(0);
  noStroke();
  rect(0, height * 0.88, width, height * 0.12);
  
  fill(98, 245, 31);
  textAlign(CENTER);
  textSize(min(width, height) * 0.04);
  
  let statusText = `ANGLE: ${iAngle}° | DISTANCE: ${iDistance}cm`;
  text(statusText, width/2, height * 0.95);
  
  if (!port.opened()) {
    fill(255, 165, 0);
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
