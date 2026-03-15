let port;
let iAngle = 0;
let iDistance = 0;
let noObject = "";

function setup() {
  // 960x540 해상도로 고정 (원래 프로세싱 코드 기준)
  createCanvas(960, 540);
  
  // 시리얼 객체 생성 (라이브러리 로드 후 실행됨)
  port = createSerial();
  
  // 에러를 유발했던 getPorts() 호출을 삭제했습니다.
  // 라이브러리가 내부적으로 연결을 관리하므로 수동 체크가 필요 없습니다.
  
  smooth();
}

function draw() {
  // 모션 블러 효과 (투명한 사각형을 덧칠함)
  noStroke();
  fill(0, 15); 
  rect(0, 0, width, height);

  // 데이터 읽기 (포트가 열려 있을 때만)
  if (port && port.opened() && port.available() > 0) {
    let str = port.readUntil('.'); 
    if (str) {
      processSerialData(str);
    }
  }

  // 레이더 그리기 함수 호출
  drawRadar();
  drawLine();
  drawObject();
  drawText();
}

function processSerialData(inputData) {
  // 끝의 '.' 제거
  let data = inputData.substring(0, inputData.length - 1);
  let index1 = data.indexOf(",");
  
  if (index1 != -1) {
    let angleStr = data.substring(0, index1);
    let distanceStr = data.substring(index1 + 1);
    
    iAngle = int(angleStr);
    iDistance = int(distanceStr);
  }
}

function drawRadar() {
  push();
  translate(width/2, 500/2); 
  noFill();
  strokeWeight(2);
  stroke(98, 245, 31);
  
  // 원형 호 그리기
  arc(0, 0, 900, 900, PI, TWO_PI);
  arc(0, 0, 700, 700, PI, TWO_PI);
  arc(0, 0, 500, 500, PI, TWO_PI);
  arc(0, 0, 300, 300, PI, TWO_PI);
  
  // 각도 가이드 라인
  for (let a = 30; a <= 150; a += 30) {
    line(0, 0, -480 * cos(radians(a)), -480 * sin(radians(a)));
  }
  line(-width/2, 0, width/2, 0);
  pop();
}

function drawObject() {
  push();
  translate(width/2, 500/2);
  strokeWeight(9);
  stroke(255, 10, 10); // 물체 감지 시 빨간색
  
  let pixsDistance = iDistance * 22.5 / 2;
  
  if (iDistance < 40) {
    line(pixsDistance * cos(radians(iAngle)), -pixsDistance * sin(radians(iAngle)), 
         475 * cos(radians(iAngle)), -475 * sin(radians(iAngle)));
  }
  pop();
}

function drawLine() {
  push();
  translate(width/2, 500/2);
  strokeWeight(9);
  stroke(30, 250, 60); // 스캔 빔 초록색
  line(0, 0, 475 * cos(radians(iAngle)), -475 * sin(radians(iAngle)));
  pop();
}

function drawText() {
  push();
  noObject = (iDistance > 40) ? "Out of Range" : "In Range";
  
  // 하단 텍스트 영역 배경
  fill(0);
  noStroke();
  rect(0, 500/2 + 10, width, height);
  
  fill(98, 245, 31);
  textSize(20);
  textAlign(CENTER);
  
  // 상태 정보 표시
  text("Object: " + noObject, width * 0.2, height - 30);
  text("Angle: " + iAngle + "°", width * 0.5, height - 30);
  text("Distance: " + (iDistance < 40 ? iDistance + " cm" : ""), width * 0.8, height - 30);
  
  // 연결 안내
  if (port && !port.opened()) {
    fill(255, 165, 0);
    text("TAP TO CONNECT ARDUINO", width/2, height/2);
  }
  pop();
}

function mousePressed() {
  // 사용자가 화면을 클릭하면 시리얼 포트 열기 시도
  if (port && !port.opened()) {
    port.open(115200);
  }
}

function windowResized() {
  // 화면 크기가 바뀌면 중앙 정렬을 위해 캔버스 크기 재조정은 안함 (비율 유지)
}
