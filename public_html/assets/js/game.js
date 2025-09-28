/*
  Lightweight Tetris engine with 7-bag RNG, SRS-ish kicks, scoring, levels, hold/next, hard drop.
  Guest: 5 min gate. If logged in, autosave every 15s and on pause/blur.
*/

const W = 10, H = 20; // field size
const TICK_BASE = 900; // ms, level 1
const TICK_FALL = 50;  // reduce per level (clamped)
const TICK_MIN = 90;   // fastest

const COLORS = {
  fg: getComputedStyle(document.body).getPropertyValue('--lcd-dark').trim(),
  bg: getComputedStyle(document.body).getPropertyValue('--lcd-light').trim(),
};

const PIECES = {
  I:[[1,1,1,1]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1]],
  S:[[0,1,1],[1,1,0]],
  Z:[[1,1,0],[0,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]],
};
const ORDER = ['I','O','T','S','Z','J','L'];

let state = {
  grid: Array.from({length:H},()=>Array(W).fill(0)),
  bag:[],
  cur:null, // {kind, x,y,rot,shape}
  hold:null, canHold:true,
  next:[],
  score:0, lines:0, level:1,
  over:false, paused:false,
  freeDeadline: Date.now()+5*60*1000,
};

const cvs = document.getElementById('tetris');
const ctx = cvs.getContext('2d');
const nextC = document.getElementById('next').getContext('2d');
const holdC = document.getElementById('hold').getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');

let lastTick = 0; let dropInterval = TICK_BASE;
let loggedIn = false; let saving = false;

function seedBag(){
  let b = ORDER.slice();
  for(let i=b.length-1;i>0;i--){ const j=(Math.random()* (i+1))|0; [b[i],b[j]]=[b[j],b[i]]; }
  state.bag.push(...b);
}
function pieceShape(kind){ return PIECES[kind].map(r=>r.slice()); }
function spawn(){
  if(state.bag.length<7) seedBag();
  const kind = state.bag.shift();
  const shape = pieceShape(kind);
  const w = shape[0].length;
  state.cur = {kind,shape,x:((W-w)/2)|0,y:0,rot:0};
  if(collides(state.cur, state.grid)) { state.over=true; }
  drawAll();
}
function rotateCW(p){
  const n = p.shape.length, m = p.shape[0].length;
  const out = Array.from({length:m}, (_,i)=>Array(n).fill(0));
  for(let y=0;y<n;y++) for(let x=0;x<m;x++) out[x][n-1-y]=p.shape[y][x];
  return out;
}
function collides(p,grid){
  const sh=p.shape;
  for(let y=0;y<sh.length;y++) for(let x=0;x<sh[0].length;x++) if(sh[y][x]){
    const gx = p.x+x, gy=p.y+y;
    if(gx<0||gx>=W||gy>=H|| (gy>=0 && grid[gy][gx])) return true;
  }
  return false;
}
function merge(){
  const {shape,x,y} = state.cur; for(let yy=0;yy<shape.length;yy++) for(let xx=0;xx<shape[0].length;xx++) if(shape[yy][xx]){
    if(y+yy>=0) state.grid[y+yy][x+xx]=1;
  }
}
function clearLines(){
  let cleared=0; for(let y=H-1;y>=0;y--){ if(state.grid[y].every(v=>v)){ state.grid.splice(y,1); state.grid.unshift(Array(W).fill(0)); cleared++; y++; } }
  if(cleared){
    state.lines += cleared;
    const points = [0,40,100,300,1200][cleared] || 0; // NES-ish
    state.score += points * state.level;
    if(state.lines >= state.level*10){ state.level++; dropInterval = Math.max(TICK_MIN, TICK_BASE - (state.level-1)*TICK_FALL); }
    if(cleared===4) unlockAward('TETRIS');
    if(state.level===5) unlockAward('LVL5');
    if(state.level===10) unlockAward('LVL10');
  }
}
function hardDrop(){
  let moved=0; while(true){ state.cur.y++; if(collides(state.cur,state.grid)){ state.cur.y--; break; } moved++; }
  state.score += 2*moved; unlockAward('SPEED_DEEMON');
  lockPiece();
}
function lockPiece(){ merge(); clearLines(); spawn(); }

