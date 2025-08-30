// ======= Parameters =======
// 束の数（= 1フレームでの stepSystem 呼び出し回数の目安）
const CLUSTERS = 5;
// 束の見た目サイズ（小さいほどコンパクト）
const SCALE_MIN = 0.68;
const SCALE_MAX = 0.88;
// 画面端の余白
const MARGIN_X_RATIO = 0.10;   // 左右
const TOP_GUARD_PX   = 120;    // 上（ロゴ避け）
const BOTTOM_GUARD_PX= 60;     // 下（フッター避け）
// スマホでも横にばらけるよう X/Y の独立最小距離
const MIN_DIST_X_RATIO = 0.25; // 画面幅に対する最小横距離
const MIN_DIST_Y_RATIO = 0.22; // 画面高に対する最小縦距離
// 個体数（Mover/Force それぞれ）
const N_TOTAL = 2000;
// 色（参考画像系）
const PALETTE = [
  [ 172,97,38, 10],   // teal
  [ 226,174,52, 10],   // blue
  [172, 97,38, 10],   // purple
  [ 226,174,52, 10],   // blue
];
// 形の違いを強調するためのノイズ歪み
const NOISE_SCALE = 0.0045; // サンプルの細かさ
const MORPH_AMP   = 90;     // 歪みの強さ（px）
const ROT_MIN     = -0.25;  // 回転の幅（rad）
const ROT_MAX     =  0.25;

// --- mobile tuning ---
const MOBILE_BP = 640;              // ここ未満をスマホ扱い
const MOBILE_SCALE_BOOST = 1.22;    // スマホ時のサイズ倍率
const MOBILE_MARGIN_X_RATIO = 0.06; // 左右余白を狭く
const MOBILE_MIN_DIST_X_RATIO = 0.18; // クラスター間 最小距離(横)
const MOBILE_MIN_DIST_Y_RATIO = 0.18; // クラスター間 最小距離(縦)
const MOBILE_MAX_CLUSTERS = 3;        // スマホ時は束の数を抑える

let framesToDraw = 400;   // 描画する残りフレーム数


// ======= Globals =======
let m = [], f = [];
let timex = 0.0, timey = 1000.0;
let centers = [];               // {x,y,scale,col,rot,ox,oy,amp}
let callIndex = 0;
let lastUpdatedFrame = -1;

function setup(){
  const c = createCanvas(windowWidth, windowHeight);
  frameRate(240);
  c.position(0,0);
  c.style('z-index','-1');
  background(255);
  noStroke();
  resetSketch();
  pixelDensity(1);  // 高DPR端末でのメモリ節約（任意だが推奨）

}

function draw(){
  // 1フレームで全クラスター分描画（呼ぶたびに形と位置が変わる）
  for (let i = 0; i < centers.length; i++) stepSystem(m, f);
  if (--framesToDraw <= 0) noLoop();
  
  console.log(frameCount)
}

function resumeRender(n = 200){   // 復帰後にnフレームだけ描き直す
  framesToDraw = n;
  loop();
}

// バックグラウンド→フォアグラウンド
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) resumeRender(400);
});

// iOS Safari の bfcache 復帰にも対応
window.addEventListener('pageshow', (e) => {
  if (e.persisted) resumeRender(400);
});


function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  resetCenters(); // サイズ変更に応じて再配置
  resumeRender(400); 
}

function mousePressed(){ resetCenters(); }

// ======= 呼ぶたびに位置・形を変える本体 =======
function stepSystem(movers, forces){
  // 物理更新はフレームあたり1回（速度暴走を防ぐ）
  if(lastUpdatedFrame !== frameCount){
    updateSystem(movers, forces);
    lastUpdatedFrame = frameCount;
    callIndex = 0;
  }
  const c = centers[callIndex % centers.length];
  renderSystemAt(movers, forces, c);
  callIndex++;
}

// 位置更新のみ（描画なし）
function updateSystem(movers, forces){
  for(let i=0;i<movers.length;i++){
    const force1 = forces[i].attract(movers[i]);
    movers[i].applyForce(force1);
    movers[i].update();
    movers[i].check();
  }
  for(let j=0;j<forces.length;j++){
    const force2 = movers[j].attract(forces[j]);
    forces[j].applyForce(force2);
    forces[j].update();
    forces[j].check();
  }
}

// ---- 描画：各クラスター固有の中心/回転/ノイズ歪みで“別の形”に見せる ----
function renderSystemAt(movers, forces, c){
  push();
  translate(c.x, c.y);
  rotate(c.rot);
  scale(c.scale);
  translate(-width/2, -height/2);
  fill(c.col);

  // ノイズ歪み：各クラスターの (ox,oy) をシードに使う
  for(let i=0;i<movers.length;i++){
    const p = movers[i].loc;
    const nx = noise(c.ox + p.x*NOISE_SCALE, c.oy + p.y*NOISE_SCALE);
    const ny = noise(c.oy + p.y*NOISE_SCALE, c.ox + p.x*NOISE_SCALE);
    const dx = (nx - 0.5) * 2 * c.amp; // -amp .. +amp
    const dy = (ny - 0.5) * 2 * c.amp;
    ellipse(p.x + dx, p.y + dy, movers[i].mass*10, movers[i].mass*10);
  }
  for(let j=0;j<forces.length;j++){
    const p = forces[j].loc;
    const nx = noise(c.ox + 1000 + p.x*NOISE_SCALE, c.oy + p.y*NOISE_SCALE);
    const ny = noise(c.oy + 1000 + p.y*NOISE_SCALE, c.ox + p.x*NOISE_SCALE);
    const dx = (nx - 0.5) * 2 * c.amp;
    const dy = (ny - 0.5) * 2 * c.amp;
    ellipse(p.x + dx, p.y + dy, forces[j].mass*10, forces[j].mass*10);
  }
  pop();
}

