let device;
let iAngle = 0;
let iDistance = 0;
let maxR;

function setup() {
  createCanvas(windowWidth, windowHeight);
  maxR = min(width, height) * 0.9 / 2;
  smooth();
}

function draw() {
  background(0, 20); // 잔상 효과
  
  drawRadar();
  drawLine();
  drawObject();
  drawText();
}

// -------------------------------------------------------------------
// [핵심] WebUSB CH340 통신 로직
// -------------------------------------------------------------------
async function connectUSB() {
  try {
    // 반드시 클릭 이벤트 직계 실행이어야 함
    device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x1A86 }] // CH340 나노의 벤더 ID
    });

    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);
    await device.claimInterface(0);

    // CH340 보드레이트(115200) 및 초기화 제어 명령 (중요!)
    await device.controlTransferOut({
      requestType: 'vendor', recipient: 'device',
      request: 0xA1, value: 0xC292, index: 0x081B
    });

    console.log("Nano Connected!");
    readLoop(); 
  } catch (err) {
    console.error("USB Error:", err);
    // 보안 에러 발생 시 사용자에게 명확히 알림
    if (err.name === 'SecurityError') {
      alert("보안 에러: 화면을 더 정확히 터치해주세요.");
    }
  }
}

async function readLoop() {
  const decoder = new TextDecoder();
  while (device && device.opened) {
    try {
      // CH340은 보통 2번 엔드포인트(In)를 사용
      const result = await device.transferIn(2, 64);
      if (result.data) {
        processRawData(decoder.decode(result.data));
      }
    } catch (err) {
      console.log("Disconnected");
      break;
    }
  }
}

let buffer = "";
function processRawData(data) {
  buffer += data;
  if (buffer.includes('.')) {
    let parts = buffer.split('.');
    let lastComplete = parts[parts.length - 2];
    buffer = parts[parts.length - 1];
    
    let vals = lastComplete.split(',');
    if (vals.length >= 2) {
      iAngle = int(vals[0]);
      iDistance = int(vals[1]);
    }
  }
}

// -------------------------------------------------------------------
// 레이더 그래픽 로직
// -------------------------------------------------------------------
function drawRadar() {
  push();
  translate(width/2, height * 0.85);
  noFill();
  strokeWeight(2);
  stroke(98, 245, 31, 150);
  
  for(let i=1; i<=4; i++) {
    let d = (maxR * 2) * (i/4);
    arc(0, 0, d, d, PI, TWO_PI);
  }
  
  for (let a = 30; a <= 150; a += 30) {
    line(0, 0, -maxR * cos(radians(a)), -maxR * sin(radians(a)));
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
  
  let pixsDistance = map(iDistance, 0, 40, 0, maxR);
  let x = pixsDistance * cos(radians(iAngle));
  let y = -pixsDistance * sin(radians(iAngle));
  line(x, y, maxR * cos(radians(iAngle)), -maxR * sin(radians(iAngle)));
  pop();
}

function drawLine() {
  push();
  translate(width/2, height * 0.85);
  strokeWeight(6);
  stroke(30, 250, 60);
  line(0, 0, maxR * cos(radians(iAngle)), -maxR * sin(radians(iAngle)));
  pop();
}

function drawText() {
  fill(0); noStroke();
  rect(0, height * 0.88, width, height * 0.12);
  fill(98, 245, 31);
  textAlign(CENTER);
  textSize(20);
  text(`각도: ${iAngle}° | 거리: ${iDistance}cm`, width/2, height * 0.95);
  
  if (!device || !device.opened) {
    fill(255, 165, 0);
    textSize(25);
    text("👇 여기를 터치하여 나노 연결", width/2, height/2);
  }
}

// [가장 중요] 사용자 클릭 이벤트
function mousePressed() {
  if (!device || !device.opened) {
    // p5.js의 mousePressed 이벤트 핸들러 내에서 즉시 호출하여
    // 브라우저의 'User Gesture' 보안 요건을 충족함
    connectUSB();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  maxR = min(width, height) * 0.9 / 2;
}