function move(dx){ state.cur.x+=dx; if(collides(state.cur,state.grid)) state.cur.x-=dx; }
function soft(){ state.cur.y++; if(collides(state.cur,state.grid)){ state.cur.y--; lockPiece(); } }
function rotate(){ const old=state.cur.shape; state.cur.shape=rotateCW(state.cur); if(collides(state.cur,state.grid)){
  state.cur.x++; if(collides(state.cur,state.grid)) { state.cur.x-=2; if(collides(state.cur,state.grid)){ state.cur.x++; state.cur.shape=old; }}
}}
function hold(){ if(!state.canHold) return; const k=state.cur.kind; if(state.hold){ const swap=state.hold; state.hold=k; state.cur={kind:swap,shape:pieceShape(swap),x:3,y:0,rot:0}; }
  else { state.hold=k; spawn(); }
  state.canHold=false; drawAll(); }

function drawAll(){
  ctx.fillStyle = COLORS.bg; ctx.fillRect(0,0,cvs.width,cvs.height);
  const cell = Math.floor(Math.min(cvs.width/W, cvs.height/H));
  const ox = Math.floor((cvs.width - cell*W)/2); const oy = Math.floor((cvs.height - cell*H)/2);
  ctx.fillStyle = COLORS.fg;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(state.grid[y][x]) ctx.fillRect(ox+x*cell, oy+y*cell, cell-1, cell-1);
  const sh=state.cur.shape; ctx.fillStyle = COLORS.fg;
  for(let y=0;y<sh.length;y++) for(let x=0;x<sh[0].length;x++) if(sh[y][x]){
    const gx=state.cur.x+x, gy=state.cur.y+y; if(gy>=0)
      ctx.fillRect(ox+gx*cell, oy+gy*cell, cell-1, cell-1);
  }
  scoreEl.textContent = state.score; levelEl.textContent = state.level; linesEl.textContent = state.lines;
  drawMini(nextC, state.bag[0] || state.next?.[0]);
  drawMini(holdC, state.hold);
}
function drawMini(c2d, kind){
  c2d.clearRect(0,0,c2d.canvas.width,c2d.canvas.height);
  if(!kind) return; const shape = pieceShape(kind);
  const cell = 12; const w=shape[0].length, h=shape.length; const ox=(c2d.canvas.width - w*cell)/2, oy=(c2d.canvas.height - h*cell)/2;
  c2d.fillStyle = COLORS.fg;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(shape[y][x]) c2d.fillRect(ox+x*cell, oy+y*cell, cell-1, cell-1);
}

function gameLoop(t){
  if(state.over){ return; }
  if(state.paused){ requestAnimationFrame(gameLoop); return; }
  if(!loggedIn && Date.now()>state.freeDeadline){ showModal('gate'); return; }
  if(!lastTick) lastTick=t;
  if(t-lastTick >= dropInterval){ lastTick=t; soft(); }
  drawAll();
  requestAnimationFrame(gameLoop);
}

function unlockAward(code){ if(!loggedIn) return; fetch('api/awards.php', {method:'POST', body: new URLSearchParams({code})}); }

function bindKeys(){
  window.addEventListener('keydown', (e)=>{
    if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key) || e.key==='Shift' || e.key==='Enter') e.preventDefault();
    if(e.key==='ArrowLeft') move(-1);
    else if(e.key==='ArrowRight') move(1);
    else if(e.key==='ArrowDown') soft();
    else if(e.key==='ArrowUp') rotate();
    else if(e.key===' ') hardDrop();
    else if(e.key==='Shift') hold();
    else if(e.key==='Enter') state.paused=!state.paused;
  });
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('touchstart', (e)=>{ e.preventDefault(); doAction(btn.dataset.action); }, {passive:false});
    btn.addEventListener('click', ()=>doAction(btn.dataset.action));
  });
}
function doAction(a){ if(a==='left') move(-1); if(a==='right') move(1); if(a==='down') soft(); if(a==='up' || a==='rotate') rotate(); if(a==='hard') hardDrop(); if(a==='hold') hold(); if(a==='pause') state.paused=!state.paused; }