// ======= 初期化 =======
function resetSketch(){
  background(255);
  noStroke();

  m = new Array(N_TOTAL);
  f = new Array(N_TOTAL);

  // 物理座標は全画面にばら撒き（描画で縮小・移動・歪み）
  for(let i=0;i<N_TOTAL;i++){
    m[i] = new Mover(
      0.1,
      map(noise(timex),0,1,0,width),
      map(noise(timey),0,1,0,height)
    );
    timex += 0.01; timey += 0.01;
  }
  for(let j=0;j<N_TOTAL;j++){
    f[j] = new Force(
      0.1,
      map(noise(timey),0,1,0,width),
      map(noise(timex),0,1,0,height)
    );
    timex += 0.01; timey += 0.01;
  }

  resetCenters();
}

// クラスター中心・形パラメータを再生成（モバイル調整込み）
function resetCenters(){
  centers = [];

  const isMobile = width <= MOBILE_BP;

  // 余白と最小距離（スマホ時は“詰め方”を緩め、大きく描く）
  const marginL = width * (isMobile ? MOBILE_MARGIN_X_RATIO : MARGIN_X_RATIO);
  const marginR = width - marginL;
  const minY    = TOP_GUARD_PX;
  const maxY    = height - BOTTOM_GUARD_PX;

  const minDX = width  * (isMobile ? MOBILE_MIN_DIST_X_RATIO : MIN_DIST_X_RATIO);
  const minDY = height * (isMobile ? MOBILE_MIN_DIST_Y_RATIO : MIN_DIST_Y_RATIO);

  // スケール（スマホ時は拡大）
  const baseMin = SCALE_MIN * (isMobile ? MOBILE_SCALE_BOOST : 1.0);
  const baseMax = SCALE_MAX * (isMobile ? MOBILE_SCALE_BOOST : 1.0);

  // デスクトップのみ、幅に応じて微調整
  const sizeBias = isMobile
    ? 1.0
    : constrain(map(width, 360, 1440, 0.85, 1.0), 0.7, 1.0);

  const targetClusters = isMobile ? Math.min(CLUSTERS, MOBILE_MAX_CLUSTERS) : CLUSTERS;

  let tries = 0;
  while(centers.length < targetClusters && tries < 4000){
    const cx = random(marginL, marginR);
    const cy = random(minY, maxY);

    // X/Y それぞれの最小距離を満たすか（片方満たせばOKにして詰まりを防止）
    const ok = centers.every(p => (abs(cx - p.x) >= minDX) || (abs(cy - p.y) >= minDY));
    if(ok){
      const idx = centers.length % PALETTE.length;
      centers.push({
        x: cx,
        y: cy,
        scale: random(baseMin, baseMax) * sizeBias,
        col: color(...PALETTE[idx]),
        rot: random(ROT_MIN, ROT_MAX),
        ox: random(1000),        // ノイズのオフセットX
        oy: random(1000),        // ノイズのオフセットY
        amp: MORPH_AMP * random(0.8, 1.25) // 歪み量
      });
    }
    tries++;
  }

  callIndex = 0;
}

// ======= Classes =======
class Force{
  constructor(m,x,y){
    this.loc = createVector(x,y);
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
    this.mass = m;
    this.G = 1;
  }
  attract(mover){
    const force = p5.Vector.sub(this.loc, mover.loc);
    let d = force.mag();
    d = constrain(d,5,10);
    const s = this.G * ((this.mass * mover.mass) / (d*d));
    force.normalize(); force.mult(s);
    return force;
  }
  applyForce(force){
    const f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }
  update(){ this.vel.add(this.acc); this.loc.add(this.vel); this.acc.mult(0); }
  display(){ ellipse(this.loc.x, this.loc.y, this.mass*10, this.mass*10); }
  check(){
    if(this.loc.x > width){ this.loc.x = width; this.vel.x *= -0.1; }
    else if(this.loc.x < 0){ this.loc.x = 0; this.vel.x *= -0.1; }
    if(this.loc.y > height){ this.loc.y = height; this.vel.y *= -0.1; }
    else if(this.loc.y < 0){ this.loc.y = 0; this.vel.y *= -0.1; }
  }
}

class Mover{
  constructor(m,x,y){
    this.loc = createVector(x,y);
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
    this.mass = m;
    this.G = 1;
  }
  attract(forceObj){
    const force = p5.Vector.sub(this.loc, forceObj.loc);
    let d = force.mag();
    d = constrain(d,5,10);
    const s = this.G * ((this.mass * forceObj.mass) / (d*d));
    force.normalize(); force.mult(s);
    return force;
  }
  applyForce(force){
    const f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }
  update(){ this.vel.add(this.acc); this.loc.add(this.vel); this.acc.mult(0); }
  display(){ ellipse(this.loc.x, this.loc.y, this.mass*10, this.mass*10); }
  check(){
    if(this.loc.x > width){ this.loc.x = width; this.vel.x *= -0.1; }
    else if(this.loc.x < 0){ this.loc.x = 0; this.vel.x *= -0.1; }
    if(this.loc.y > height){ this.loc.y = height; this.vel.y *= -0.1; }
    else if(this.loc.y < 0){ this.loc.y = 0; this.vel.y *= -0.1; }
  }
}
