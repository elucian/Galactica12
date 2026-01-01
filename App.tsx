
// CHECKPOINT: Defender V21.3
// VERSION: V21.3 - Precision Selection Reticle
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GameState, Planet, Moon, MissionType, ShipConfig, Weapon, Shield, GameSettings, EquippedWeapon, WeaponType, QuadrantType, ShipFitting } from './types';
import { INITIAL_CREDITS, SHIPS, WEAPONS, SHIELDS, PLANETS } from './constants';
import GameEngine from './components/GameEngine';
import LandingScene from './components/LandingScene';
import { getMissionBriefing } from './services/geminiService';
import { audioService } from './services/audioService';

const SAVE_KEY = 'galactic_defender_v21_0';

const ShipIcon = ({ shape, color = 'white', className = '', showJets = false }: { shape: string, color?: string, className?: string, showJets?: boolean }) => {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
        {shape === 'arrow' && <path d="M50 10 L10 90 L50 70 L90 90 Z" fill={color} />}
        {shape === 'stealth' && <path d="M50 5 L10 95 L50 80 L90 95 Z" fill={color} stroke="white" strokeWidth="2" />}
        {shape === 'wing' && <path d="M50 20 L0 80 L50 60 L100 80 Z" fill={color} />}
        {shape === 'block' && <rect x="20" y="20" width="60" height="60" rx="4" fill={color} />}
        {shape === 'mine-layer' && <path d="M50 10 L10 40 L10 80 L50 95 L90 80 L90 40 Z" fill={color} />}
      </svg>
      {showJets && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-0">
          <div className="w-1.5 h-6 bg-blue-400 rounded-full animate-pulse opacity-80 blur-[1px]" />
          <div className="w-1 h-8 bg-white/80 rounded-full animate-bounce opacity-90 blur-[1px]" />
          <div className="w-1.5 h-6 bg-blue-400 rounded-full animate-pulse opacity-80 blur-[1px]" />
        </div>
      )}
    </div>
  );
};