function setupAuth(){
  const ui = {
    info: document.getElementById('user-info'),
    loginBtn: document.getElementById('btn-login'),
    regBtn: document.getElementById('btn-register'),
    outBtn: document.getElementById('btn-logout'),
    themeSel: document.getElementById('theme'),
  };

  function applyTheme(v){ document.body.className = `theme-${v}`; COLORS.fg=getComputedStyle(document.body).getPropertyValue('--lcd-dark').trim(); COLORS.bg=getComputedStyle(document.body).getPropertyValue('--lcd-light').trim(); drawAll(); }

  fetch('api/me.php').then(r=>r.json()).then(({user})=>{
    if(user){ loggedIn=true; ui.info.textContent = `@${user.username || user.email}`; ui.loginBtn.classList.add('hide'); ui.regBtn.classList.add('hide'); ui.outBtn.classList.remove('hide'); ui.themeSel.value=user.theme||'original'; applyTheme(ui.themeSel.value); loadServerState(); } else { applyTheme(ui.themeSel.value); }
  });

  ui.themeSel.addEventListener('change', (e)=>{ applyTheme(e.target.value); if(loggedIn){ const fd=new FormData(); fd.append('theme', e.target.value); fetch('api/update_profile.php',{method:'POST',body:fd}); }});

  document.getElementById('btn-logout').addEventListener('click', ()=>{ fetch('api/logout.php').then(()=>location.reload()); });

  document.getElementById('btn-register').addEventListener('click', ()=>showModal('register'));
  document.getElementById('swapToLogin').addEventListener('click', (e)=>{ e.preventDefault(); closeModal('register'); showModal('login'); });
  document.getElementById('registerForm').addEventListener('submit', async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target);
    const res = await fetch('api/register.php',{method:'POST', body: fd}); const j=await res.json();
    if(j.ok){ closeModal('register'); location.reload(); } else alert(j.error||'Failed');
  });

  document.getElementById('btn-login').addEventListener('click', ()=>showModal('login'));
  document.getElementById('gate-login').addEventListener('click', ()=>{ closeModal('gate'); showModal('login'); });
  document.getElementById('gate-register').addEventListener('click', ()=>{ closeModal('gate'); showModal('register'); });

  const step1 = document.getElementById('loginFormStep1');
  const step2 = document.getElementById('loginFormStep2');
  step1.addEventListener('submit', async (e)=>{
    e.preventDefault(); const data=new FormData(step1); const res=await fetch('api/send_login_code.php',{method:'POST', body:data}); const j=await res.json(); if(j.ok){ step2.classList.remove('hide'); step1.classList.add('hide'); step2.elements.email.value = step1.elements.email.value; } else alert(j.error||'Failed'); });
  step2.addEventListener('submit', async (e)=>{
    e.preventDefault(); const data=new FormData(step2); const res=await fetch('api/verify_login_code.php',{method:'POST', body:data}); const j=await res.json(); if(j.ok){ closeModal('login'); location.reload(); } else alert(j.error||'Failed'); });
}

function showModal(id){ document.getElementById(id).classList.remove('hide'); }
function closeModal(id){ document.getElementById(id).classList.add('hide'); }
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{
  b.closest('.modal').classList.add('hide');
}));

function saveServerState(){ if(!loggedIn || saving) return; saving=true; const payload = compressState(); fetch('api/save_state.php',{method:'POST', body: new URLSearchParams({state_json: JSON.stringify(payload)})}).finally(()=>saving=false); }
function loadServerState(){ fetch('api/load_state.php').then(r=>r.json()).then(({state:st})=>{ if(!st) return; restoreState(st); }); }

function compressState(){
  return {
    grid: state.grid,
    cur: {kind:state.cur.kind,x:state.cur.x,y:state.cur.y,shape:state.cur.shape},
    hold: state.hold, bag: state.bag,
    score: state.score, lines: state.lines, level: state.level
  };
}
function restoreState(s){
  state.grid = s.grid; state.cur = s.cur; state.hold=s.hold; state.bag=s.bag; state.score=s.score; state.lines=s.lines; state.level=s.level; dropInterval = Math.max(TICK_MIN, TICK_BASE - (state.level-1)*TICK_FALL); drawAll(); }

window.addEventListener('blur', ()=>{ state.paused=true; saveServerState(); });
setInterval(saveServerState, 15000);

function init(){
  function fit(){ const wrap=document.querySelector('.gb-screen-wrap'); const rect=wrap.getBoundingClientRect(); cvs.width = Math.floor(rect.width); cvs.height = Math.floor(rect.height); drawAll(); if(window.initGBScreenEffect) initGBScreenEffect(); }
  window.addEventListener('resize', fit); fit();
  seedBag(); spawn(); bindKeys(); setupAuth(); requestAnimationFrame(gameLoop);
}

init();
