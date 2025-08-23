let x,y;
let thetaX = 0;
let thetaY = 100;
let noiseX,noiseY
function setup() {
  const c = createCanvas(windowWidth, windowHeight, WEBGL);
  c.position(0, 0);           // 画面左上に配置
  c.style('display', 'block'); // 余白防止
  c.style('z-index', '-1');    // 背景に回す（必要なら）
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

function draw() {
  background(255);
  
  
  randomSeed(5);
  noiseX = 0;
  noiseY = 1000;
  if(windowWidth > windowHeight){
    widthScale();
  }
  else if(windowWidth < windowHeight){
    heightScale();
  }
  thetaX += 0.005
  thetaY += 0.005;
}

function windowResized(){
  resizeCanvas(windowWidth,windowHeight);
}

function widthScale(){
  stroke(0);
  fill(0);
  ellipse(0,0,height/20,height/20);
  noFill();
 
  for(let i = 0;i < 8;i++){
    let noiseRotateX = map(noise(noiseX),0,1,0.1,0.5);
    let nosieRotateY = map(noise(noiseY),0,1,0.1,0.5);
    rotateX(thetaX + noiseRotateX);
    rotateY(thetaY + nosieRotateY);
    ellipse(0,0,(height/20)*(i*(random(1,1.8))),(height/20)*(i*(random(1,1.8))));
    noiseX += 0.005;
    noiseY += 0.005;
  }
}

function heightScale(){
  stroke(0);
  fill(0);
  ellipse(0,0,width/20,width/20);
  noFill();
 
  for(let i = 0;i < 8;i++){
    let noiseRotateX = map(noise(noiseX),0,1,0.1,0.5);
    let nosieRotateY = map(noise(noiseY),0,1,0.1,0.5);
    rotateX(thetaX + noiseRotateX);
    rotateY(thetaY + nosieRotateY);
    ellipse(0,0,(width/20)*(i*(random(1,1.8))),(width/20)*(i*(random(1,1.8))));
    noiseX += 0.005;
    noiseY += 0.005;
  }
}