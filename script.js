
/* ===========================
   CONFIG / AUDIO
   =========================== */

   const AUDIO_URL = './explotion.mp3';
   const AUDIO_POOL_SIZE = 6;
   const EXPLOSION_VOLUME = 0.08;
   const ASTEROID_COUNT = 8;
   
   const canvas = document.getElementById('spaceCanvas');
   const ctx = canvas.getContext('2d');
   
   let DPR = 1, W = 0, H = 0, lastTs = 0;
   
   // UI Elements
   const scoreEl = document.getElementById('score');
   const bestEl = document.getElementById('best');
   const restartBtn = document.getElementById('restartBtn');
   const muteBtn = document.getElementById('muteBtn');
   const planetWrap = document.getElementById('planetWrap');
   
   let score = 0, cleared = 0, misses = 0;
   const STORAGE_KEY = 'saveMars_bestScore';
   let bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
   bestEl.textContent = bestScore;
   
   // Audio Pool
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
   
   let audioUnlocked = false;
   function unlockAudio() {
     if (audioUnlocked) return;
     audioUnlocked = true;
     const a = audioPool[0];
     a.volume = 0;
     a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = EXPLOSION_VOLUME; }).catch(() => {});
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
     try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) { }
   }
   
   // ==== CANVAS RESIZE ====
   function resize() {
     DPR = Math.max(1, window.devicePixelRatio || 1);
     W = window.innerWidth; H = window.innerHeight;
     canvas.width = W * DPR;
     canvas.height = H * DPR;
     canvas.style.width = W + 'px';
     canvas.style.height = H + 'px';
     ctx.resetTransform();
     ctx.scale(DPR, DPR);
   
     const planetHeight = planetWrap.offsetHeight;
     document.querySelector('.game-ui').style.bottom = (planetHeight / 2 + H * 0.1) + 'px';
   }
   window.addEventListener('resize', resize);
   resize();
   
   // ==== HELPERS ====
   function rand(min, max) { return Math.random() * (max - min) + min; }
   function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
   function hexToRgb(hex) { const h = hex.replace('#', ''); const i = parseInt(h, 16); return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 }; }
   function rgba(hex, a) { const c = hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
   
   // ==== PARTICLE CLASSES ====
   class Asteroid {
     constructor() {
       this.reset();
     }
     reset(randomY=false) {
       this.size = rand(28, 48);
       this.x = rand(0, W);
       this.y = randomY ? rand(-H, 0) : -this.size;
       this.color = ['#a67c52','#8b5e3c','#6d3f2c'][randInt(0,2)];
       this.speedY = rand(40, 120);
       this.speedX = rand(-15, 15);
     }
     update(dt) {
       this.y += this.speedY * dt;
       this.x += this.speedX * dt;
     }
     draw(ctx) {
       ctx.save();
       ctx.fillStyle = this.color;
       ctx.beginPath();
       ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
       ctx.fill();
       ctx.restore();
     }
   }
   
   class Shot {
     constructor() {
       this.reset();
     }
     reset() {
       this.x = rand(0, W);
       this.y = H;
       this.size = 6;
       this.speed = rand(200,300);
     }
     update(dt) {
       this.y -= this.speed*dt;
       if(this.y<0) this.reset();
     }
     draw(ctx){
       ctx.save();
       ctx.fillStyle = '#ffdf6b';
       ctx.beginPath();
       ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
       ctx.fill();
       ctx.restore();
     }
   }
   
   // Placeholder classes for smoke, shards, sparks
   class Particle { constructor(x,y,color){ this.x=x;this.y=y;this.color=color;this.ttl=0.6; this.life=0; } update(dt){ this.life+=dt; this.ttl-=dt; this.y-=30*dt; } draw(ctx){ ctx.save(); ctx.globalAlpha=this.ttl; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,4,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
   
   let asteroids=[], shots=[], smokeParticles=[], shards=[], sparks=[], ripples=[];
   let speedMultiplier=1, planetBoostActive=false, planetCooldown=false;
   const PLANET_BOOST_MULT=1.9, PLANET_BOOST_DURATION=5000, PLANET_COOLDOWN=8000;
   
   // Populate game objects
   function populate() {
     asteroids=[]; shots=[]; smokeParticles=[]; shards=[]; sparks=[]; ripples=[];
     for(let i=0;i<ASTEROID_COUNT;i++) asteroids.push(new Asteroid());
     for(let i=0;i<Math.max(4,Math.floor(W/400));i++) shots.push(new Shot());
   }
   
   // ==== POINTER HANDLER ====
   function handlePointer(x,y){
     for(let i=asteroids.length-1;i>=0;i--){
       const a = asteroids[i];
       const dx=a.x-x, dy=a.y-y;
       if(Math.sqrt(dx*dx+dy*dy)<a.size*1.05){
         explodeAt(a.x,a.y,a.color,12);
         a.reset(true);
         score++; scoreEl.textContent=score;
         return;
       }
     }
   }
   
   // Pointer events
   canvas.addEventListener('click', e=>{
     const rect=canvas.getBoundingClientRect();
     const x=(e.clientX-rect.left)*(canvas.width/rect.width)/DPR;
     const y=(e.clientY-rect.top)*(canvas.height/rect.height)/DPR;
     handlePointer(x,y);
   });
   canvas.addEventListener('touchstart', e=>{
     e.preventDefault();
     const rect=canvas.getBoundingClientRect();
     for(let t of e.touches){
       const x=(t.clientX-rect.left)*(canvas.width/rect.width)/DPR;
       const y=(t.clientY-rect.top)*(canvas.height/rect.height)/DPR;
       handlePointer(x,y);
     }
   },{passive:false});
   
   // ==== PLANET BOOST ====
   planetWrap.addEventListener('click', triggerPlanetBoost);
   planetWrap.addEventListener('touchstart', e=>{ e.preventDefault(); triggerPlanetBoost(); }, {passive:false});
   function triggerPlanetBoost(){
     if(planetBoostActive||planetCooldown) return;
     planetBoostActive=true; speedMultiplier=PLANET_BOOST_MULT;
     ripples.push({x:W/2,y:H-(planetWrap.offsetHeight*0.2),r:0,life:0.6,ttl:0.6});
     setTimeout(()=>{
       planetBoostActive=false;
       speedMultiplier=1;
       planetCooldown=true;
       setTimeout(()=>planetCooldown=false, PLANET_COOLDOWN);
     }, PLANET_BOOST_DURATION);
   }
   
   // ==== RESTART ====
   restartBtn.addEventListener('click', ()=>{
     if(score>bestScore){ bestScore=score; localStorage.setItem(STORAGE_KEY,bestScore.toString()); bestEl.textContent=bestScore; }
     score=0; cleared=0; misses=0;
     scoreEl.textContent=score;
     populate();
   });
   
   // ==== EXPLOSION ====
   function explodeAt(x,y,color,count){
     for(let i=0;i<count;i++){
       smokeParticles.push(new Particle(x,y,color));
     }
     playExplosionSound();
   }
   
   // ==== DRAW 404 BLINKING BADGE ====
   let blinkAlpha=1, blinkDir=-1;
   function draw404Badge(dt){
     blinkAlpha+=blinkDir*dt*2;
     if(blinkAlpha<0.2){ blinkAlpha=0.2; blinkDir=1; }
     if(blinkAlpha>1){ blinkAlpha=1; blinkDir=-1; }
     ctx.save();
     ctx.font='bold 36px sans-serif';
     ctx.fillStyle=`rgba(255,100,80,${blinkAlpha})`;
     ctx.textAlign='left';
     ctx.textBaseline='top';
     ctx.fillText('404', 20, 20);
     ctx.restore();
   }
   
   // ==== MAIN LOOP ====
   function animate(ts){
     const dt = Math.min(0.05,(ts-lastTs)/1000)||0.016;
     lastTs=ts;
   
     ctx.clearRect(0,0,W,H);
   
     shots.forEach(s=>{ s.update(dt*speedMultiplier); s.draw(ctx); });
     asteroids.forEach(a=>{ 
       a.update(dt*speedMultiplier); 
       a.draw(ctx);
       if(a.y - a.size > H){ misses++; a.reset(true); }
     });
     smokeParticles.forEach((p,i)=>{ p.update(dt*speedMultiplier); if(p.ttl<=0) smokeParticles.splice(i,1); else p.draw(ctx); });
   
     draw404Badge(dt);
   
     requestAnimationFrame(animate);
   }
   
   // ==== START GAME ====
   function start(){
     score=0; cleared=0; misses=0;
     scoreEl.textContent=0; bestEl.textContent=bestScore;
     initAudioPool(); resize(); populate(); requestAnimationFrame(animate);
   }
   start();
   