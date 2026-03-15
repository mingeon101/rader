let device;
let iAngle = 0;
let iDistance = 0;
let port; // WebUSB 장치 저장용

// 레이더 UI용 변수
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
// WebUSB 통신 로직 (CH340 전용)
// -------------------------------------------------------------------
async function connectUSB() {
  try {
    // 1. 장치 요청 (CH340 Vendor ID: 0x1A86)
    device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x1A86 }]
    });

    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    // 2. CH340 초기화 (나노 통신을 위한 필수 제어 명령)
    // 보드레이트 115200 설정 등 (링크하신 레포지토리의 핵심 로직 반영)
    await device.controlTransferOut({
      requestType: 'vendor', recipient: 'device',
      request: 0xA1, value: 0xC292, index: 0x081B
    });

    console.log("CH340 나노 연결 완료!");
    readLoop(); // 데이터 읽기 시작
  } catch (err) {
    console.error(err);
    alert("연결 실패: " + err);
  }
}

async function readLoop() {
  const decoder = new TextDecoder();
  while (device && device.opened) {
    try {
      // 2번 엔드포인트에서 64바이트 읽기
      const result = await device.transferIn(2, 64);
      if (result.data) {
        let text = decoder.decode(result.data);
        processData(text);
      }
    } catch (err) {
      console.log("연결 종료");
      break;
    }
  }
}

let buffer = "";
function processData(text) {
  buffer += text;
  if (buffer.includes('.')) {
    let lines = buffer.split('.');
    let lastData = lines[lines.length - 2]; 
    buffer = lines[lines.length - 1];

    let parts = lastData.split(',');
    if (parts.length >= 2) {
      iAngle = int(parts[0]);
      iDistance = int(parts[1]);
    }
  }
}

// -------------------------------------------------------------------
// 레이더 그래픽 함수
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
  text(`ANGLE: ${iAngle}° | DISTANCE: ${iDistance}cm`, width/2, height * 0.95);
  
  if (!device || !device.opened) {
    fill(255, 165, 0);
    text("TAP TO CONNECT NANO (WebUSB)", width/2, height/2);
  }
}

function mousePressed() {
  if (!device || !device.opened) {
    connectUSB();
  }
}
