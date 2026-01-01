
// CHECKPOINT: Defender V5.65
// VERSION: V5.65 - Enhanced Spatial Audio
import React, { useRef, useEffect, useState } from 'react';
import { ShipConfig, Weapon, Shield, MissionType, WeaponType } from '../types';
import { audioService } from '../services/audioService';

interface GameEngineProps {
  ship: ShipConfig;
  weapons: (Weapon & { count: number })[];
  shield: Shield | null;
  missionType: MissionType;
  difficulty: number;
  onGameOver: (success: boolean) => void;
  isFullScreen: boolean;
  playerColor: string;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 640;

class Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
  constructor(x: number, y: number, color: string, vx?: number, vy?: number, size?: number) {
    this.x = x; this.y = y;
    this.vx = vx ?? (Math.random() - 0.5) * 4;
    this.vy = vy ?? (Math.random() - 0.5) * 4;
    this.life = 1.0;
    this.color = color;
    this.size = size ?? 2;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= 0.03; }
}

class PowerUp {
  x: number; y: number; w: number = 20; h: number = 20;
  type: 'HP' | 'AMMO' | 'GIFT';
  vy: number = 1.5;
  active: boolean = true;
  constructor(x: number, y: number, type: 'HP' | 'AMMO' | 'GIFT') {
    this.x = x; this.y = y; this.type = type;
    if (type === 'GIFT') this.vy = 1.0;
  }
  update() { this.y += this.vy; if (this.y > GAME_HEIGHT) this.active = false; }
}

class Entity {
  x: number; y: number; w: number; h: number; hp: number; maxHp: number;
  constructor(x: number, y: number, w: number, h: number, hp: number) {
    this.x = x; this.y = y; this.w = w; this.h = h; this.hp = hp; this.maxHp = hp;
  }
  getBounds() { return { x: this.x - this.w/2, y: this.y - this.h/2, w: this.w, h: this.h }; }
}

class Bullet extends Entity {
  vx: number; vy: number; damage: number; color: string; isEnemy: boolean;
  type: WeaponType;
  target: Enemy | null = null;
  angle: number;
  speed: number;

  constructor(x: number, y: number, vx: number, vy: number, damage: number, color: string, type: WeaponType, isEnemy = false, target: Enemy | null = null) {
    super(x, y, 4, 10, 1);
    this.vx = vx; this.vy = vy; this.damage = damage; this.color = color; this.isEnemy = isEnemy;
    this.type = type;
    this.target = target;
    this.speed = Math.hypot(vx, vy);
    this.angle = Math.atan2(vy, vx);
  }

  update() {
    if (this.type === WeaponType.MISSILE && this.target && this.target.hp > 0) {
      const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.angle += diff * 0.12;
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    }
    this.x += this.vx;
    this.y += this.vy;
  }
}

class Enemy extends Entity {
  type: 'scout' | 'interceptor' | 'bomber' | 'rock';
  vx: number = 0;
  vy: number = 2;
  fireTimer: number = 0;
  startX: number;
  sineOffset: number = Math.random() * Math.PI * 2;
  rotation: number = Math.random() * Math.PI * 2;
  rotationSpeed: number = (Math.random() - 0.5) * 0.04;
  vertices: { x: number, y: number }[] = [];
  color: string = "#27272a";

  constructor(x: number, y: number, difficulty: number, isRock = false) {
    const types: ('scout' | 'interceptor' | 'bomber')[] = ['scout', 'interceptor', 'bomber'];
    const type = isRock ? 'rock' : types[Math.floor(Math.random() * 3)];
    const hp = type === 'rock' ? 80 * difficulty : (type === 'bomber' ? 60 * difficulty : (type === 'interceptor' ? 30 * difficulty : 20 * difficulty));
    const size = type === 'rock' ? 40 + Math.random() * 40 : (type === 'bomber' ? 45 : 30);
    super(x, y, size, size, hp);
    this.type = type;
    this.startX = x;
    this.vy = type === 'rock' ? 2.0 + Math.random() * 2.5 : (type === 'bomber' ? 1 : (type === 'interceptor' ? 3.5 : 2.5));
    this.fireTimer = Math.random() * 100;

    if (type === 'rock') {
      const vCount = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < vCount; i++) {
        const angle = (i / vCount) * Math.PI * 2;
        const r = (size / 2) * (0.6 + Math.random() * 0.7);
        this.vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
      }
      const shades = ["#18181b", "#27272a", "#3f3f46", "#451a03", "#1e1b4b"];
      this.color = shades[Math.floor(Math.random() * shades.length)];
    }
  }

  update(missiles: Bullet[], px: number, py: number): Bullet | null {
    let firedBullet = null;
    if (this.type === 'rock') {
      this.rotation += this.rotationSpeed;
    } else if (this.type === 'interceptor') {
      this.x = this.startX + Math.sin(this.y * 0.05 + this.sineOffset) * 60;
    } else if (this.type === 'bomber') {
      this.fireTimer++;
      if (this.fireTimer > 120) {
        this.fireTimer = 0;
        firedBullet = new Bullet(this.x, this.y, 0, 5, 10, '#f87171', WeaponType.PROJECTILE, true);
        const pan = (this.x / GAME_WIDTH) * 2 - 1;
        audioService.playWeaponFire('cannon', pan);
      }
    }
    this.y += this.vy;
    return firedBullet;
  }
}

