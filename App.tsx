
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import { TextSnippet, AppView, SessionRecord } from './types';
import { extractTextFromImage } from './services/geminiService';

const FAKE_RECORDS: SessionRecord[] = [
  { id: '1925757', result: 'C', winners: 304, prize: '25,881,963' },
  { id: '1925756', result: 'C', winners: 208, prize: '15,853,351' },
  { id: '1925755', result: 'B', winners: 282, prize: '17,478,762' },
  { id: '1925754', result: 'A', winners: 366, prize: '25,561,348' },
  { id: '1925753', result: 'A', winners: 405, prize: '26,627,580' },
  { id: '1925752', result: 'A', winners: 368, prize: '23,514,531' },
  { id: '1925751', result: 'C', winners: 256, prize: '17,727,506' },
  { id: '1925750', result: 'B', winners: 212, prize: '14,321,099' },
  { id: '1925749', result: 'C', winners: 288, prize: '21,005,662' },
  { id: '1925748', result: 'B', winners: 154, prize: '12,120,400' },
];

const INITIAL_SESSIONS: TextSnippet[] = [
  {
    id: 'S_LIVE',
    title: 'Live Scraper Session',
    content: 'Real-time capture active...',
    timestamp: Date.now(),
    type: 'Auto',
    records: FAKE_RECORDS
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [historySubTab, setHistorySubTab] = useState<'history' | 'my_sessions'>('history');
  const [sessionTab, setSessionTab] = useState<'history' | 'records'>('history');
  const [snippets, setSnippets] = useState<TextSnippet[]>([]);
  const [selectedSession, setSelectedSession] = useState<TextSnippet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Orbital/Scanning states
  const [scanSeconds, setScanSeconds] = useState(0);
  const [isOrbitalExpanded, setIsOrbitalExpanded] = useState(true);
  const [lastCapturedToast, setLastCapturedToast] = useState<string | null>(null);
  const [showScanArea, setShowScanArea] = useState(true);
  const [scanYOffset, setScanYOffset] = useState(480); // Closer to the bottom area like the history table
  const [isScrolling, setIsScrolling] = useState(false);
  const isDraggingArea = useRef(false);

  // Settings states
  const [scanSpeed, setScanSpeed] = useState(35);
  const [scrapingMode, setScrapingMode] = useState<'manual' | 'auto'>('auto');
  const [sessionDuration, setSessionDuration] = useState('10m');
  const [autoRestart, setAutoRestart] = useState(false);
  const [gapCoverage, setGapCoverage] = useState(true);
  const [duplicateCheck, setDuplicateCheck] = useState(true);
  const [captureAlerts, setCaptureAlerts] = useState(true);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('texthunter_pro_v4');
    if (saved) {
      setSnippets(JSON.parse(saved));
    } else {
      setSnippets(INITIAL_SESSIONS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('texthunter_pro_v4', JSON.stringify(snippets));
  }, [snippets]);

  // Simulated Scraping Cycle
  const performScan = () => {
    if (isScrolling) return;

    // Simulate "Scanned area and copy"
    const id = Math.floor(1925700 + Math.random() * 1000).toString();
    const result = (['A', 'B', 'C'] as const)[Math.floor(Math.random() * 3)];
    const winners = Math.floor(100 + Math.random() * 400);
    const prize = (Math.random() * 25000000).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const newRecord: SessionRecord = { id, result, winners, prize };

    setSnippets(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        // Find or create live session
        const liveIdx = updated.findIndex(s => s.id === 'S_LIVE');
        if (liveIdx !== -1) {
          updated[liveIdx] = {
            ...updated[liveIdx],
            records: [newRecord, ...(updated[liveIdx].records || [])].slice(0, 100),
            timestamp: Date.now()
          };
        }
      }
      return updated;
    });

    if (captureAlerts) {
      setLastCapturedToast(`ID ${id} captured from focal zone.`);
      setTimeout(() => setLastCapturedToast(null), 2000);
    }

    // Simulate "Scroll up for new data"
    setIsScrolling(true);
    setTimeout(() => setIsScrolling(false), 800);
  };

  useEffect(() => {
    let interval: number;
    if (view === AppView.ORBITAL && scrapingMode === 'auto') {
      const speedMs = 5000 - (scanSpeed * 40); // Faster speed = shorter interval
      interval = window.setInterval(() => {
        performScan();
      }, Math.max(speedMs, 1500));
    }
    return () => clearInterval(interval);
  }, [view, scrapingMode, scanSpeed, captureAlerts]);

  // General Timer
  useEffect(() => {
    let timer: number;
    if (view === AppView.ORBITAL) {
      timer = window.setInterval(() => setScanSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [view]);

  // Fixed Error: Cannot find name 'toggleDarkMode'
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  // Fixed Error: Cannot find name 'formatTimer'
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fixed Error: Cannot find name 'filteredSnippets'
  const filteredSnippets = useMemo(() => {
    if (!searchQuery.trim()) return snippets;
    const lowerQuery = searchQuery.toLowerCase();
    return snippets.filter(s => 
      s.title.toLowerCase().includes(lowerQuery) || 
      s.records?.some(r => r.id.toLowerCase().includes(lowerQuery))
    );
  }, [snippets, searchQuery]);

  // Fixed Error: Cannot find name 'stats'
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalPrizeValue = 0;
    const counts = { A: 0, B: 0, C: 0 };

    snippets.forEach(s => {
      (s.records || []).forEach(r => {
        totalItems++;
        if (counts[r.result] !== undefined) {
          counts[r.result]++;
        }
        const val = parseInt(r.prize.replace(/,/g, '')) || 0;
        totalPrizeValue += val;
      });
    });

    return {
      totalItems,
      totalPrize: totalPrizeValue.toLocaleString('en-IN'),
      counts
    };
  }, [snippets]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback("COPIED!");
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDragArea = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingArea.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const newY = Math.min(Math.max(clientY - 110, 50), window.innerHeight - 250);
    setScanYOffset(newY);
  };

  const openSessionDetail = (session: TextSnippet) => {
    setSelectedSession(session);
    setSessionTab('history');
    setView(AppView.SESSION_DETAIL);
  };

  return (
    <Layout>
      {copyFeedback && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-primary text-white px-6 py-2 rounded-full text-xs font-bold z-[100] shadow-2xl animate-bounce uppercase tracking-widest font-outfit">
          {copyFeedback}
        </div>
      )}

      {view === AppView.HOME && (
        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-8 w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center mb-16 text-center">
            <div className="w-28 h-28 bg-gradient-to-tr from-primary to-blue-400 rounded-[2rem] flex items-center justify-center ios-shadow mb-6 ring-4 ring-white dark:ring-slate-800">
              <span className="material-symbols-outlined text-white text-6xl">document_scanner</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 font-outfit">
              TextHunter <span className="text-primary">Pro</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed px-8">
              Premium screen text extractor with autonomous scraping logic.
            </p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => setView(AppView.ORBITAL)}
              className="w-full bg-primary hover:bg-blue-600 active:scale-[0.97] transition-all text-white font-bold py-6 rounded-ios text-xl shadow-xl shadow-blue-500/30 flex flex-col items-center justify-center gap-2 group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">rocket_launch</span>
                <span>START SCRAPING</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest opacity-80 font-medium font-outfit">Floating Control Center</span>
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView(AppView.HISTORY)} className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800/50 p-6 rounded-ios border border-slate-100 dark:border-slate-700/50 ios-shadow hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.95]">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl font-bold">folder_open</span>
                </div>
                <span className="font-bold text-sm uppercase">History</span>
              </button>
              <button onClick={() => setView(AppView.SETTINGS)} className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800/50 p-6 rounded-ios border border-slate-100 dark:border-slate-700/50 ios-shadow hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.95]">
                <div className="w-12 h-12 bg-purple/10 rounded-2xl flex items-center justify-center text-purple">
                  <span className="material-symbols-outlined text-2xl font-bold">settings_suggest</span>
                </div>
                <span className="font-bold text-sm uppercase">Config</span>
              </button>
            </div>
          </div>
          <div className="mt-auto py-8">
             <button onClick={toggleDarkMode} className="text-xs font-black text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-800 px-6 py-2 rounded-full active:scale-95 transition-all">Appearance</button>
          </div>
        </div>
      )}

      {view === AppView.ORBITAL && (
        <div 
          className="flex-1 game-mockup relative overflow-hidden flex flex-col animate-in zoom-in-110 duration-700"
          onMouseMove={handleDragArea}
          onMouseUp={() => isDraggingArea.current = false}
          onTouchMove={handleDragArea}
          onTouchEnd={() => isDraggingArea.current = false}
        >
          {/* Dynamic Island Overlay */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50">
            <div className="dynamic-island px-6 py-2.5 rounded-[24px] flex items-center gap-4 min-w-[200px] justify-center shadow-2xl border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_#00f2ff]"></div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90 font-outfit neon-glow-text">
                  {scrapingMode === 'auto' ? 'AUTO SCRAPE ACTIVE' : 'MANUAL CAPTURE'}
                </span>
              </div>
              <div className="w-[1px] h-3.5 bg-white/20"></div>
              <div className="text-[12px] font-mono font-bold text-neon-cyan neon-glow-text">{formatTimer(scanSeconds)}</div>
            </div>
          </div>

          {/* Floating Orbital Menu */}
          <div className={`absolute right-6 top-1/2 -translate-y-1/2 z-[100] transition-all ${isOrbitalExpanded ? 'orbit-active' : ''}`}>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="orbit-btn satellite-1">
                <div onClick={performScan} className="w-full h-full rounded-full glass-morphism neon-glow-primary flex flex-col items-center justify-center border border-white/20 active:scale-90 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[24px] text-neon-cyan icon-3d">document_scanner</span>
                  <span className="text-[6px] font-black uppercase tracking-tighter text-white/60">Scan</span>
                </div>
              </div>
              <div className="orbit-btn satellite-2">
                <div onClick={() => setView(AppView.HISTORY)} className="w-full h-full rounded-full glass-morphism neon-glow-primary flex flex-col items-center justify-center border border-white/20 active:scale-90 transition-transform cursor-pointer">
                  <span className="material-symbols-outlined text-[24px] text-white/90 icon-3d">storage</span>
                  <span className="text-[6px] font-black uppercase tracking-tighter text-white/60">Logs</span>
                </div>
              </div>
              <div className="orbit-btn satellite-3">
                <div onClick={() => setView(AppView.SETTINGS)} className="w-full h-full rounded-full glass-morphism neon-glow-primary flex flex-col items-center justify-center border border-white/20 active:scale-90 transition-transform cursor-pointer">
                  <span className="material-symbols-outlined text-[24px] text-white/90 icon-3d">tune</span>
                  <span className="text-[6px] font-black uppercase tracking-tighter text-white/60">Config</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOrbitalExpanded(!isOrbitalExpanded)}
                className="w-16 h-16 rounded-full glass-morphism flex items-center justify-center neon-glow-primary border border-white/40 relative active:scale-95 transition-all shadow-[0_0_40px_rgba(0,0,0,0.6)] z-10"
              >
                <div className="absolute inset-0 rounded-full bg-neon-cyan opacity-20 blur-xl"></div>
                <span className="th-logo text-2xl tracking-tighter font-outfit font-black">TH</span>
              </button>
            </div>
          </div>

          {/* Focal Scanning Area */}
          {showScanArea && (
            <div 
              className="absolute inset-x-0 flex flex-col items-center justify-center px-6 z-20 transition-transform duration-100"
              style={{ top: `${scanYOffset}px` }}
              onMouseDown={() => isDraggingArea.current = true}
              onTouchStart={() => isDraggingArea.current = true}
            >
              <div className={`relative w-full h-[220px] border-2 border-dashed border-neon-cyan rounded-[2rem] bg-neon-cyan/10 cursor-move shadow-[0_0_80px_rgba(0,242,255,0.3)] group backdrop-blur-sm transition-opacity ${isScrolling ? 'opacity-40' : 'opacity-100'}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/40 rounded-full"></div>
                
                <div className="absolute top-4 left-6 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                    <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest font-outfit">Neural Capture Zone</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/40 uppercase tracking-tighter">Coordinate Y: {Math.round(scanYOffset)}</span>
                </div>

                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-80 shadow-[0_0_20px_#00f2ff] animate-pulse"></div>
                
                {/* Visual Scanning Line */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-neon-cyan opacity-40 animate-bounce shadow-[0_0_15px_#00f2ff]"></div>

                {/* Accuracy Markers */}
                <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-neon-cyan rounded-tl-2xl"></div>
                <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-neon-cyan rounded-tr-2xl"></div>
                <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-neon-cyan rounded-bl-2xl"></div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-neon-cyan rounded-br-2xl"></div>
              </div>
            </div>
          )}

          {/* Scroll Simulation Feedback */}
          {isScrolling && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none animate-pulse z-[30]">
               <div className="flex flex-col items-center gap-2">
                 <span className="material-symbols-outlined text-neon-cyan text-5xl animate-bounce">stat_3</span>
                 <span className="text-neon-cyan font-black text-[11px] uppercase tracking-widest">Scrolling Data Hub...</span>
               </div>
            </div>
          )}

          {/* Capture Alerts */}
          {lastCapturedToast && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[92%] z-50 animate-in slide-in-from-bottom-10 duration-300">
              <div className="glass-morphism bg-black/90 border-l-4 border-l-neon-cyan p-5 rounded-3xl flex items-center gap-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-transparent flex items-center justify-center text-neon-cyan border border-white/10">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white text-[13px] font-black tracking-widest uppercase font-outfit">Data Logged</h4>
                  <p className="text-white/60 text-[11px] font-medium leading-tight line-clamp-1">{lastCapturedToast}</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={() => setView(AppView.HOME)} className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-red-600/30 hover:bg-red-600/50 border-2 border-red-500/50 text-white px-12 py-3.5 rounded-full text-xs font-black tracking-widest uppercase transition-all z-50 font-outfit shadow-2xl">End Scraper Session</button>
        </div>
      )}

      {view === AppView.HISTORY && (
        <div className="flex-1 flex flex-col animate-in fade-in duration-300 bg-background-light dark:bg-background-dark">
          <header className="sticky top-0 z-50 bg-[#3B66CC] px-4 pt-6 pb-0 shadow-lg shrink-0">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setView(AppView.HOME)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <span className="material-icons-round text-2xl">arrow_back_ios_new</span>
              </button>
              <h1 className="text-xl font-bold text-white tracking-tight">Intelligence Vault</h1>
              <button onClick={() => { if(confirm("Wipe history?")) setSnippets([]); }} className="p-2 -mr-2 text-white hover:bg-white/10 rounded-full transition-colors"><span className="material-icons-round text-2xl">delete_sweep</span></button>
            </div>
            <div className="flex border-b border-white/20">
              <button onClick={() => setHistorySubTab('history')} className={`flex-1 py-3 text-sm font-semibold transition-all ${historySubTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'}`}>Vault Logs</button>
              <button onClick={() => setHistorySubTab('my_sessions')} className={`flex-1 py-3 text-sm font-semibold transition-all ${historySubTab === 'my_sessions' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'}`}>Pattern Analysis</button>
            </div>
          </header>

          {historySubTab === 'history' ? (
            <>
              <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <span className="material-icons-round text-sm">search</span>
                  </span>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/50 dark:text-white" placeholder="Filter IDs..." type="text"/>
                </div>
              </div>
              <main className="flex-1 px-4 py-4 space-y-3 overflow-y-auto scrollbar-hide pb-24">
                {filteredSnippets.map((s) => (
                  <div key={s.id} onClick={() => openSessionDetail(s)} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.type === 'Auto' ? 'bg-blue-100 dark:bg-blue-900/30 text-primary' : 'bg-purple/10 text-purple'}`}>
                          <span className="material-icons-round text-2xl">{s.type === 'Auto' ? 'rocket' : 'history'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{s.title}</h3>
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest ${s.type === 'Auto' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{s.type}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{new Date(s.timestamp).toLocaleDateString()} at {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">chevron_right</span>
                    </div>
                  </div>
                ))}
              </main>
            </>
          ) : (
            <main className="flex-1 px-4 py-8 space-y-6 overflow-y-auto scrollbar-hide pb-24">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Logs Scraped</p>
                   <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.totalItems}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prize Pool</p>
                   <p className="text-2xl font-black text-primary tracking-tighter truncate">₹{stats.totalPrize}</p>
                </div>
              </div>
              <section className="bg-white dark:bg-slate-800 p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-xs font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest border-b border-slate-100 pb-2">Pattern Distribution</h3>
                <div className="space-y-6">
                  {(['A', 'B', 'C'] as const).map(p => (
                    <div key={p}>
                      <div className="flex justify-between text-xs font-black mb-2 uppercase tracking-widest">
                        <span className="text-slate-500">Pattern {p}</span>
                        <span>{stats.counts[p]} Nodes</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${p === 'A' ? 'bg-amber-400' : p === 'B' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${stats.totalItems > 0 ? (stats.counts[p]/stats.totalItems)*100 : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          )}
        </div>
      )}

      {view === AppView.SESSION_DETAIL && selectedSession && (
        <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark animate-in slide-in-from-right duration-300 overflow-hidden">
          {/* Screenshot Match Header */}
          <header className="px-4 py-4 flex flex-col gap-2 bg-[#3B66CC] shrink-0 ios-shadow relative">
             <div className="flex items-center justify-between">
                <button onClick={() => setView(AppView.HISTORY)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
                  <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
                </button>
                <div className="flex-1 flex justify-center gap-12">
                   <button onClick={() => setSessionTab('history')} className={`text-sm font-bold tracking-tight uppercase transition-all pb-1 relative ${sessionTab === 'history' ? 'text-white' : 'text-white/60'}`}>
                      History
                      {sessionTab === 'history' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white"></div>}
                   </button>
                   <button onClick={() => setSessionTab('records')} className={`text-sm font-bold tracking-tight uppercase transition-all pb-1 relative ${sessionTab === 'records' ? 'text-white' : 'text-white/60'}`}>
                      My
                      {sessionTab === 'records' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-white"></div>}
                   </button>
                </div>
                <div className="w-8"></div>
             </div>
          </header>

          {sessionTab === 'history' ? (
            /* Screenshot Match Table View */
            <>
              <main className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#EBF1FE] dark:bg-slate-950/50 sticky top-0 z-10">
                    <tr className="text-[11px] font-black uppercase tracking-wider text-[#4E6FB6] dark:text-slate-500 border-b border-slate-200/50 dark:border-slate-800">
                      <th className="py-4 px-8">ID</th>
                      <th className="py-4 px-2 text-center">Result</th>
                      <th className="py-4 px-2 text-center">Winners</th>
                      <th className="py-4 px-8 text-right">Prize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {(selectedSession.records || FAKE_RECORDS).map((record, idx) => (
                      <tr key={idx} className="hover:bg-[#F0F5FF] dark:hover:bg-primary/5 transition-colors">
                        <td className="py-5 px-8 font-medium text-slate-500 text-sm">{record.id}</td>
                        <td className="py-5 px-2 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                            record.result === 'C' ? 'text-[#3B66CC]' :
                            record.result === 'B' ? 'text-[#2DAF85]' :
                            'text-[#F59E0B]'
                          }`}>
                            {record.result}
                          </span>
                        </td>
                        <td className="py-5 px-2 text-center text-sm font-medium text-slate-500">{record.winners}</td>
                        <td className="py-5 px-8 text-right">
                          <div className="flex items-center justify-end gap-2 group">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">{record.prize}</span>
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[18px]">chevron_right</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </main>
              <footer className="p-6 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4 pb-10 shrink-0">
                <div className="flex gap-4">
                  <button onClick={() => handleCopy((selectedSession.records || []).map(r => r.id + ': ' + r.result).join('\n'))} className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-xl shadow-blue-500/20">Copy Logic</button>
                  <button className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all border border-slate-200 dark:border-slate-700">Export CSV</button>
                </div>
              </footer>
            </>
          ) : (
            /* Pattern Mode View */
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-surface-dark">
               <div className="px-5 py-6 shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advanced Pattern Analysis</span>
                  </div>
                  <button onClick={() => handleCopy((selectedSession.records || []).map(r => r.result).join(''))} className="px-4 py-2 bg-primary/10 text-primary font-black text-[10px] uppercase rounded-lg border border-primary/20">Copy Feed</button>
               </div>
               <div className="relative flex-1 overflow-hidden flex">
                  <main className="flex-1 overflow-y-auto scrollbar-hide px-8 py-8 pb-24">
                    <div className="pattern-grid">
                      {(selectedSession.records || FAKE_RECORDS).map((record, idx) => (
                        <div key={idx} className="relative">
                          <span className={`flex items-center justify-center w-11 h-11 rounded-full font-black text-sm border-2 ${
                            record.result === 'A' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            record.result === 'B' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                          } ${idx === 0 ? 'ring-4 ring-primary/20 border-primary shadow-xl scale-110' : ''}`}>
                            {record.result}
                          </span>
                          {idx === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-white dark:border-slate-800 rounded-full animate-bounce"></div>}
                        </div>
                      ))}
                    </div>
                  </main>
                  <div className="w-1.5 bg-slate-100 dark:bg-slate-900 mx-2 my-12 rounded-full overflow-hidden shrink-0"><div className="h-1/4 w-full bg-primary rounded-full"></div></div>
               </div>

               <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl px-6 py-6 shadow-2xl">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Logic Stream</span>
                      <div className="font-mono text-[26px] leading-none font-black tracking-tighter text-slate-900 dark:text-white truncate max-w-[220px]">
                        {(selectedSession.records || FAKE_RECORDS).map(r => r.result).join('')}
                      </div>
                    </div>
                    <button onClick={() => handleCopy((selectedSession.records || []).map(r => r.result).join(''))} className="w-14 h-14 flex items-center justify-center text-primary bg-primary/5 rounded-2xl active:scale-90 transition-all border border-primary/10">
                      <span className="material-symbols-outlined text-[32px]">content_copy</span>
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {view === AppView.SETTINGS && (
        <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark animate-in slide-in-from-right duration-300 overflow-hidden">
          <header className="sticky top-0 z-10 px-6 py-6 flex items-center justify-between blur-bg bg-white/80 dark:bg-background-dark/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setView(AppView.HOME)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors shadow-sm">
                <span className="material-icons-round text-xl">arrow_back_ios_new</span>
              </button>
              <h1 className="text-xl font-black tracking-tight uppercase">Advanced Config</h1>
            </div>
            <button onClick={() => setView(AppView.HOME)} className="text-purple font-black uppercase tracking-widest text-sm px-6 py-2 hover:bg-purple/10 rounded-xl">Save</button>
          </header>

          <main className="flex-1 px-6 py-8 space-y-8 pb-32 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-gradient-to-br from-purple/15 to-transparent border border-purple/30 shadow-xl shadow-purple/5">
              <div className="w-16 h-16 bg-purple rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-purple/40">
                <span className="material-icons-round text-white text-4xl">radar</span>
              </div>
              <div>
                <h2 className="font-black text-xl leading-tight uppercase tracking-tight">TextHunter Pro</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">v4.0.0 Autonomous Hub</p>
              </div>
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-icons-round text-purple">speed</span>
                  <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-500">Processing Intensity</h3>
                </div>
                <span className="text-[10px] font-mono bg-purple/10 px-3 py-1 rounded-full text-purple font-black">{scanSpeed}% TURBO</span>
              </div>
              <div className="bg-slate-50 dark:bg-surface-dark p-8 rounded-[2.5rem] shadow-inner border border-slate-100 dark:border-slate-800">
                <input 
                  className="w-full h-3 bg-slate-200 dark:bg-slate-900 rounded-full appearance-none cursor-pointer accent-purple" 
                  max="100" min="1" type="range" 
                  value={scanSpeed}
                  onChange={(e) => setScanSpeed(parseInt(e.target.value))}
                />
                <div className="flex justify-between mt-5 text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">
                  <span>Preserve Battery</span>
                  <span>Balanced</span>
                  <span>Max Polling</span>
                </div>
                <p className="mt-6 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold italic opacity-60">Fine-tune the neural frequency for screen content extraction.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-purple">auto_awesome</span>
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-500">Operation Mode</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 p-2 bg-slate-100 dark:bg-slate-900 rounded-[2rem]">
                <button 
                  onClick={() => setScrapingMode('manual')}
                  className={`py-4 px-6 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${scrapingMode === 'manual' ? 'bg-white dark:bg-slate-700 text-purple shadow-xl' : 'text-slate-400'}`}
                >
                  Manual
                </button>
                <button 
                  onClick={() => setScrapingMode('auto')}
                  className={`py-4 px-6 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${scrapingMode === 'auto' ? 'bg-white dark:bg-slate-700 text-purple shadow-xl' : 'text-slate-400'}`}
                >
                  Auto-Pilot
                </button>
              </div>
              {scrapingMode === 'auto' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cycle Length</p>
                  <div className="grid grid-cols-4 gap-3">
                    {['5m', '10m', '20m', '60m'].map(d => (
                      <button 
                        key={d} 
                        onClick={() => setSessionDuration(d)}
                        className={`py-3 text-[10px] font-black rounded-2xl border-2 transition-all ${sessionDuration === d ? 'border-purple bg-purple/10 text-purple' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-purple/30'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-5">
               <div className="flex items-center gap-2">
                 <span className="material-icons-round text-purple">history_toggle_off</span>
                 <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-500">Recursive Scanning</h3>
               </div>
               <div className="bg-slate-50 dark:bg-surface-dark rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                  <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                     <div>
                       <p className="font-black text-sm uppercase tracking-tight">Auto-Restart</p>
                       <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Continuous Loop</p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={autoRestart} onChange={() => setAutoRestart(!autoRestart)}/>
                        <div className="w-14 h-7 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-purple after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7 shadow-inner"></div>
                     </label>
                  </div>
                  <div className="p-6 bg-slate-100/30 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex gap-4">
                     <span className="material-icons-round text-slate-400 text-2xl">info_outline</span>
                     <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tighter opacity-70">
                        Automatically re-engages capture logic upon session expiry to ensure full data coverage.
                     </p>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                          <span className="material-symbols-outlined font-black">join_inner</span>
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">Gap Merge</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Neural Link</p>
                        </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={gapCoverage} onChange={() => setGapCoverage(!gapCoverage)}/>
                        <div className="w-14 h-7 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7 shadow-inner"></div>
                     </label>
                  </div>
               </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl transition-all hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner"><span className="material-icons-round text-2xl">content_copy</span></div>
                  <div><p className="font-black text-sm uppercase tracking-tight">ID Filter</p><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Omit Existing</p></div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={duplicateCheck} onChange={() => setDuplicateCheck(!duplicateCheck)}/>
                   <div className="w-14 h-7 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7 shadow-inner"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl transition-all hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner"><span className="material-icons-round text-2xl">vibration</span></div>
                  <div><p className="font-black text-sm uppercase tracking-tight">Feedback</p><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Haptic Alerts</p></div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={captureAlerts} onChange={() => setCaptureAlerts(!captureAlerts)}/>
                   <div className="w-14 h-7 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7 shadow-inner"></div>
                </label>
              </div>
            </section>
          </main>

          <div className="fixed bottom-0 left-0 right-0 p-8 blur-bg bg-white/60 dark:bg-background-dark/60 z-20 max-w-md mx-auto">
            <button 
              onClick={() => setView(AppView.ORBITAL)}
              className="w-full bg-purple hover:bg-purple/90 text-white font-black py-5 rounded-[2.5rem] shadow-2xl shadow-purple/40 transition-all active:scale-[0.97] flex items-center justify-center gap-3 font-outfit uppercase tracking-[0.2em] text-sm"
            >
              <span className="material-icons-round">play_arrow</span>
              Commit & Scrape
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
