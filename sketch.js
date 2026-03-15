let device;
let iAngle = 0, iDistance = 0;
let maxR;

function setup() {
  createCanvas(windowWidth, windowHeight);
  maxR = min(width, height) * 0.9 / 2;
}

function draw() {
  background(0, 20);
  
  // 레이더 그리기 로직 (연결 전에도 보임)
  drawRadar();
  drawLine();
  drawObject();
  
  // 상태 표시
  fill(98, 245, 31);
  textAlign(CENTER);
  if (!device || !device.opened) {
    textSize(25);
    text("⚠️ 화면 중앙을 '꾹' 누르세요", width/2, height/2);
  } else {
    textSize(20);
    text(`각도: ${iAngle}° | 거리: ${iDistance}cm`, width/2, height * 0.95);
  }
}

// [가장 중요] 클릭 이벤트 내부에서 직접 호출
function mousePressed() {
  if (!device || !device.opened) {
    // 1. 그 어떤 조건문도 거치지 않고 바로 실행
    navigator.usb.requestDevice({
      filters: [{ vendorId: 0x1A86 }] 
    })
    .then(selectedDevice => {
      device = selectedDevice;
      return connectToDevice();
    })
    .catch(err => {
      console.error(err);
      if(err.name === 'SecurityError') alert("터치가 너무 짧거나 부정확했습니다. 다시 꾹 눌러주세요.");
    });
  }
}

async function connectToDevice() {
  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);
  await device.claimInterface(0);
  
  // CH340 보드레이트 설정 (115200)
  await device.controlTransferOut({
    requestType: 'vendor', recipient: 'device',
    request: 0xA1, value: 0xC292, index: 0x081B
  });
  
  readLoop();
}

async function readLoop() {
  const decoder = new TextDecoder();
  while (device && device.opened) {
    const result = await device.transferIn(2, 64);
    if (result.data) {
      processData(decoder.decode(result.data));
    }
  }
}

let buffer = "";
function processData(data) {
  buffer += data;
  if (buffer.includes('.')) {
    let parts = buffer.split('.');
    let last = parts[parts.length - 2];
    buffer = parts[parts.length - 1];
    let vals = last.split(',');
    if (vals.length >= 2) {
      iAngle = int(vals[0]);
      iDistance = int(vals[1]);
    }
  }
}

// 그래픽 함수들
function drawRadar() {
  push(); translate(width/2, height * 0.85);
  noFill(); strokeWeight(2); stroke(98, 245, 31, 150);
  for(let i=1; i<=4; i++) { let d = (maxR * 2) * (i/4); arc(0, 0, d, d, PI, TWO_PI); }
  pop();
}
function drawLine() {
  push(); translate(width/2, height * 0.85);
  strokeWeight(6); stroke(30, 250, 60);
  line(0, 0, maxR * cos(radians(iAngle)), -maxR * sin(radians(iAngle)));
  pop();
}
function drawObject() {
  if (iDistance > 40 || iDistance <= 0) return;
  push(); translate(width/2, height * 0.85);
  strokeWeight(10); stroke(255, 10, 10);
  let d = map(iDistance, 0, 40, 0, maxR);
  line(d * cos(radians(iAngle)), -d * sin(radians(iAngle)), maxR * cos(radians(iAngle)), -maxR * sin(radians(iAngle)));
  pop();
}