const GameEngine: React.FC<GameEngineProps> = ({ ship, weapons, shield, missionType, difficulty, onGameOver, isFullScreen, playerColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerSh, setPlayerSh] = useState(shield?.capacity || 0);
  const [bossHp, setBossHp] = useState<number | null>(null);
  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);
  const [ammoCounts, setAmmoCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    weapons.forEach(w => { if (w.isAmmoBased) counts[w.id] = w.count; });
    return counts;
  });

  const stateRef = useRef({
    px: GAME_WIDTH / 2,
    py: GAME_HEIGHT - 100,
    pvx: 0, pvy: 0,
    isBraking: false, isThrusting: false,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    powerups: [] as PowerUp[],
    stars: [] as { x: number, y: number, speed: number, size: number }[],
    terrain: [] as { x: number, y: number, w: number, h: number, speed: number, color: string }[],
    keys: {} as Record<string, boolean>,
    weaponLastFire: {} as Record<string, number>,
    ammo: {} as Record<string, number>,
    lastEnemy: 0,
    gameOver: false,
    hp: 100, sh: shield?.capacity || 0, maxSh: shield?.capacity || 0,
    shieldFlash: 0,
    missionProgress: 0,
    totalToKill: missionType === MissionType.ATTACK ? 20 * difficulty : 40 * difficulty,
    boss: null as Entity | null,
    bossFlash: 0
  });

  useEffect(() => {
    if (missionType === MissionType.COMET) {
      stateRef.current.boss = new Entity(GAME_WIDTH / 2, -150, 72, 72, 8000 * difficulty);
      setBossHp(100);
    }
    for(let i=0; i<100; i++) { stateRef.current.stars.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, speed: 0.5 + Math.random() * 4.5, size: 1 + Math.random() * 2 }); }
    for(let i=0; i<12; i++) { stateRef.current.terrain.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, w: 30 + Math.random() * 80, h: 30 + Math.random() * 100, speed: 0.2 + Math.random() * 0.4, color: `rgba(40, 40, 45, ${0.1 + Math.random() * 0.2})` }); }
  }, [missionType, difficulty]);

  useEffect(() => { 
    weapons.forEach(w => { if (w.isAmmoBased) stateRef.current.ammo[w.id] = w.count; }); 
  }, [weapons]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') { setIsAbortDialogOpen(prev => !prev); audioService.playSfx('click'); return; }
      stateRef.current.keys[e.key] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      window.removeEventListener('keyup', handleKeyUp);
      audioService.stopAllSfx();
    };
  }, []);

  const triggerGameOver = (success: boolean) => {
    stateRef.current.gameOver = true;
    audioService.stopAllSfx();
    onGameOver(success);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;

    const spawnEnemy = () => {
      const state = stateRef.current;
      const now = Date.now();
      if (state.boss && state.boss.y > 0) return;

      const spawnRate = missionType === MissionType.COMET ? 400 : (1200 / (difficulty * 0.8));
      if (now - state.lastEnemy > spawnRate) {
        state.enemies.push(new Enemy(Math.random() * (GAME_WIDTH - 40) + 20, -100, difficulty, missionType === MissionType.COMET));
        state.lastEnemy = now;
      }
    };

    const fireWeapons = () => {
      const now = Date.now();
      const state = stateRef.current;
      const keys = state.keys;
      const playerPan = (state.px / GAME_WIDTH) * 2 - 1;

      weapons.forEach((w) => {
        let isTriggered = false;
        if (w.type === WeaponType.PROJECTILE || w.type === WeaponType.LASER) { if (keys[' '] || keys['1']) isTriggered = true; }
        else if (w.type === WeaponType.MISSILE) { if (keys['2'] || keys['x']) isTriggered = true; }
        else if (w.type === WeaponType.MINE) { if (keys['3'] || keys['m']) isTriggered = true; }
        if (!isTriggered) return;

        const lastFire = state.weaponLastFire[w.id] || 0;
        if (now - lastFire > 1000 / w.fireRate) {
          if (w.isAmmoBased) { 
            if (state.ammo[w.id] <= 0) {
              audioService.playSfx('denied');
              return; 
            }
            state.ammo[w.id]--; 
            setAmmoCounts(prev => ({ ...prev, [w.id]: state.ammo[w.id] })); 
          }
          
          // Play weapon sound
          if (w.type === WeaponType.LASER) audioService.playWeaponFire('laser', playerPan);
          else if (w.type === WeaponType.PROJECTILE) audioService.playWeaponFire('cannon', playerPan);
          else if (w.type === WeaponType.MISSILE) audioService.playWeaponFire('missile', playerPan);
          else if (w.type === WeaponType.MINE) audioService.playWeaponFire('mine', playerPan);

          const count = w.isAmmoBased ? 1 : w.count;
          for (let i = 0; i < count; i++) {
            const offset = count > 1 ? (i === 0 ? -12 : 12) : 0;
            let color = '#34d399'; 
            if (w.type === WeaponType.LASER) color = '#f87171'; 
            if (w.type === WeaponType.MINE) color = '#fbbf24'; 
            if (w.type === WeaponType.MISSILE) color = '#60a5fa';
            state.bullets.push(new Bullet(state.px + offset, state.py - 20, 0, -12, w.damage, color, w.type));
          }
          state.weaponLastFire[w.id] = now;
        }
      });
    };

    const update = () => {
      if (stateRef.current.gameOver || isAbortDialogOpen) return;
      const state = stateRef.current;
      const keys = state.keys;
      const accel = 0.55;
      const drag = 0.92;

      state.isThrusting = keys['w'] || keys['ArrowUp'];
      state.isBraking = keys['s'] || keys['ArrowDown'];
      const movingLeft = keys['a'] || keys['ArrowLeft'];
      const movingRight = keys['d'] || keys['ArrowRight'];

      if (state.isThrusting) state.pvy -= accel;
      if (state.isBraking) state.pvy += accel;
      if (movingLeft) state.pvx -= accel;
      if (movingRight) state.pvx += accel;

      state.pvx *= drag; state.pvy *= drag;
      state.px += state.pvx; state.py += state.pvy;

      if (state.px < 35) state.px = 35; if (state.px > GAME_WIDTH - 35) state.px = GAME_WIDTH - 35;
      if (state.py < 60) state.py = 60; if (state.py > GAME_HEIGHT - 35) state.py = GAME_HEIGHT - 35;

      if (state.boss) {
        if (state.boss.y < 160) state.boss.y += 0.4;
        if (state.bossFlash > 0) state.bossFlash--;
        setBossHp(Math.ceil((state.boss.hp / state.boss.maxHp) * 100));
      }

      fireWeapons();
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i]; b.update();
        if (b.y < -100 || b.y > GAME_HEIGHT + 100) { state.bullets.splice(i, 1); continue; }
        
        const pan = (b.x / GAME_WIDTH) * 2 - 1;

        if (!b.isEnemy) {
          if (state.boss) {
            const bb = state.boss.getBounds();
            if (b.x > bb.x && b.x < bb.x + bb.w && b.y > bb.y && b.y < bb.y + bb.h) {
              state.boss.hp -= b.damage; state.bullets.splice(i, 1); state.bossFlash = 5;
              audioService.playExplosion(pan, 0.4);
              for(let p=0; p<3; p++) {
                state.particles.push(new Particle(b.x, b.y, Math.random() > 0.5 ? '#fff' : '#93c5fd', (Math.random()-0.5)*8, (Math.random())*5));
              }
              if (state.boss.hp <= 0) { 
                audioService.playExplosion(pan, 2.0);
                state.powerups.push(new PowerUp(state.boss.x, state.boss.y, 'GIFT'));
                triggerGameOver(true); 
              }
              continue;
            }
          }
          for (let j = state.enemies.length - 1; j >= 0; j--) {
            const e = state.enemies[j]; const eb = e.getBounds();
            if (b.x > eb.x && b.x < eb.x + eb.w && b.y > eb.y && b.y < eb.y + eb.h) {
              e.hp -= b.damage; state.bullets.splice(i, 1);
              if (e.hp <= 0) {
                audioService.playExplosion(pan, 0.8);
                state.enemies.splice(j, 1); setScore(s => s + 200); state.missionProgress++;
                if (Math.random() > 0.85) state.powerups.push(new PowerUp(e.x, e.y, Math.random() > 0.5 ? 'HP' : 'AMMO'));
              } else {
                audioService.playExplosion(pan, 0.2);
              }
              break;
            }
          }
        } else {
          if (Math.hypot(b.x - state.px, b.y - state.py) < 20) { state.bullets.splice(i, 1); damagePlayer(b.damage); }
        }
      }

      spawnEnemy();
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i]; e.update(state.bullets, state.px, state.py);
        if (e.y > GAME_HEIGHT + 100) { state.enemies.splice(i, 1); continue; }
        const collisionRadius = e.type === 'rock' ? e.w/2 + 5 : 45;
        if (Math.hypot(e.x - state.px, e.y - state.py) < collisionRadius) { 
          const pan = (e.x / GAME_WIDTH) * 2 - 1;
          audioService.playExplosion(pan, 1.2);
          damagePlayer(e.type === 'rock' ? 40 : 30); e.hp = 0; state.enemies.splice(i, 1); 
        }
      }

      for (let i = state.powerups.length - 1; i >= 0; i--) {
        const p = state.powerups[i]; p.update();
        if (Math.hypot(p.x - state.px, p.y - state.py) < 35) { 
          audioService.playSfx('buy');
          if (p.type === 'HP') state.hp = Math.min(100, state.hp + 25); 
          else if (p.type === 'AMMO') { Object.keys(state.ammo).forEach(id => state.ammo[id] += 20); setAmmoCounts({ ...state.ammo }); } 
          else if (p.type === 'GIFT') {
             Object.keys(state.ammo).forEach(id => state.ammo[id] += 100); 
             setAmmoCounts({ ...state.ammo });
             setScore(s => s + 5000);
          }
          p.active = false; 
        }
        if (!p.active) state.powerups.splice(i, 1);
      }

      for (let i = state.particles.length - 1; i >= 0; i--) { state.particles[i].update(); if (state.particles[i].life <= 0) state.particles.splice(i, 1); }
      if (shield && state.sh < state.maxSh) state.sh = Math.min(state.maxSh, state.sh + shield.regenRate / 60);
      setPlayerHp(state.hp); setPlayerSh(Math.floor(state.sh)); if (state.shieldFlash > 0) state.shieldFlash--;
      if (missionType !== MissionType.COMET && state.missionProgress >= state.totalToKill) { triggerGameOver(true); }
      if (state.hp <= 0) { triggerGameOver(false); }
    };

    const damagePlayer = (amount: number) => {
      const state = stateRef.current;
      const playerPan = (state.px / GAME_WIDTH) * 2 - 1;
      if (state.sh > 0) { 
        state.sh -= amount; state.shieldFlash = 10; 
        audioService.playShieldHit(playerPan);
        if (state.sh < 0) { state.hp += state.sh; state.sh = 0; } 
      } else { 
        state.hp -= amount; 
        audioService.playExplosion(playerPan, 0.5);
      }
    };

    const draw = () => {
      const state = stateRef.current;
      ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      if (missionType === MissionType.COMET) {
        const grad = ctx.createLinearGradient(0, -100, 0, GAME_HEIGHT);
        grad.addColorStop(0, 'rgba(147, 197, 253, 0.4)');
        grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      ctx.fillStyle = '#fff';
      state.stars.forEach(s => { ctx.globalAlpha = s.size / 4; ctx.fillRect(s.x, s.y, s.size, s.size); if (!isAbortDialogOpen) s.y += s.speed * (missionType === MissionType.COMET ? 4 : 1); if (s.y > GAME_HEIGHT) s.y = -10; });
      ctx.globalAlpha = 1;

      state.particles.forEach(p => { 
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life; 
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); 
      });
      ctx.globalAlpha = 1;
      
      if (state.boss) {
        ctx.save(); ctx.translate(state.boss.x, state.boss.y);
        const coma = ctx.createRadialGradient(0, 0, 0, 0, 0, 66);
        coma.addColorStop(0, state.bossFlash > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(147, 197, 253, 0.7)');
        coma.addColorStop(1, 'transparent');
        ctx.fillStyle = coma; ctx.beginPath(); ctx.arc(0, 0, 66, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      state.enemies.forEach(e => {
        ctx.save(); ctx.translate(e.x, e.y); 
        if (e.type === 'rock') {
          ctx.rotate(e.rotation);
          ctx.fillStyle = e.color; 
          ctx.beginPath(); 
          if (e.vertices.length > 0) {
            ctx.moveTo(e.vertices[0].x, e.vertices[0].y);
            for(let v=1; v<e.vertices.length; v++) ctx.lineTo(e.vertices[v].x, e.vertices[v].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.stroke();
        } else {
          ctx.fillStyle = e.type === 'bomber' ? '#ef4444' : '#3b82f6';
          ctx.rotate(Math.PI); ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-15, -15); ctx.lineTo(15, -15); ctx.fill();
        }
        ctx.restore();
      });

      state.powerups.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y);
        if (p.type === 'GIFT') {
          ctx.fillStyle = "#fbbf24";
          ctx.shadowBlur = 10; ctx.shadowColor = "#f59e0b";
          ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial"; ctx.fillText("GIFT", -14, 4);
        } else {
          ctx.fillStyle = p.type === 'HP' ? '#4ade80' : '#60a5fa';
          ctx.fillRect(-10, -10, 20, 20);
          ctx.strokeStyle = '#fff'; ctx.strokeRect(-10, -10, 20, 20);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText(p.type === 'HP' ? '+' : 'A', -4, 4);
        }
        ctx.restore();
      });

      state.bullets.forEach(b => { ctx.fillStyle = b.color; ctx.fillRect(b.x-2, b.y-5, 4, 10); });
      
      ctx.save(); ctx.translate(state.px, state.py); ctx.fillStyle = playerColor;
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(25, 25); ctx.lineTo(0, 15); ctx.lineTo(-25, 25); ctx.fill();
      if (state.sh > 0) {
        ctx.strokeStyle = state.shieldFlash > 0 ? '#fff' : 'rgba(96, 165, 250, 0.4)';
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    };

    const loop = () => { update(); draw(); animationFrameId = requestAnimationFrame(loop); };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [ship, weapons, shield, difficulty, playerColor, missionType, isAbortDialogOpen]);

  return (
    <div ref={containerRef} className={`relative bg-zinc-950 border-4 border-zinc-800 rounded shadow-2xl overflow-hidden ${isFullScreen ? 'w-screen h-screen' : 'w-[600px] h-[640px]'}`}>
      <canvas ref={canvasRef} width={600} height={640} className="w-full h-full block" />
      {bossHp !== null && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-4 bg-zinc-900 border border-red-500/50 rounded-full overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${bossHp}%` }} />
          <div className="absolute inset-0 flex items-center justify-center"><span className="retro-font text-[8px] text-white uppercase drop-shadow-md">Comet Integrity</span></div>
        </div>
      )}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2"><div className="w-32 h-2 bg-zinc-800 rounded overflow-hidden border border-zinc-700"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${playerHp}%` }} /></div><span className="retro-font text-[10px] text-emerald-400">HP</span></div>
          <div className="flex items-center gap-2"><div className="w-32 h-2 bg-zinc-800 rounded overflow-hidden border border-zinc-700"><div className="h-full bg-blue-500 transition-all" style={{ width: `${stateRef.current.maxSh > 0 ? (playerSh / stateRef.current.maxSh) * 100 : 0}%` }} /></div><span className="retro-font text-[10px] text-blue-400">SH</span></div>
        </div>
        <div className="text-right"><div className="retro-font text-xl text-emerald-400">{score.toString().padStart(6, '0')}</div><div className="text-[10px] text-zinc-500 uppercase tracking-widest">Score</div></div>
      </div>
      {isAbortDialogOpen && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-8 rounded-lg shadow-2xl text-center space-y-6">
            <h3 className="retro-font text-xl text-red-500 uppercase tracking-widest">Abort Combat?</h3>
            <div className="flex gap-4 justify-center">
              <button onClick={() => { setIsAbortDialogOpen(false); audioService.playSfx('click'); }} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white retro-font text-[10px] uppercase">No</button>
              <button onClick={() => triggerGameOver(false)} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white retro-font text-[10px] uppercase">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameEngine;
