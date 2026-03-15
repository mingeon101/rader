let device;
let iAngle = 0, iDistance = 0;
let maxR;
let buffer = "";

function setup() {
  createCanvas(windowWidth, windowHeight);
  maxR = min(width, height) * 0.9 / 2;
}

function draw() {
  background(0, 20);
  drawRadar();
  drawLine();
  drawObject();
  
  fill(98, 245, 31);
  textAlign(CENTER);
  if (!device || !device.opened) {
    textSize(25);
    text("⚠️ 화면을 꾹 눌러 연결하세요", width/2, height/2);
  } else {
    textSize(20);
    text(`각도: ${iAngle}° | 거리: ${iDistance}cm`, width/2, height * 0.95);
  }
}

async function connectUSB() {
  try {
    device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x1A86 }] 
    });

    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);
    await device.claimInterface(0);

    // [핵심] CH340 나노를 깨우는 3단계 초기화 명령
    // 1. 보드레이트 설정 (115200)
    await device.controlTransferOut({
      requestType: 'vendor', recipient: 'device',
      request: 0xA1, value: 0xC292, index: 0x081B
    });
    // 2. 제어 라인 설정
    await device.controlTransferOut({
      requestType: 'vendor', recipient: 'device',
      request: 0xA4, value: 0xFF, index: 0
    });
    // 3. 데이터 전송 활성화 (이게 없으면 데이터가 안 옵니다)
    await device.controlTransferOut({
      requestType: 'vendor', recipient: 'device',
      request: 0x5F, value: 0, index: 0
    });

    console.log("나노 통신 시작!");
    readLoop();
  } catch (err) {
    alert("연결 에러: " + err);
  }
}

async function readLoop() {
  const decoder = new TextDecoder();
  while (device && device.opened) {
    try {
      // 나노(CH340)의 벌크 입력 엔드포인트는 보통 2번입니다.
      const result = await device.transferIn(2, 64);
      if (result.data) {
        let text = decoder.decode(result.data);
        processData(text);
      }
    } catch (err) {
      console.error("읽기 루프 종료:", err);
      break;
    }
  }
}

function processData(data) {
  buffer += data;
  if (buffer.includes('.')) {
    let parts = buffer.split('.');
    let last = parts[parts.length - 2];
    buffer = parts[parts.length - 1];
    
    let vals = last.split(',');
    if (vals.length >= 2) {
      iAngle = int(vals[0].trim());
      iDistance = int(vals[1].trim());
    }
  }
}

// 그래픽 함수들 (기존과 동일)
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

function mousePressed() {
  if (!device || !device.opened) connectUSB();
}
