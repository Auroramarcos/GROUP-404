
/* ===========================
   CONFIG / AUDIO
   =========================== */

   const AUDIO_URL = './explotion.mp3';
   const AUDIO_POOL_SIZE = 6;
   const EXPLOSION_VOLUME = 0.08;
   
   const canvas = document.getElementById('spaceCanvas');
   const ctx = canvas.getContext('2d');
   
   let DPR = Math.max(1, window.devicePixelRatio || 1);
   let W = 0, H = 0;
   let lastTs = 0;
   
   const scoreEl = document.getElementById('score');
   const clearedEl = document.getElementById('cleared');
   const bestEl = document.getElementById('best');
   const missesEl = document.getElementById('misses');
   const restartBtn = document.getElementById('restartBtn');
   const muteBtn = document.getElementById('muteBtn');
   const planetWrap = document.getElementById('planetWrap');
   
   let score = 0;
   let cleared = 0;
   let misses = 0;
   const STORAGE_KEY = 'saveMars_bestScore';
   let bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
   bestEl.textContent = bestScore;
   
   let audioPool = [];
   let audioIndex = 0;
   let muted = false;
   
   function initAudioPool() {
     audioPool = [];
     for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
       const a = new Audio(AUDIO_URL);
       a.preload = 'auto';
       a.volume = EXPLOSION_VOLUME;
       audioPool.push(a);
     }
   }
   initAudioPool();
   
   /* unlock audio on first interaction to satisfy browsers */
   let audioUnlocked = false;
   function unlockAudio() {
     if (audioUnlocked) return;
     audioUnlocked = true;
     const a = audioPool[0];
     a.volume = 0;
     a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = EXPLOSION_VOLUME; })
       .catch(() => {});
   }
   canvas.addEventListener('pointerdown', () => unlockAudio(), { once: true });
   document.addEventListener('keydown', () => unlockAudio(), { once: true });
   
   muteBtn.addEventListener('click', () => {
     muted = !muted;
     muteBtn.textContent = muted ? '🔇' : '🔊';
   });
   
   function playExplosionSound() {
     if (muted) return;
     const a = audioPool[audioIndex];
     audioIndex = (audioIndex + 1) % audioPool.length;
     try {
       a.currentTime = 0;
       a.volume = EXPLOSION_VOLUME;
       a.play().catch(() => {});
     } catch (e) {}
   }
   
   /* canvas sizing */
   function resize() {
     DPR = Math.max(1, window.devicePixelRatio || 1);
     W = Math.floor(window.innerWidth);
     H = Math.floor(window.innerHeight);
     canvas.style.width = W + 'px';
     canvas.style.height = H + 'px';
     canvas.width = Math.floor(W * DPR);
     canvas.height = Math.floor(H * DPR);
     ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
   }
   window.addEventListener('resize', resize);
   resize();
   
   /* helpers */
   function rand(min, max) { return Math.random() * (max - min) + min; }
   function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
   function hexToRgb(hex) {
     const h = hex.replace('#', '');
     const i = parseInt(h, 16);
     return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 };
   }
   function rgba(hex, a) {
     const c = hexToRgb(hex);
     return `rgba(${c.r},${c.g},${c.b},${a})`;
   }
   
   /* visuals and particle types (shards, smoke, sparks) */
   const redPalette = ['#ff8a72', '#ff6f61', '#ff3b30', '#b22222', '#8b1b16'];
   
   class Asteroid {
     constructor() { this.reset(true); }
     reset(spawnTop = false) {
       this.size = rand(18, 38);
       this.x = rand(this.size, W - this.size);
       this.y = spawnTop ? rand(-H * 0.6, -20) : rand(-300, -20);
       this.speed = rand(0.8, 3.0);
       this.rotation = rand(0, Math.PI * 2);
       this.rotSpeed = rand(-0.01, 0.01);
       this.color = redPalette[randInt(0, redPalette.length - 1)];
       this.craters = [];
       const count = randInt(2, 5);
       for (let i = 0; i < count; i++) {
         const angle = rand(0, Math.PI * 2);
         const dist = rand(this.size * 0.15, this.size * 0.5);
         const r = rand(this.size * 0.08, this.size * 0.22);
         this.craters.push({ angle, dist, r });
       }
     }
     update(dt, speedMultiplier) {
       this.y += this.speed * dt * speedMultiplier;
       this.rotation += this.rotSpeed * dt;
     }
     draw(ctx) {
       ctx.save();
       ctx.translate(this.x, this.y);
       ctx.rotate(this.rotation);
       const g = ctx.createRadialGradient(-this.size*0.2, -this.size*0.2, this.size*0.1, 0, 0, this.size);
       g.addColorStop(0, rgba('#ffb9a8', 1));
       g.addColorStop(0.6, this.color);
       g.addColorStop(1, rgba('#2b0d0d', 1));
       ctx.fillStyle = g;
       ctx.beginPath();
       const spikes = 10;
       for (let i = 0; i <= spikes; i++) {
         const theta = (i / spikes) * Math.PI * 2;
         const radiusMod = this.size * (1 + 0.08 * Math.sin(i*3 + this.rotation*4) + 0.05 * Math.cos(i*2 + this.rotation*2));
         const x = Math.cos(theta) * radiusMod;
         const y = Math.sin(theta) * radiusMod;
         if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
       }
       ctx.closePath();
       ctx.fill();
       ctx.lineWidth = 1;
       ctx.strokeStyle = 'rgba(0,0,0,0.18)';
       ctx.stroke();
       ctx.fillStyle = 'rgba(0,0,0,0.18)';
       this.craters.forEach(c => {
         const cx = Math.cos(c.angle) * c.dist;
         const cy = Math.sin(c.angle) * c.dist;
         ctx.beginPath();
         ctx.ellipse(cx, cy, c.r, c.r * 0.7, c.angle * 0.4, 0, Math.PI * 2);
         ctx.fill();
       });
       ctx.restore();
     }
   }
   
   class Smoke { /* same as previous smoke */ 
     constructor(x, y, baseRadius, color) {
       this.x = x; this.y = y;
       this.r = rand(baseRadius * 0.6, baseRadius * 1.2);
       this.vr = rand(30, 90);
       this.life = rand(0.6, 1.4);
       this.ttl = this.life;
       this.color = color;
       this.offsetX = rand(-12, 12);
       this.offsetY = rand(-6, 6);
     }
     update(dt) { this.ttl -= dt; const t = 1 - this.ttl / this.life; this.r += this.vr * dt * (0.6 + t); this.x += this.offsetX * dt; this.y += this.offsetY * dt + 30 * dt; }
     draw(ctx) { const a = Math.max(0, this.ttl / this.life); ctx.save(); ctx.globalAlpha = 0.55 * a; ctx.beginPath(); ctx.fillStyle = rgba('#2b0d0d', 0.6 * a); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
   }
   class Shard { /* same as previous shard */
     constructor(x, y, color) {
       this.x = x; this.y = y;
       const ang = rand(0, Math.PI*2);
       const spd = rand(80, 360);
       this.vx = Math.cos(ang) * spd;
       this.vy = Math.sin(ang) * spd;
       this.size = rand(6, 18);
       this.rot = rand(0, Math.PI*2);
       this.rotSpeed = rand(-6, 6);
       this.life = rand(0.5, 1.4);
       this.ttl = this.life;
       this.color = color;
     }
     update(dt) { this.ttl -= dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 180 * dt; this.rot += this.rotSpeed * dt; }
     draw(ctx) { const a = Math.max(0, this.ttl / this.life); ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.globalAlpha = a; ctx.beginPath(); ctx.fillStyle = this.color; ctx.moveTo(-this.size*0.6, -this.size*0.3); ctx.lineTo(this.size*0.8, 0); ctx.lineTo(-this.size*0.6, this.size*0.3); ctx.closePath(); ctx.fill(); ctx.restore(); }
   }
   class Spark { constructor(x,y,color){ this.x=x; this.y=y; const ang = rand(0, Math.PI*2); const spd = rand(120, 520); this.vx=Math.cos(ang)*spd; this.vy=Math.sin(ang)*spd; this.radius=rand(0.8,2.8); this.life=rand(0.28,0.9); this.ttl=this.life; this.color=color; } update(dt){ this.ttl-=dt; this.x+=this.vx*dt; this.y+=this.vy*dt; this.vy+=400*dt; } draw(ctx){ const a=Math.max(0,this.ttl/this.life); ctx.save(); ctx.globalAlpha=a; ctx.beginPath(); ctx.fillStyle=this.color; ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
   
   /* containers */
   let asteroids = [];
   let shots = [];
   let smokeParticles = [];
   let shards = [];
   let sparks = [];
   let ripples = [];
   
   /* speed control via planet click */
   let speedMultiplier = 1;
   let planetBoostActive = false;
   let planetCooldown = false;
   const PLANET_BOOST_MULT = 1.9;
   const PLANET_BOOST_DURATION = 6000; // ms
   const PLANET_COOLDOWN = 9000; // ms after boost ends
   
   /* spawn/populate */
   function populate(){
     asteroids = []; shots = []; smokeParticles = []; shards = []; sparks = []; ripples = [];
     const count = Math.max(6, Math.floor(Math.min(40, (W * H) / 90000)));
     for (let i=0;i<count;i++) asteroids.push(new Asteroid());
     for (let i=0;i< Math.max(6, Math.floor(W/300)); i++) shots.push(new Shot());
   }
   function Shot(){ this.reset(); }
   Shot.prototype.reset = function(){ this.x = rand(-W*0.2, W); this.y = rand(-H*0.2, H*0.6); this.len = rand(6,18); this.speed = rand(150,420); this.angle = rand(-0.6,-0.2); this.life = rand(0.6,1.6); this.ttl = this.life; };
   Shot.prototype.update = function(dt){ this.ttl -= dt; this.x += Math.cos(this.angle) * this.speed * dt; this.y += Math.sin(this.angle) * this.speed * dt; if (this.ttl <= 0 || this.x > W+50 || this.y > H+50) this.reset(); };
   Shot.prototype.draw = function(ctx){ const alpha = Math.max(0, Math.min(1, this.ttl / this.life)); ctx.save(); ctx.globalAlpha = 0.9 * alpha; ctx.beginPath(); const x2 = this.x - Math.cos(this.angle) * this.len; const y2 = this.y - Math.sin(this.angle) * this.len; ctx.lineWidth = Math.max(1, this.len * 0.12); ctx.strokeStyle = `rgba(255,255,220,${0.9 * alpha})`; ctx.moveTo(this.x, this.y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); };
   
   /* explosion generator */
   function explodeAt(x,y,color, baseCount=18) {
     const shardsCount = Math.max(6, Math.floor(baseCount * 0.35));
     for (let i=0;i<shardsCount;i++) shards.push(new Shard(x+rand(-6,6), y+rand(-6,6), color));
     const smokeCount = randInt(2,4);
     for (let i=0;i<smokeCount;i++) smokeParticles.push(new Smoke(x + rand(-8,8), y + rand(-8,8), rand(8, 28), color));
     const sparksCount = Math.max(10, Math.floor(baseCount * 0.6));
     for (let i=0;i<sparksCount;i++) sparks.push(new Spark(x + rand(-4,4), y + rand(-4,4), rgba('#ffd9c9', 1)));
     const smallCount = Math.max(8, Math.floor(baseCount * 0.9));
     for (let i=0;i<smallCount;i++) shards.push(new Shard(x + rand(-6,6), y + rand(-6,6), color));
     ripples.push({ x, y, r:0, life:0.35, ttl:0.35 });
     playExplosionSound();
     score += Math.max(1, Math.round(baseCount / 10));
     cleared += 1;
     scoreEl.textContent = score;
     clearedEl.textContent = cleared;
     if (score > bestScore) {
       bestScore = score;
       bestEl.textContent = bestScore;
       localStorage.setItem(STORAGE_KEY, bestScore.toString());
     }
   }
   
   /* handle pointer: click asteroid check */
   function handlePointer(x,y) {
     for (let i = asteroids.length - 1; i >= 0; i--) {
       const a = asteroids[i];
       const dx = a.x - x;
       const dy = a.y - y;
       const dist = Math.sqrt(dx*dx + dy*dy);
       if (dist < a.size * 1.05) {
         const baseCount = Math.max(14, Math.round(a.size * 1.2));
         explodeAt(a.x, a.y, a.color, baseCount);
         a.reset(true);
         return;
       }
     }
     // if planet region clicked, planetWrap handles boost (below)
   }
   
   /* pointer events */
   canvas.addEventListener('click', (e) => {
     const rect = canvas.getBoundingClientRect();
     const x = (e.clientX - rect.left);
     const y = (e.clientY - rect.top);
     handlePointer(x,y);
   });
   canvas.addEventListener('touchstart', (e) => {
     e.preventDefault();
     const rect = canvas.getBoundingClientRect();
     for (let i=0;i<e.touches.length;i++){
       const t = e.touches[i];
       handlePointer(t.clientX - rect.left, t.clientY - rect.top);
     }
   }, { passive: false });
   
   /* planet click => speed boost */
   planetWrap.addEventListener('click', () => triggerPlanetBoost());
   planetWrap.addEventListener('touchstart', (e) => { e.preventDefault(); triggerPlanetBoost(); }, { passive: false });
   
   function triggerPlanetBoost() {
     if (planetBoostActive || planetCooldown) return;
     planetBoostActive = true;
     speedMultiplier = PLANET_BOOST_MULT;
     // visual feedback: small ring ripple
     ripples.push({ x: W/2, y: H - (document.querySelector('.planet-wrap').offsetHeight * 0.2), r:0, life:0.6, ttl:0.6 });
     setTimeout(() => {
       planetBoostActive = false;
       speedMultiplier = 1;
       planetCooldown = true;
       setTimeout(() => planetCooldown = false, PLANET_COOLDOWN);
     }, PLANET_BOOST_DURATION);
   }
   
   /* restart button */
   restartBtn.addEventListener('click', () => {
     if (score > bestScore) { bestScore = score; localStorage.setItem(STORAGE_KEY, bestScore.toString()); bestEl.textContent = bestScore; }
     score = 0; cleared = 0; misses = 0;
     scoreEl.textContent = score; clearedEl.textContent = cleared; missesEl.textContent = misses;
     populate();
   });
   
   /* keyboard : space clears nearest */
   window.addEventListener('keydown', (e) => {
     if (e.code === 'Space') {
       const cx = W/2, cy = H/2;
       let closest = null, dist = Infinity;
       for (const a of asteroids) {
         const d = (a.x - cx) ** 2 + (a.y - cy) ** 2;
         if (d < dist) { dist = d; closest = a; }
       }
       if (closest && Math.sqrt(dist) < H * 0.6) {
         explodeAt(closest.x, closest.y, closest.color, Math.max(12, Math.floor(closest.size*1.1)));
         closest.reset(true);
       }
     }
   });
   
   /* penalty behavior when asteroid is missed */
   function applyMissPenalty(a) {
     // penalty proportional to asteroid size
     const penalty = Math.max(1, Math.round(a.size / 8));
     score = Math.max(0, score - penalty);
     misses += 1;
     scoreEl.textContent = score;
     missesEl.textContent = misses;
     // small visual flash / ripple
     ripples.push({ x: a.x, y: H - 40, r: 0, life: 0.45, ttl: 0.45 });
   }
   
   /* background draw */
   function drawBackground(){
     const g = ctx.createLinearGradient(0,0,0,H);
     g.addColorStop(0,'rgba(10,8,12,0.0)');
     g.addColorStop(1,'rgba(5,4,6,0.35)');
     ctx.fillStyle = g;
     ctx.fillRect(0,0,W,H);
     ctx.save();
     ctx.globalAlpha = 0.85;
     for (let i = 0; i < 40; i++) {
       const x = (i * 9973 + Math.floor(W)) % W;
       const y = (i * 7919 + Math.floor(H)) % H;
       const r = (i % 7 === 0) ? 1.6 : 0.9;
       ctx.beginPath();
       ctx.fillStyle = 'rgba(255,255,255,0.08)';
       ctx.arc(x, y, r, 0, Math.PI*2);
       ctx.fill();
     }
     ctx.restore();
   }
   
   /* ripples draw */
   function drawRipples(dt) {
     for (let i = ripples.length - 1; i >= 0; i--) {
       const r = ripples[i]; r.ttl -= dt;
       if (r.ttl <= 0) { ripples.splice(i,1); continue; }
       const progress = 1 - (r.ttl / r.life);
       ctx.beginPath();
       ctx.strokeStyle = `rgba(255,200,170,${0.18 * (1-progress)})`;
       ctx.lineWidth = 1 + progress * 3;
       ctx.arc(r.x, r.y, progress * 60, 0, Math.PI * 2);
       ctx.stroke();
     }
   }
   
   /* main animate loop */
   function animate(ts) {
     const dt = Math.min(0.05, (ts - lastTs) / 1000) || 0.016;
     lastTs = ts;
     ctx.clearRect(0,0,W,H);
   
     drawBackground();
   
     // update shots
     shots.forEach(s => { s.update(dt); s.draw(ctx); });
   
     // asteroid update & draw. If asteroid crosses danger zone (near bottom / planet top), it's a miss.
     const planetVisibleHeight = document.querySelector('.planet-wrap').offsetHeight || Math.max(80, W * 0.12);
     const dangerY = H - planetVisibleHeight - 6; // threshold where we treat asteroid as missed
     for (let i = asteroids.length - 1; i >= 0; i--) {
       const a = asteroids[i];
       a.update(dt * 60, speedMultiplier);
       a.draw(ctx);
       if (a.y - a.size > dangerY) {
         // missed asteroid
         applyMissPenalty(a);
         a.reset(true);
       }
     }
   
     // smoke
     for (let i = smokeParticles.length - 1; i >= 0; i--) {
       const p = smokeParticles[i];
       p.update(dt);
       if (p.ttl <= 0) smokeParticles.splice(i,1); else p.draw(ctx);
     }
     // shards
     for (let i = shards.length - 1; i >= 0; i--){
       const s = shards[i];
       s.update(dt);
       if (s.ttl <= 0 || s.x < -50 || s.x > W+50 || s.y > H+200) shards.splice(i,1);
       else s.draw(ctx);
     }
     // sparks
     for (let i = sparks.length - 1; i >= 0; i--){
       const sp = sparks[i];
       sp.update(dt);
       if (sp.ttl <= 0 || sp.x < -50 || sp.x > W+50 || sp.y > H+200) sparks.splice(i,1);
       else sp.draw(ctx);
     }
   
     drawRipples(dt);
   
     requestAnimationFrame(animate);
   }
   
   /* populate and start */
   function start() {
     score = 0; cleared = 0; misses = 0;
     scoreEl.textContent = 0; clearedEl.textContent = 0; missesEl.textContent = 0;
     bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
     bestEl.textContent = bestScore;
     initAudioPool();
     resize();
     populate();
     requestAnimationFrame(animate);
   }
   start();
   
   /* ensure repopulate on large size changes */
   let lastW = W, lastH = H;
   setInterval(() => {
     if (Math.abs(window.innerWidth - lastW) > 100 || Math.abs(window.innerHeight - lastH) > 80) {
       lastW = window.innerWidth; lastH = window.innerHeight;
       resize();
       populate();
     }
   }, 800);