const Starfield = ({ count = 100, isFixed = true, scrollSpeed = 0 }: { count?: number, isFixed?: boolean, scrollSpeed?: number }) => {
  const stars = useMemo(() => {
    const colors = ['#ffffff', '#60a5fa', '#f87171', '#fbbf24', '#ffffff'];
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 4,
      flicker: Math.random() > 0.3
    }));
  }, [count]);

  return (
    <div className={`${isFixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none overflow-hidden z-0`}>
      {stars.map(s => (
        <div
          key={s.id}
          className={`absolute rounded-full ${s.flicker ? 'animate-pulse' : ''} ${scrollSpeed > 0 ? 'animate-star-scroll' : ''}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            animationDelay: `${s.delay}s`,
            animationDuration: scrollSpeed > 0 ? `${15 / scrollSpeed}s` : `${s.duration}s`,
            opacity: 0.8
          }}
        />
      ))}
      <style>{`
        @keyframes star-scroll {
          from { transform: translateY(-100vh); }
          to { transform: translateY(100vh); }
        }
        .animate-star-scroll { animation: star-scroll linear infinite; }
      `}</style>
    </div>
  );
};

const WarpTransition = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    audioService.playSfx('transition');
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3)_0%,transparent_100%)]" />
      <div className="warp-tunnel">
        {Array.from({ length: 150 }).map((_, i) => (
          <div key={i} className="warp-star" style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 2 + 's',
            animationDuration: (0.3 + Math.random() * 1.2) + 's'
          }} />
        ))}
      </div>
      <div className="relative z-10 animate-vibrate">
        <div className="w-24 h-24 md:w-32 md:h-32 p-4 bg-blue-500/10 rounded-full border border-blue-400/30 shadow-[0_0_80px_rgba(59,130,246,0.4)] backdrop-blur-md">
          <ShipIcon shape="stealth" color="#10b981" />
        </div>
      </div>
      <div className="absolute bottom-10 md:bottom-20 px-6 text-center retro-font text-blue-400 text-[10px] md:text-sm animate-pulse tracking-widest uppercase">Warp Drive Active - Bending Space-Time</div>
    </div>
  );
};

const LaunchSimulation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    audioService.playSfx('transition');
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020205] flex flex-col items-center justify-center overflow-hidden">
      <Starfield count={300} isFixed scrollSpeed={1.5} />
      <div className="absolute bottom-[-110vh] left-1/2 -translate-x-1/2 w-[400vw] h-[180vh] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15)_0%,transparent_70%)] rounded-[50%] blur-3xl animate-planet-descend" />
      <div className="absolute bottom-[-105vh] left-1/2 -translate-x-1/2 w-[400vw] h-[180vh] bg-zinc-950 rounded-[50%] border-t-4 border-emerald-500/20 animate-planet-descend flex flex-col items-center pt-20">
         <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05)_0%,transparent_60%)]" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        <div className="animate-ship-ascent">
          <div className="w-24 h-24 md:w-32 md:h-32">
            <ShipIcon shape="arrow" color="#10b981" showJets />
          </div>
        </div>
      </div>
      <div className="absolute bottom-12 md:bottom-20 px-6 text-center retro-font text-emerald-500/70 text-[8px] md:text-sm animate-pulse tracking-[0.8em] uppercase z-20">Planetary Escape Velocity Achieved</div>
      <style>{`
        @keyframes planet-descend { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(120vh); } }
        @keyframes ship-ascent { 0% { transform: translateY(150px) scale(0.85); } 30% { transform: translateY(0) scale(1.0); } 100% { transform: translateY(-70vh) scale(0.5); opacity: 0; } }
        .animate-planet-descend { animation: planet-descend 5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-ship-ascent { animation: ship-ascent 5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    const baseState: GameState = {
      credits: INITIAL_CREDITS, selectedShipId: 'vanguard', ownedShips: ['vanguard'], shipFittings: { 'vanguard': { weapons: [], shieldId: null } }, shipColors: { 'vanguard': '#10b981' }, currentPlanet: null, currentMoon: null, currentMission: null, currentQuadrant: QuadrantType.ALFA, conqueredMoonIds: [], shipMapPosition: { [QuadrantType.ALFA]: { x: 50, y: 50 }, [QuadrantType.BETA]: { x: 50, y: 50 }, [QuadrantType.GAMA]: { x: 50, y: 50 }, [QuadrantType.DELTA]: { x: 50, y: 50 }, }, shipRotation: 0, orbitingEntityId: null, orbitAngle: 0, dockedPlanetId: 'p1', tutorialCompleted: false, settings: { musicVolume: 0.3, sfxVolume: 0.5, musicEnabled: true, sfxEnabled: true, displayMode: 'windowed', autosaveEnabled: true }, taskForceShipIds: [], activeTaskForceIndex: 0, pilotName: 'STRIKER', pilotAvatar: '👨‍🚀'
    };
    if (saved) { try { return JSON.parse(saved); } catch(e) { return baseState; } }
    return baseState;
  });

  const [screen, setScreenState] = useState<'intro' | 'hangar' | 'map' | 'briefing' | 'game' | 'results' | 'warp' | 'launch'>('intro');
  const [targetQuadrant, setTargetQuadrant] = useState<QuadrantType>(QuadrantType.ALFA);
  const [briefing, setBriefing] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWarpDialogOpen, setIsWarpDialogOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; reward: number } | null>(null);
  const [isAutoDocking, setIsAutoDocking] = useState(false);

  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(gameState)); }, [gameState]);

  const onArrival = async (entity: any) => {
    audioService.playSfx('click');
    if (entity.id === 'sun') return; 
    if (entity.status === 'friendly') {
      setGameState(p => ({ ...p, dockedPlanetId: entity.id, currentQuadrant: entity.quadrant }));
      setScreenState('hangar');
      setIsAutoDocking(false);
      return;
    }
    setIsLoading(true);
    let targetPlanet: Planet | null = entity && 'moons' in entity ? entity : null;
    let targetMoon: Moon | null = entity && !('moons' in entity) ? entity : null;
    let missionType = MissionType.ATTACK;
    setGameState(prev => ({ ...prev, currentPlanet: targetPlanet, currentMoon: targetMoon, currentMission: missionType, dockedPlanetId: null }));
    const briefingText = await getMissionBriefing(entity.name, MissionType.ATTACK);
    setBriefing(briefingText);
    setIsLoading(false);
    setScreenState('briefing');
  };

  const handleJump = (q: QuadrantType) => { setTargetQuadrant(q); setIsWarpDialogOpen(false); setGameState(p => ({ ...p, dockedPlanetId: null })); setScreenState('warp'); setIsAutoDocking(false); };
  const handleReturnHome = () => { if (gameState.dockedPlanetId) { const p = PLANETS.find(p => p.id === gameState.dockedPlanetId); if (p) { setTargetQuadrant(p.quadrant); setIsAutoDocking(true); setScreenState('warp'); } } else { setScreenState('intro'); } };
  const currentShip = useMemo(() => SHIPS.find(s => s.id === gameState.selectedShipId), [gameState.selectedShipId]);
  const exitHangar = () => { setScreenState('launch'); };
  const updatePilot = (name: string, avatar: string) => { setGameState(p => ({ ...p, pilotName: name, pilotAvatar: avatar })); };
  const updateShipColor = (color: string) => { if (gameState.selectedShipId) { setGameState(p => ({ ...p, shipColors: { ...p.shipColors, [gameState.selectedShipId!]: color } })); } };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white selection:bg-emerald-500 overflow-hidden font-mono">
      {screen === 'intro' && (
        <div className="flex-grow flex flex-col items-center justify-center relative p-6 md:p-10">
          <Starfield count={150} isFixed />
          <div className="relative z-10 text-center space-y-6 md:space-y-10 max-w-3xl">
            <h1 className="retro-font text-3xl md:text-7xl text-emerald-500 animate-pulse drop-shadow-[0_0_20px_rgba(16,185,129,0.4)] uppercase">Galactic Defender</h1>
            <div className="bg-white/5 p-6 md:p-10 border border-white/10 backdrop-blur-xl space-y-4 md:space-y-6 rounded-lg shadow-2xl">
              <p className="text-emerald-400 text-sm md:text-xl leading-relaxed uppercase tracking-widest font-bold">Year 2348: Outer Rim Expansion</p>
              <p className="text-zinc-400 text-[10px] md:text-base leading-relaxed uppercase tracking-tighter">Alien signals have disrupted our colonies. Our outposts are falling silent. You are authorized to defend our sectors at any cost.</p>
            </div>
            <button onClick={() => setScreenState('hangar')} className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 retro-font text-[10px] md:text-sm rounded-lg uppercase tracking-widest transition-all backdrop-blur-md shadow-xl active:scale-95">Initialize Commander</button>
          </div>
        </div>
      )}
      {screen === 'warp' && <WarpTransition onComplete={() => { setGameState(p => ({ ...p, currentQuadrant: targetQuadrant })); setScreenState('map'); }} />}
      {screen === 'launch' && <LaunchSimulation onComplete={() => setScreenState('map')} />}
      {screen === 'hangar' && (
        <div className="flex-grow flex flex-col h-full bg-zinc-950 relative overflow-hidden">
           <Starfield count={50} isFixed />
           <header className="flex justify-between items-center p-4 md:p-6 border-b border-white/5 relative z-10 shrink-0">
             <div className="retro-font text-xs md:text-2xl text-emerald-400">COMMAND HANGAR</div>
             <div className="flex gap-2">
                <button onClick={() => setIsConfigOpen(true)} className="px-4 py-2 bg-white/5 border border-white/10 retro-font text-[8px] hover:bg-white/10 transition-all uppercase rounded backdrop-blur-sm">Config</button>
                <button onClick={() => setIsManualOpen(true)} className="px-4 py-2 bg-white/5 border border-white/10 retro-font text-[8px] hover:bg-white/10 transition-all uppercase rounded backdrop-blur-sm">Manual</button>
                <div className="retro-font text-yellow-500 text-[10px] md:text-sm uppercase tracking-tight ml-4 flex items-center">₿{gameState.credits.toLocaleString()}</div>
             </div>
           </header>
           <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 md:p-8 overflow-hidden relative z-10">
             <div className="w-full md:w-1/3 bg-white/5 border border-white/10 p-4 overflow-y-auto space-y-2 rounded-lg backdrop-blur-xl custom-scrollbar">
               <h3 className="retro-font text-[8px] md:text-[9px] text-zinc-500 mb-2 uppercase tracking-widest">Fleet Assets</h3>
               {SHIPS.map(ship => (
                 <div key={ship.id} onClick={() => setGameState(p => ({ ...p, selectedShipId: ship.id }))} className={`p-4 border transition-all flex justify-between items-center cursor-pointer rounded-lg ${gameState.selectedShipId === ship.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/5 hover:bg-white/5 hover:border-white/20'}`}>
                   <span className="retro-font text-[8px] md:text-[9px] uppercase">{ship.name}</span>
                   <div className="w-8 h-8 md:w-10 md:h-10"><ShipIcon shape={ship.shape} color={gameState.shipColors[ship.id] || ship.defaultColor} /></div>
                 </div>
               ))}
             </div>
             <div className="w-full md:w-2/3 flex flex-col gap-4 overflow-hidden">
               <div className="flex-grow bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center gap-4 md:gap-8 relative overflow-hidden rounded-lg backdrop-blur-xl shadow-2xl">
                 {gameState.selectedShipId && (
                   <>
                     <div className="w-32 h-32 md:w-48 md:h-48 relative z-10 drop-shadow-[0_0_40px_rgba(16,185,129,0.25)] shrink-0"><ShipIcon shape={SHIPS.find(s=>s.id === gameState.selectedShipId)!.shape} color={gameState.shipColors[gameState.selectedShipId] || SHIPS.find(s=>s.id === gameState.selectedShipId)!.defaultColor} /></div>
                     <div className="text-center z-10 max-w-md overflow-y-auto px-4"><h2 className="retro-font text-sm md:text-2xl text-emerald-400 mb-2 uppercase">{SHIPS.find(s=>s.id === gameState.selectedShipId)!.name}</h2><p className="text-zinc-400 text-[9px] md:text-xs uppercase tracking-tighter leading-relaxed">{SHIPS.find(s=>s.id === gameState.selectedShipId)!.description}</p></div>
                   </>
                 )}
               </div>
               <button onClick={exitHangar} className="w-full py-6 md:py-8 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/40 retro-font text-xs md:text-xl tracking-[0.4em] transition-all rounded-lg shrink-0 uppercase shadow-lg">Depart to Orbit</button>
             </div>
           </div>
           {isConfigOpen && (
             <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
                <div className="bg-zinc-900/60 border border-white/10 p-8 max-w-lg w-full space-y-8 rounded-lg backdrop-blur-2xl shadow-2xl">
                   <h3 className="retro-font text-lg text-emerald-400 uppercase tracking-widest text-center">Pilot Matrix</h3>
                   <div className="space-y-4">
                      <div><label className="retro-font text-[10px] text-zinc-500 uppercase block mb-2">Callsign</label><input value={gameState.pilotName} onChange={(e) => updatePilot(e.target.value, gameState.pilotAvatar)} className="w-full bg-white/5 border border-white/10 p-4 text-emerald-400 uppercase retro-font text-xs outline-none focus:border-emerald-500 rounded-lg" /></div>
                      <div><label className="retro-font text-[10px] text-zinc-500 uppercase block mb-2">Bio-Avatar</label><div className="flex gap-4 text-3xl">{['👨‍🚀', '👩‍🚀', '👽', '🤖', '💀'].map(a => (<button key={a} onClick={() => updatePilot(gameState.pilotName, a)} className={`p-3 border transition-all rounded-lg ${gameState.pilotAvatar === a ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:bg-white/10'}`}>{a}</button>))}</div></div>
                      <div><label className="retro-font text-[10px] text-zinc-500 uppercase block mb-2">Hull Coating</label><div className="flex gap-3">{['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#a855f7', '#ffffff'].map(c => (<button key={c} onClick={() => updateShipColor(c)} className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-125 ${gameState.shipColors[gameState.selectedShipId!] === c ? 'border-white shadow-[0_0_10px_white]' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div>
                   </div>
                   <button onClick={() => setIsConfigOpen(false)} className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 retro-font text-xs uppercase rounded-lg transition-all shadow-lg">Sync Matrix</button>
                </div>
             </div>
           )}
           {isManualOpen && (
             <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
                <div className="bg-zinc-900/60 border border-white/10 p-8 max-w-2xl w-full space-y-6 rounded-lg backdrop-blur-2xl shadow-2xl">
                   <h3 className="retro-font text-lg text-emerald-400 uppercase tracking-widest text-center">Fleet Protocol</h3>
                   <div className="font-mono text-sm text-zinc-400 space-y-4 uppercase h-64 overflow-y-auto custom-scrollbar pr-4"><p className="text-emerald-500 font-bold border-b border-white/5 pb-1">Navigation:</p><p>Use the Sector Map for gravity anchors. The central star stabilizes the system. Click planets to view tactical intelligence.</p><p className="text-emerald-500 font-bold border-b border-white/5 pb-1">Deep Space Travel:</p><p>Warp Gates connect ALFA, BETA, GAMA, and DELTA quadrants. High caution advised in the Delta Singularity zone.</p><p className="text-emerald-500 font-bold border-b border-white/5 pb-1">Strategic Operations:</p><p>Engage occupied systems to restore peace. Credits earned from missions are vital for fleet sustainability.</p></div>
                   <button onClick={() => setIsManualOpen(false)} className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 retro-font text-xs uppercase rounded-lg transition-all shadow-lg">Confirm Protocol</button>
                </div>
             </div>
           )}
        </div>
      )}
      {screen === 'map' && (<MapScreen planets={PLANETS.filter(p => p.quadrant === gameState.currentQuadrant)} onArrival={onArrival} currentQuadrant={gameState.currentQuadrant} onOpenWarp={() => setIsWarpDialogOpen(true)} initialFocusId={gameState.dockedPlanetId} pilotAvatar={gameState.pilotAvatar} pilotName={gameState.pilotName} selectedShipId={gameState.selectedShipId} shipColors={gameState.shipColors} onReturnHome={handleReturnHome} autoDock={isAutoDocking} />)}
      {screen === 'briefing' && (<div className="flex-grow flex items-center justify-center p-6 bg-black relative"><Starfield count={80} isFixed /><div className="max-w-2xl w-full bg-white/5 border border-white/10 p-6 md:p-10 space-y-6 md:space-y-8 rounded-lg shadow-2xl z-10 backdrop-blur-2xl"><h2 className="retro-font text-sm md:text-2xl text-emerald-400 border-b border-white/5 pb-4 uppercase tracking-widest">Tactical Briefing</h2><p className="font-mono text-xs md:text-xl text-white uppercase leading-relaxed max-h-[30vh] overflow-y-auto custom-scrollbar">{briefing || "Decrypting transmission..."}</p><div className="flex flex-col md:flex-row gap-4"><button onClick={() => setScreenState('map')} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 retro-font text-[10px] rounded-lg uppercase transition-all backdrop-blur-md">Hold Position</button><button onClick={() => setScreenState('game')} className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 retro-font text-[10px] rounded-lg uppercase transition-all backdrop-blur-md shadow-lg">Engage</button></div></div></div>)}
      {screen === 'game' && currentShip && (<div className="flex-grow flex items-center justify-center relative"><GameEngine ship={currentShip} weapons={[]} shield={null} missionType={gameState.currentMission!} difficulty={5} onGameOver={(success) => { setLastResult({ success, reward: success ? 10000 : 2500 }); setGameState(p => ({ ...p, credits: p.credits + (success ? 10000 : 2500) })); setScreenState('results'); }} isFullScreen={true} playerColor={gameState.shipColors[gameState.selectedShipId!] || currentShip.defaultColor || '#10b981'} /></div>)}
      {screen === 'results' && lastResult && (
        <div className="flex-grow flex flex-col items-center justify-center gap-6 md:gap-10 bg-black relative">
          <Starfield count={100} isFixed />
          <h2 className={`retro-font text-3xl md:text-6xl z-10 uppercase tracking-[0.2em] drop-shadow-2xl ${lastResult.success ? 'text-emerald-500' : 'text-red-500'}`}>{lastResult.success ? 'Victory' : 'Mission Failed'}</h2>
          <div className="retro-font text-xs md:text-xl z-10 uppercase tracking-widest text-zinc-400">Combat Pay: ₿{lastResult.reward.toLocaleString()}</div>
          <button onClick={() => setScreenState('map')} className="px-10 py-5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 retro-font text-[10px] md:text-base rounded-lg z-10 transition-all uppercase backdrop-blur-md shadow-xl">Return to Fleet</button>
        </div>
      )}
      {isWarpDialogOpen && (
        <div className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-zinc-950/60 border border-blue-500/30 p-6 md:p-10 max-w-lg w-full space-y-8 rounded-lg shadow-2xl backdrop-blur-2xl">
            <h3 className="retro-font text-xs md:text-xl text-blue-400 text-center tracking-[0.4em] uppercase">Sector Jump Matrix</h3>
            <div className="grid grid-cols-2 gap-4">{[{ type: QuadrantType.ALFA, color: 'text-yellow-400', bColor: 'border-yellow-500/30', icon: '#fbbf24' }, { type: QuadrantType.BETA, color: 'text-orange-500', bColor: 'border-orange-500/30', icon: '#f97316' }, { type: QuadrantType.GAMA, color: 'text-blue-400', bColor: 'border-blue-500/30', icon: '#60a5fa' }, { type: QuadrantType.DELTA, color: 'text-zinc-400', bColor: 'border-white/10', icon: '#000000' }].map(q => (<button key={q.type} onClick={() => handleJump(q.type)} className={`flex flex-col items-center justify-center py-8 border transition-all gap-4 rounded-lg ${gameState.currentQuadrant === q.type ? 'bg-blue-500/10 ' + q.bColor + ' shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}><div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${q.type === QuadrantType.DELTA ? 'bg-black border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : ''}`} style={{ backgroundColor: q.icon }}>{q.type === QuadrantType.DELTA && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}</div><div className={`retro-font text-[9px] ${q.color} uppercase tracking-widest`}>{q.type}</div></button>))}</div>
            <button onClick={() => setIsWarpDialogOpen(false)} className="w-full py-4 bg-red-500/5 text-red-400/80 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 transition-all retro-font text-[10px] uppercase rounded-lg shadow-lg">Abort Sequence</button>
          </div>
        </div>
      )}
      {isLoading && <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-2xl flex items-center justify-center"><div className="retro-font text-emerald-500 text-xs animate-pulse tracking-[0.8em] uppercase">Synchronizing Fleet Uplink...</div></div>}
    </div>
  );
};

// --- MAP SCREEN COMPONENT ---

const MapScreen = ({ planets, onArrival, currentQuadrant, onOpenWarp, initialFocusId, pilotAvatar, pilotName, selectedShipId, shipColors, onReturnHome, autoDock }: any) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(initialFocusId || null);
  const [camZoom, setCamZoom] = useState(0.01); 
  const [camOffset, setCamOffset] = useState({ x: 100, y: 0 }); 
  const [isScanning, setIsScanning] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [isIntroZooming, setIsIntroZooming] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const radiusRange = useMemo(() => { if (planets.length === 0) return { min: 1, max: 1000 }; const r = planets.map((p: any) => p.orbitRadius); return { min: Math.min(...r), max: Math.max(...r) }; }, [planets]);
  const planetOffsets = useMemo(() => { return planets.reduce((acc: any, p: any) => { acc[p.id] = { startAngle: Math.random() * Math.PI * 2, spinSpeed: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1) }; return acc; }, {}); }, [planets]);

  const SUN_COLORS: Record<string, string> = { [QuadrantType.ALFA]: '#fbbf24', [QuadrantType.BETA]: '#f97316', [QuadrantType.GAMA]: '#60a5fa', [QuadrantType.DELTA]: '#000000' };
  const currentSunColor = SUN_COLORS[currentQuadrant] || '#f97316';
  const isDelta = currentQuadrant === QuadrantType.DELTA;

  const normalizedTime = Date.now() / 1000;
  const cycleDuration = 35;
  const beamVisibleDuration = 10;
  const jetActive = (normalizedTime % cycleDuration) < beamVisibleDuration;
  const jetWobble = Math.sin(normalizedTime * 2) * 10; 
  const baseRotation = 35; 

  const SUN_OBJECT = { id: 'sun', name: isDelta ? 'SINGULARITY' : 'Sol Prime', description: isDelta ? 'A massive black hole consuming everything in its path.' : 'The massive star at the center of the sector.', status: 'neutral', size: 5.6, color: currentSunColor };

  useEffect(() => { const interval = setInterval(() => setLocalTime(t => t + 0.018), 16); return () => clearInterval(interval); }, []);

  useEffect(() => {
    const startZoom = 0.0625;
    const targetZoom = 0.15625; 
    setCamZoom(startZoom);
    setCamOffset({ x: 100, y: 50 });
    let start = Date.now();
    const duration = 3000;
    const animate = () => {
      let now = Date.now();
      let progress = Math.min((now - start) / duration, 1);
      let easeProgress = 1 - Math.pow(1 - progress, 3);
      setCamZoom(startZoom + easeProgress * (targetZoom - startZoom));
      setCamOffset({ x: 100 * (1 - easeProgress), y: 50 * (1 - easeProgress) });
      if (progress < 1) requestAnimationFrame(animate);
      else { setIsIntroZooming(false); if (autoDock && initialFocusId) setTimeout(focusAndDock, 800); }
    };
    animate();
  }, [currentQuadrant, autoDock]);

  const selectedEntity = useMemo(() => { if (selectedEntityId === 'sun') return SUN_OBJECT; return planets.find((p: any) => p.id === selectedEntityId); }, [selectedEntityId, planets, currentQuadrant, SUN_OBJECT]);
  const selectEntity = (id: string | null) => { if (isIntroZooming) return; audioService.playSfx('click'); setSelectedEntityId(id); };

  const getPlanetOrbitData = useCallback((p: any) => {
    const offsets = planetOffsets[p.id] || { startAngle: 0 };
    const distFactor = radiusRange.max === radiusRange.min ? 1 : (radiusRange.max - p.orbitRadius) / (radiusRange.max - radiusRange.min);
    const speedMultiplier = 1.0 + (0.5 * distFactor);
    const angle = localTime * (p.orbitSpeed * 4.32 * speedMultiplier) * (p.orbitDirection || 1) + offsets.startAngle;
    return { x: Math.cos(angle) * p.orbitRadius * 6, y: Math.sin(angle) * p.orbitRadius * 6, angle };
  }, [localTime, planetOffsets, radiusRange]);

  const focusOnSelected = useCallback(() => {
    if (!selectedEntity) return;
    let x = 0, y = 0;
    if (selectedEntity.id !== 'sun') { const data = getPlanetOrbitData(selectedEntity); x = data.x; y = data.y; }
    const targetZoom = Math.min(2.5, 60 / (selectedEntity.size * 25));
    let startZoom = camZoom; let startX = camOffset.x; let startY = camOffset.y; let start = Date.now(); const dur = 1000;
    const anim = () => { let elapsed = Date.now() - start; let p = Math.min(elapsed / dur, 1); let e = 1 - Math.pow(1 - p, 4); setCamZoom(startZoom + e * (targetZoom - startZoom)); setCamOffset({ x: startX + e * (-x - startX), y: startY + e * (-y - startY) }); if (p < 1) requestAnimationFrame(anim); };
    anim();
  }, [selectedEntity, camZoom, camOffset, getPlanetOrbitData]);

  const focusAndDock = () => { if (!initialFocusId) return; const ent = planets.find((p: any) => p.id === initialFocusId); if (ent) { setSelectedEntityId(initialFocusId); focusOnSelected(); setTimeout(() => onArrival(ent), 1500); } };
  const resetView = () => { if (isIntroZooming) return; setCamZoom(0.15625); setCamOffset({ x: 0, y: 0 }); setSelectedEntityId(null); };

  const handleMouseDown = (e: React.MouseEvent) => { if (isIntroZooming) return; const target = e.target as HTMLElement; if (target.closest('.clickable-body')) { if (selectedEntityId) { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); } } };
  const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; const dx = (e.clientX - dragStart.x) / camZoom; const dy = (e.clientY - dragStart.y) / camZoom; setCamOffset(prev => ({ x: prev.x + dx, y: prev.y + dy })); setDragStart({ x: e.clientX, y: e.clientY }); };
  const handleMouseUp = () => setIsDragging(false);

  const scrollRange = 1000; const hScrollPos = ((camOffset.x + scrollRange) / (scrollRange * 2)) * 100; const vScrollPos = ((camOffset.y + scrollRange) / (scrollRange * 2)) * 100;
  const handleHScroll = (e: React.ChangeEvent<HTMLInputElement>) => { const val = parseFloat(e.target.value); setCamOffset(prev => ({ ...prev, x: (val / 100) * (scrollRange * 2) - scrollRange })); };
  const handleVScroll = (e: React.ChangeEvent<HTMLInputElement>) => { const val = parseFloat(e.target.value); setCamOffset(prev => ({ ...prev, y: (val / 100) * (scrollRange * 2) - scrollRange })); };

  // Calculate precision dimensions for the selection reticle to keep screen-space appearance constant
  const reticleThickness = 2 / camZoom;
  const reticleOffset = 16 / camZoom; // 8px from surface (radial) = 16px diameter offset

  return (
    <div className="flex-grow w-full relative bg-[#010103] flex items-center justify-center overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <Starfield count={300} isFixed />
      <div ref={mapContainerRef} onMouseDown={handleMouseDown} className={`absolute inset-0 transition-transform duration-[400ms] cubic-bezier(0.4, 0, 0.2, 1) flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`} style={{ transform: `scale(${camZoom}) translate(${camOffset.x}px, ${camOffset.y}px)` }}>
        <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
            {/* CENTRAL STAR / SINGULARITY */}
            <div className="relative z-10 flex items-center justify-center pointer-events-none sun-container">
              {selectedEntityId === 'sun' && (
                <div 
                  className="absolute border-dashed border-emerald-400 rounded-full pointer-events-none" 
                  style={{ 
                    width: (160 + reticleOffset) + 'px', 
                    height: (160 + reticleOffset) + 'px', 
                    borderWidth: reticleThickness + 'px',
                    transform: `rotate(${localTime * 5}deg)`, 
                    zIndex: 20 
                  }} 
                />
              )}
              
              {/* SINGULARITY JET (BEHIND BLACK HOLE) */}
              {isDelta && jetActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `rotate(${baseRotation + jetWobble}deg)`, zIndex: 5 }}>
                  <div className="absolute w-2 h-[800px] bg-gradient-to-t from-blue-400 via-blue-200 to-transparent shadow-[0_0_80px_#60a5fa] blur-[1px] opacity-100 origin-bottom" style={{ bottom: '48px' }} />
                  <div className="absolute w-2 h-[800px] bg-gradient-to-b from-blue-400 via-blue-200 to-transparent shadow-[0_0_80px_#60a5fa] blur-[1px] opacity-100 origin-top" style={{ top: '48px' }} />
                  
                  {/* Pole Turbulence (Visible only when zoomed in) */}
                  {camZoom > 0.7 && (
                    <>
                      <div className="absolute w-12 h-6 bg-blue-300/30 rounded-[50%] blur-md animate-pulse-fast origin-center" style={{ bottom: '40px' }} />
                      <div className="absolute w-12 h-6 bg-blue-300/30 rounded-[50%] blur-md animate-pulse-fast origin-center" style={{ top: '40px' }} />
                      <div className="absolute w-20 h-4 bg-white/20 rounded-[50%] blur-xl animate-distort" style={{ bottom: '44px' }} />
                      <div className="absolute w-20 h-4 bg-white/20 rounded-[50%] blur-xl animate-distort" style={{ top: '44px' }} />
                    </>
                  )}
                </div>
              )}

              {/* EVENT HORIZON */}
              <div 
                className={`clickable-body w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto transition-all ${selectedEntityId === 'sun' ? 'cursor-grab' : 'hover:scale-105'}`} 
                onClick={(e) => { e.stopPropagation(); selectEntity('sun'); }} 
                style={{ 
                    backgroundColor: isDelta ? '#000' : currentSunColor, 
                    boxShadow: isDelta ? `0 0 120px rgba(255,140,0,0.3), 0 0 50px rgba(96,165,250,0.15), inset 0 0 80px rgba(255,255,255,0.08)` : `0 0 180px ${currentSunColor}, 0 0 60px white, 0 0 300px ${currentSunColor}44`,
                    zIndex: 10
                }}
              >
                {isDelta && <div className="absolute w-[350%] h-[60%] bg-[radial-gradient(ellipse_at_center,rgba(255,165,0,0.25)_0%,transparent_70%)] blur-3xl animate-spin-slow opacity-90" style={{ animationDuration: '18s' }} />}
                {isDelta && <div className="absolute w-[220%] h-[220%] bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,165,0,0.1)_50%,transparent_100%)] opacity-35 animate-spin" style={{ animationDuration: '8s' }} />}
                <div className="w-full h-full rounded-full animate-pulse bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7)_0%,transparent_70%)] opacity-20" />
              </div>
            </div>

            {planets.map((p: any) => {
              const { x, y } = getPlanetOrbitData(p);
              const offsets = planetOffsets[p.id] || { spinSpeed: 0 };
              const selfRotation = localTime * offsets.spinSpeed * 20;
              const visualSize = p.size * 25;
              const isSelected = selectedEntityId === p.id;
              return (
                <React.Fragment key={p.id}>
                    <div className="absolute border border-white/5 rounded-full pointer-events-none" style={{ width: p.orbitRadius * 12 + 'px', height: p.orbitRadius * 12 + 'px' }} />
                    <div className="absolute z-20 pointer-events-none planet-container" style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}>
                      {isSelected && (
                        <div 
                          className="absolute border-dashed border-emerald-400 rounded-full" 
                          style={{ 
                            width: (visualSize + reticleOffset) + 'px', 
                            height: (visualSize + reticleOffset) + 'px', 
                            borderWidth: reticleThickness + 'px',
                            top: '50%', 
                            left: '50%', 
                            transform: `translate(-50%, -50%) rotate(${localTime * 10}deg)`, 
                            zIndex: 20 
                          }} 
                        />
                      )}
                      {p.moons && p.moons.map((m: any, idx: number) => {
                        const baseMoonSpeed = 4.0;
                        let speedMultiplier = 1.0;
                        if (idx === 0) speedMultiplier = 0.5;
                        else if (idx === 1) speedMultiplier = 0.2;
                        else if (idx === 2) speedMultiplier = 0.0;
                        const moonAngle = localTime * baseMoonSpeed * speedMultiplier * (m.orbitDirection || 1) + (m.angle * (Math.PI / 180));
                        const mx = Math.cos(moonAngle) * m.distance;
                        const my = Math.sin(moonAngle) * m.distance;
                        const moonVisualSize = m.size * 25;
                        return (
                          <React.Fragment key={m.id}>
                            <div className="absolute border border-white/5 rounded-full" style={{ width: m.distance * 2 + 'px', height: m.distance * 2 + 'px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                            <div className="absolute rounded-full border border-black/30" style={{ width: moonVisualSize + 'px', height: moonVisualSize + 'px', backgroundColor: m.color || '#94a3b8', left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`, boxShadow: 'inset -2px -2px 5px rgba(0,0,0,0.5)' }} />
                          </React.Fragment>
                        );
                      })}
                      <div onClick={(e) => { e.stopPropagation(); selectEntity(p.id); }} className={`clickable-body relative rounded-full cursor-pointer transition-all border-2 border-transparent overflow-hidden pointer-events-auto ${isSelected ? 'cursor-grab' : 'hover:border-white/40'}`} style={{ width: visualSize + 'px', height: visualSize + 'px', backgroundColor: p.color, boxShadow: isSelected ? '0 0 40px rgba(16, 185, 129, 0.4)' : '0 0 15px rgba(0,0,0,0.6)' }}>
                          <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 10px, rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 20px)', transform: `rotate(${selfRotation}deg)` }} />
                          <div className="absolute inset-0 shadow-[inset_-6px_-6px_20px_rgba(0,0,0,0.6),inset_6px_6px_15px_rgba(255,255,255,0.25)]" />
                          {p.hasRings && <div className="absolute inset-[-65%] border-4 border-zinc-400/20 rounded-full rotate-[35deg] shadow-[0_0_20px_rgba(255,255,255,0.05)]" />}
                      </div>
                    </div>
                </React.Fragment>
              );
            })}
        </div>
      </div>
      <div className="absolute left-6 top-1/2 -translate-y-1/2 h-[60vh] w-6 flex flex-col items-center z-50"><div className="w-[1px] h-full bg-white/10" /><input type="range" orientation="vertical" min="0" max="100" value={vScrollPos} onChange={handleVScroll} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ appearance: 'slider-vertical' as any }} /><div className="absolute w-2.5 h-12 bg-white/5 border border-white/20 rounded-full pointer-events-none backdrop-blur-xl shadow-lg" style={{ top: `${vScrollPos}%`, transform: 'translateY(-50%)' }} /></div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[60vw] h-6 flex flex-row items-center z-50"><div className="h-[1px] w-full bg-white/10" /><input type="range" min="0" max="100" value={hScrollPos} onChange={handleHScroll} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="absolute h-2.5 w-12 bg-white/5 border border-white/20 rounded-full pointer-events-none backdrop-blur-xl shadow-lg" style={{ left: `${hScrollPos}%`, transform: 'translateX(-50%)' }} /></div>
      <div className="absolute top-6 left-14 flex flex-col gap-3 z-50"><div className="flex gap-2"><button onClick={() => setCamZoom(prev => Math.min(prev + 0.2, 4))} className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 retro-font text-xs hover:bg-white/10 hover:border-white/30 rounded-lg flex items-center justify-center transition-all shadow-xl">+</button><button onClick={() => setCamZoom(prev => Math.max(prev - 0.2, 0.005))} className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 retro-font text-xs hover:bg-white/10 hover:border-white/30 rounded-lg flex items-center justify-center transition-all shadow-xl">-</button><button onClick={focusOnSelected} disabled={!selectedEntity} className={`w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center rounded-lg transition-all shadow-xl ${!selectedEntity ? 'opacity-20' : 'hover:bg-white/10 hover:border-white/30 text-emerald-400'}`} title="Focus Matrix"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button onClick={resetView} className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center rounded-lg hover:bg-white/10 hover:border-white/30 text-zinc-400 transition-all shadow-xl" title="Outer Scan"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></button></div></div>
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end pointer-events-none z-50"><div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/10 p-5 rounded-xl flex items-center gap-8 pointer-events-auto shadow-2xl"><div className="flex items-center gap-5 border-r border-white/10 pr-8"><div className="w-20 h-20 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-center text-5xl shadow-inner animate-pulse-slow">{pilotAvatar}</div><div><div className="retro-font text-[7px] text-zinc-500 uppercase tracking-[0.3em] mb-1">Sector Commander</div><div className="retro-font text-sm text-emerald-400 uppercase tracking-wide">{pilotName}</div></div></div><div className="flex items-center gap-5"><div className="w-20 h-20 bg-white/5 border border-white/10 rounded-xl p-3"><ShipIcon shape={SHIPS.find(s=>s.id === selectedShipId)?.shape || 'arrow'} color={shipColors[selectedShipId] || '#fff'} /></div><div className="flex flex-col gap-3"><button onClick={onOpenWarp} className="px-6 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 retro-font text-[9px] uppercase rounded-lg transition-all backdrop-blur-md">Jump</button>
      <button onClick={onReturnHome} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 retro-font text-[9px] uppercase rounded-lg transition-all backdrop-blur-md">Home</button></div></div></div><div className="w-[280px] md:w-80 bg-zinc-950/40 border border-white/10 p-6 flex flex-col gap-4 shadow-2xl backdrop-blur-2xl rounded-xl pointer-events-auto"><div className="flex justify-between items-center border-b border-white/10 pb-3"><span className="retro-font text-[8px] md:text-[9px] text-zinc-500 uppercase tracking-[0.3em]">Tactical Feed</span><button onClick={() => { setIsScanning(true); setTimeout(() => setIsScanning(false), 1500); audioService.playSfx('transition'); }} className={`text-emerald-400 text-[8px] md:text-[9px] retro-font uppercase transition-all ${isScanning ? 'opacity-30' : 'animate-pulse'}`}>{isScanning ? 'Streaming...' : 'Sync Feed'}</button></div><div className="flex-grow overflow-y-auto max-h-32 md:max-h-48 space-y-1.5 custom-scrollbar pr-3"><div onClick={() => selectEntity('sun')} className={`p-2 font-mono text-[10px] md:text-[11px] cursor-pointer transition-all flex justify-between uppercase rounded-lg border ${selectedEntityId === 'sun' ? 'bg-white/10 text-orange-400 border-white/10' : 'text-zinc-500 border-transparent hover:text-zinc-200'}`}><span>{SUN_OBJECT.name}</span><span className="text-orange-900/50 text-[8px] tracking-widest">[NUCLEUS]</span></div>{planets.map((p: any) => (<div key={p.id} onClick={() => selectEntity(p.id)} className={`p-2 font-mono text-[10px] md:text-[11px] cursor-pointer transition-all flex justify-between uppercase rounded-lg border ${selectedEntityId === p.id ? 'bg-white/10 text-emerald-400 border-white/10' : 'text-zinc-500 border-transparent hover:text-zinc-200'}`}><span>{p.name}</span><span className={`text-[8px] opacity-70 ${p.status === 'occupied' ? 'text-red-400' : (p.status === 'friendly' ? 'text-emerald-400' : 'text-blue-400')}`}>[{p.status}]</span></div>))}</div>{selectedEntity && (<div className="animate-in fade-in slide-in-from-bottom duration-500 space-y-4 pt-4 border-t border-white/10"><div className={`retro-font text-[9px] md:text-xs uppercase tracking-tight ${selectedEntity.id === 'sun' ? 'text-orange-400' : 'text-emerald-400'}`}>{selectedEntity.name}</div><p className="text-[8px] md:text-[10px] font-mono text-zinc-400 uppercase leading-relaxed h-12 md:h-20 overflow-y-auto custom-scrollbar pr-1">{selectedEntity.description}</p>{selectedEntity.id !== 'sun' && (<button onClick={() => onArrival(selectedEntity)} className={`w-full py-4 retro-font text-[9px] border rounded-lg uppercase transition-all shadow-xl backdrop-blur-md ${selectedEntity.status === 'friendly' ? 'bg-blue-500/5 hover:bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/40 text-emerald-300'}`}>{selectedEntity.status === 'friendly' ? 'Initiate Landing' : 'Lock Target'}</button>)}</div>)}</div></div>
      {isScanning && <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"><div className="w-full h-[1px] bg-emerald-500/20 shadow-[0_0_30px_emerald] animate-scan-line" /></div>}
      <style>{` 
        @keyframes scan-line { 0% { transform: translateY(-50vh); } 100% { transform: translateY(50vh); } } 
        .animate-scan-line { animation: scan-line 1.5s linear; } 
        input[type=range] { writing-mode: bt-lr; }
        .animate-spin-slow { animation: spin 18s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.4; } }
        @keyframes pulse-fast { 0%, 100% { transform: scale(1.0); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 0.6; } }
        .animate-pulse-fast { animation: pulse-fast 0.4s ease-in-out infinite; }
        @keyframes distort { 0%, 100% { border-radius: 50%; transform: scaleX(1); } 50% { border-radius: 40% 60% 50% 50%; transform: scaleX(1.3); } }
        .animate-distort { animation: distort 0.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
