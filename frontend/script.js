// ---- tabs ----
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+btn.dataset.view).classList.add('active');
  });
});

// ---- live monitor simulation ----
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const scoreReadout = document.getElementById('scoreReadout');
const statusPill = document.getElementById('statusPill');
const alertBox = document.getElementById('alertBox');
const log = document.getElementById('log');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');

const W = canvas.width, H = canvas.height;
let history = [];
let timer = null;
let step = 0;

// DEMO DATA — replace this array with real, live scores from your model.
// Each number is "% likelihood synthetic" for one rolling audio window.
const script = [2,3,2,4,3,2,3,5,4,3,2,3,4,5,4, 14,26,41,55,68,79,86,88,90,89,91];

// DEMO DATA — replace with real transcript/events from your pipeline.
// Keys are indexes into `script` above; each fires when playback reaches that step.
const transcriptScript = {
  0:{t:'system',msg:'Call connected. Analyzing incoming audio…'},
  2:{t:'caller',msg:'"Hello, this is calling from your bank\'s verification team."'},
  7:{t:'caller',msg:'"We just need to confirm your registered mobile number."'},
  14:{t:'system',msg:'Voice pattern shift detected — re-scoring window.'},
  16:{t:'flag',msg:'⚠ Heads up: synthetic-speech indicators rising.'},
  19:{t:'flag',msg:'⚠ Strong warning: high-confidence synthetic speech.'},
  21:{t:'caller',msg:'"Please share the OTP you just received to verify."'},
  22:{t:'flag',msg:'Action triggered: do not share OTP, verify via callback.'}
};

function addLog(kind, msg, t){
  const el = document.createElement('div');
  el.className = 'log-entry ' + (kind==='flag'?'flag':kind==='system'?'system':'');
  el.innerHTML = '<span class="log-time">'+ String(Math.floor(t*0.4)).padStart(2,'0') +'s</span>' + msg;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

function drawChart(){
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  [0.25,0.5,0.75].forEach(f=>{
    ctx.beginPath(); ctx.moveTo(0,H*f); ctx.lineTo(W,H*f); ctx.stroke();
  });

  function yFor(pct){ return H - (pct/100)*H; }
  ctx.setLineDash([4,4]);
  ctx.strokeStyle = 'rgba(224,166,60,0.5)';
  ctx.beginPath(); ctx.moveTo(0,yFor(40)); ctx.lineTo(W,yFor(40)); ctx.stroke();
  ctx.strokeStyle = 'rgba(196,67,46,0.55)';
  ctx.beginPath(); ctx.moveTo(0,yFor(75)); ctx.lineTo(W,yFor(75)); ctx.stroke();
  ctx.setLineDash([]);

  if(history.length < 2) return;
  const stepX = W / (script.length-1);
  ctx.beginPath();
  history.forEach((v,i)=>{
    const x = i*stepX;
    const y = yFor(v);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle = '#5C8AC7';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  const last = history[history.length-1];
  const lx = (history.length-1)*stepX, ly = yFor(last);
  ctx.beginPath();
  ctx.arc(lx,ly,4.5,0,Math.PI*2);
  ctx.fillStyle = last>=75 ? '#C4432E' : last>=40 ? '#E0A63C' : '#4FB286';
  ctx.fill();
}

function tick(){
  if(step >= script.length){ clearInterval(timer); playBtn.disabled=false; playBtn.textContent='Play sample call ▷'; return; }
  const val = script[step];
  history.push(val);
  scoreReadout.innerHTML = val + '<small>% synthetic</small>';

  statusPill.className = 'status-pill ' + (val>=75?'danger':val>=40?'warn':'safe');
  statusPill.textContent = val>=75 ? 'Likely cloned voice' : val>=40 ? 'Uncertain — monitoring' : 'Genuine speech';

  alertBox.className = 'alert-box ' + (val>=75?'danger':val>=40?'warn':'');
  if(val>=75){
    alertBox.innerHTML = '<span class="action-label">Recommended action</span>Do not proceed with OTP/PIN verification. End the call and call back on the number saved in your contacts.';
  } else if(val>=40){
    alertBox.innerHTML = '<span class="action-label">Recommended action</span>Ask a question only the real caller would know before continuing.';
  } else {
    alertBox.innerHTML = '<span class="action-label">Recommended action</span>No action needed — voice pattern is consistent with genuine human speech.';
  }

  if(transcriptScript[step]){
    addLog(transcriptScript[step].t, transcriptScript[step].msg, step);
  }

  drawChart();
  step++;
}

playBtn.addEventListener('click', ()=>{
  playBtn.disabled = true;
  playBtn.textContent = 'Playing…';
  timer = setInterval(tick, 380);
});

resetBtn.addEventListener('click', ()=>{
  clearInterval(timer);
  history = []; step = 0;
  scoreReadout.innerHTML = '0<small>% synthetic</small>';
  statusPill.className = 'status-pill safe';
  statusPill.textContent = 'Genuine speech';
  alertBox.className = 'alert-box';
  alertBox.innerHTML = '<span class="action-label">Recommended action</span>No action needed — voice pattern is consistent with genuine human speech.';
  log.innerHTML = '<div class="log-entry system"><span class="log-time">00:00</span>Waiting for call audio…</div>';
  playBtn.disabled = false;
  playBtn.textContent = 'Play sample call ▷';
  drawChart();
});

drawChart();
