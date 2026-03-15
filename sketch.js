let device;
let iAngle = 0, iDistance = 0;
let maxR;
let buffer = "";

function setup() {
  createCanvas(windowWidth, windowHeight);
  maxR = min(width, height) * 0.9 / 2;
}

function draw() {
  background(0, 25);
  drawRadar();
  drawLine();
  drawObject();
  
  // 상태 확인용 텍스트
  fill(98, 245, 31);
  textAlign(LEFT);
  textSize(14);
  text(`Raw Data: ${buffer.substring(0, 20)}`, 20, 30); // 데이터 들어오는지 확인용
  
  if (!device || !device.opened) {
    textAlign(CENTER);
    textSize(25);
    text("⚠️ 화면 중앙을 1초간 꾹 누르세요", width/2, height/2);
  }
}

async function connectUSB() {
  try {
    device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x1A86 }] });
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    // CH340 초기화 명령 (나노를 깨우는 핵심 신호)
    const initCmds = [
      { r: 0xA1, v: 0xC292, i: 0x081B }, // Baudrate 115200
      { r: 0xA4, v: 0xFF, i: 0 },         // UART Enable
      { r: 0x5F, v: 0, i: 0 }             // Handshake
    ];

    for (let cmd of initCmds) {
      await device.controlTransferOut({
        requestType: 'vendor', recipient: 'device',
        request: cmd.r, value: cmd.v, index: cmd.i
      });
    }

    console.log("나노 신호 확인됨. 수신 시작...");
    readLoop();
  } catch (err) {
    alert("연결 실패: " + err);
  }
}

async function readLoop() {
  const decoder = new TextDecoder();
  while (device && device.opened) {
    try {
      // 나노(CH340) 데이터 통로는 보통 2번입니다. 
      // 만약 안 되면 1번으로 자동 전환 시도 로직 포함
      const result = await device.transferIn(2, 64); 
      if (result.data) {
        let text = decoder.decode(result.data);
        processData(text);
      }
    } catch (err) {
      // 에러 발생 시 1번 엔드포인트로 재시도
      try {
        const result = await device.transferIn(1, 64);
        if (result.data) processData(decoder.decode(result.data));
      } catch (e) { break; }
    }
  }
}

function processData(data) {
  buffer += data;
  // 디버깅: 버퍼가 너무 커지면 자름
  if (buffer.length > 100) buffer = buffer.substring(buffer.length - 50);

  if (buffer.includes('.')) {
    let parts = buffer.split('.');
    let last = parts[parts.length - 2];
    
    if (last) {
      let vals = last.split(',');
      if (vals.length >= 2) {
        iAngle = int(vals[0].trim());
        iDistance = int(vals[1].trim());
      }
    }
  }
}

// 그래픽 함수 (생략 없이 그대로 사용하세요)
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
function mousePressed() { if (!device || !device.opened) connectUSB(); }
