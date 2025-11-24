
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { useSettings } from '../../lib/settingsContext';
import { useData } from '../../lib/dataContext';
import { aiService, FinancialReport } from '../../lib/ai';
import { Button } from '../../components/ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckCircleIcon, RobotIcon, ChevronDownIcon, CalendarIcon, ChevronRightIcon } from '../../components/ui/Icons';
import { Skeleton } from '../../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';

const ConsentScreen = ({ onAccept, onDecline }: { onAccept: () => void, onDecline: () => void }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-enter">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800">
                    <SparklesIcon className="w-12 h-12 text-indigo-500" />
                </div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Assistant IA</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-xs mx-auto leading-relaxed text-base">
                Activez l'intelligence artificielle pour analyser vos finances et recevoir des conseils personnalisés.
            </p>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-left w-full max-w-sm mb-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    Confidentialité garantie
                </h3>
                <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                        </div>
                        <span>Analyse locale et sécurisée.</span>
                    </li>
                    <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                        </div>
                        <span><strong>Pseudonymisation :</strong> Vos données personnelles ne sont jamais exposées.</span>
                    </li>
                </ul>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <Button onClick={onAccept} className="w-full py-4 text-base font-bold shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 bg-gradient-to-r from-indigo-600 to-violet-600 border-none">
                    Activer l'assistant
                </Button>
                <button 
                    onClick={onDecline}
                    className="py-3 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    Plus tard
                </button>
            </div>
        </div>
    );
};

const ReportCard = ({ title, children, icon: Icon, colorClass, iconColorClass }: { title: string, children: React.ReactNode, icon: any, colorClass: string, iconColorClass: string }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-4 animate-enter group hover:shadow-md transition-all duration-300 relative overflow-hidden`}>
        {/* Decorative background blob */}
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5 blur-xl ${colorClass.replace('bg-', 'bg-')}`}></div>
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className={`p-2.5 rounded-xl ${iconColorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">{title}</h3>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 relative z-10">
            {children}
        </div>
    </div>
);

const ScoreGauge = ({ score }: { score: number }) => {
    // Dimensions
    const size = 200;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = 85; // Large radius to maximize space
    const circumference = 2 * Math.PI * radius;
    const percent = score / 100;
    const offset = circumference - percent * circumference;
    
    let color = "text-red-500";
    let gradientFrom = "#ef4444";
    let gradientTo = "#f87171";

    if (score > 50) {
        color = "text-yellow-500";
        gradientFrom = "#eab308";
        gradientTo = "#facc15";
    }
    if (score > 75) {
        color = "text-emerald-500";
        gradientFrom = "#10b981";
        gradientTo = "#34d399";
    }

    return (
        <div className="relative w-52 h-52 mx-auto mb-8 flex items-center justify-center select-none">
             {/* Glow behind */}
             <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ backgroundColor: gradientFrom }}></div>
             
             <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradientFrom} />
                        <stop offset="100%" stopColor={gradientTo} />
                    </linearGradient>
                </defs>
                {/* Track */}
                <circle cx={center} cy={center} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100 dark:text-slate-800" strokeLinecap="round" />
                {/* Progress */}
                <circle 
                    cx={center} cy={center} r={radius} stroke="url(#scoreGradient)" strokeWidth={strokeWidth} fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 <span className={`text-6xl font-black tracking-tighter leading-none ${color}`}>{score}</span>
                 <span className="text-xs uppercase font-bold text-slate-400 mt-2 tracking-widest">Stabilité</span>
             </div>
        </div>
    );
};

export const Assistant = () => {
    const { user } = useAuth();
    const { settings, loading: settingsLoading } = useSettings();
    const dataContext = useData();
    const navigate = useNavigate();
    
    const [analyzing, setAnalyzing] = useState(false);
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [history, setHistory] = useState<FinancialReport[]>([]);
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

    useEffect(() => {
        if (user && settings?.ai_financial_consent) {
            loadHistory();
        }
    }, [user, settings]);

    const loadHistory = async () => {
        if (!user) return;
        const h = await aiService.getHistory(user.uid);
        setHistory(h);
        if (h.length > 0 && !report) {
            setReport(h[0]); // Load latest by default
        }
    };
    
    // We access updateSettings from hook
    const { updateSettings } = useSettings();
    
    const onAcceptConsent = async () => {
         await updateSettings({ ai_financial_consent: true });
    };

    const handleDeclineConsent = async () => {
        navigate('/stats');
    };

    const handleAnalyze = async () => {
        if (!user || !settings) return;
        setAnalyzing(true);
        try {
            const newReport = await aiService.analyzeUser(user.uid, dataContext, settings);
            setReport(newReport);
            loadHistory(); // refresh history
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Une erreur est survenue");
        } finally {
            setAnalyzing(false);
        }
    };

    // --- RENDER STATES ---

    if (settingsLoading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24">
            <Skeleton className="h-64 w-full rounded-[2rem]" />
        </div>
    );

    // 1. No Consent
    if (!settings?.ai_financial_consent) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
                <header className="px-6 pt-6 flex items-center">
                    <button 
                        onClick={() => navigate('/stats')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ChevronRightIcon className="w-6 h-6 rotate-180 text-slate-500" />
                    </button>
                </header>
                <div className="pt-4">
                    <ConsentScreen onAccept={onAcceptConsent} onDecline={handleDeclineConsent} />
                </div>
            </div>
        );
    }

    // 2. Main Interface
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/20 pointer-events-none -z-10"></div>
            
            <header className="px-6 pt-6 pb-4 sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                     <button 
                        onClick={() => navigate('/stats')}
                        className="p-2 -ml-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ChevronRightIcon className="w-6 h-6 rotate-180 text-slate-800 dark:text-white" />
                    </button>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="bg-gradient-to-tr from-indigo-500 to-violet-500 text-transparent bg-clip-text">Assistant</span>
                        <SparklesIcon className="w-5 h-5 text-indigo-500" />
                    </h1>
                    <div className="flex bg-slate-200 dark:bg-slate-800 rounded-full p-1">
                        <button 
                            onClick={() => setActiveTab('current')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${activeTab === 'current' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            Actuel
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            Historique
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-5">
                {activeTab === 'history' ? (
                    <div className="space-y-3 animate-enter">
                        {history.map((h, index) => (
                            <button 
                                key={h.id} 
                                onClick={() => { setReport(h); setActiveTab('current'); }}
                                className="w-full bg-white dark:bg-slate-900 p-4 rounded-[1.2rem] border border-slate-100 dark:border-slate-800 text-left hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:shadow-md flex justify-between items-center group animate-enter"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">Rapport du {new Date(h.timestamp).toLocaleDateString()}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px]">{h.resume}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${h.score > 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : h.score > 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {h.score}
                                    </span>
                                    <ChevronDownIcon className="w-4 h-4 -rotate-90 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </button>
                        ))}
                        {history.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Aucun historique disponible.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Action Area */}
                        {!report && !analyzing && (
                             <div className="flex flex-col items-center justify-center py-12 px-4 animate-enter min-h-[50vh]">
                                <div className="relative mb-8 group">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                                    <div className="relative w-28 h-28 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform duration-500">
                                        <RobotIcon className="w-14 h-14 text-indigo-500" />
                                    </div>
                                    {/* Small badge */}
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                        IA Ready
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
                                    Assistant Financier
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs text-center leading-relaxed">
                                    Laissez l'IA analyser vos transactions récentes pour découvrir des opportunités et optimiser votre budget.
                                </p>
                                
                                <Button 
                                    onClick={handleAnalyze} 
                                    className="w-auto px-8 py-4 text-base font-bold shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 hover:scale-105 active:scale-95 transition-all bg-gradient-to-r from-indigo-600 to-violet-600 border-none rounded-2xl"
                                >
                                    <SparklesIcon className="w-5 h-5 mr-2 animate-pulse" />
                                    Lancer l'analyse
                                </Button>
                             </div>
                        )}

                        {analyzing && (
                            <div className="space-y-6 pt-10 px-2 animate-enter flex flex-col items-center">
                                <div className="relative w-20 h-20">
                                    <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <SparklesIcon className="w-8 h-8 text-indigo-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyse en cours...</h3>
                                    <p className="text-sm text-slate-500 max-w-[200px] mx-auto">Nos algorithmes examinent vos dépenses pour trouver des économies.</p>
                                </div>
                                
                                <div className="w-full space-y-4 pt-4">
                                    <Skeleton className="h-32 w-full rounded-[2rem]" />
                                    <Skeleton className="h-24 w-full rounded-[2rem]" />
                                </div>
                            </div>
                        )}

                        {report && !analyzing && (
                            <div className="space-y-6 pt-2 animate-enter pb-8">
                                {/* Score Header */}
                                <div className="text-center bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                    <ScoreGauge score={report.score} />
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                        Votre santé financière est {report.score > 75 ? 'excellente' : report.score > 50 ? 'stable' : 'fragile'} ce mois-ci.
                                    </p>
                                </div>

                                {/* Resume */}
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl -ml-10 -mb-10"></div>
                                     
                                     <div className="relative z-10">
                                        <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                                            <SparklesIcon className="w-6 h-6 text-indigo-200" /> Synthèse
                                        </h3>
                                        <p className="text-indigo-50 leading-relaxed text-sm font-medium">
                                            {report.resume}
                                        </p>
                                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3 text-xs font-medium text-indigo-200">
                                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                                <CalendarIcon className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-indigo-300 uppercase text-[10px] font-bold tracking-wider">Projection</p>
                                                <p className="text-white text-sm font-bold">{report.projection}</p>
                                            </div>
                                        </div>
                                     </div>
                                </div>

                                {/* Sections Grid */}
                                <div className="grid gap-4">
                                    {report.surveiller && report.surveiller.length > 0 && (
                                        <ReportCard title="Points de vigilance" icon={AlertTriangleIcon} colorClass="bg-red-500" iconColorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                            <ul className="space-y-3">
                                                {report.surveiller.map((item, i) => (
                                                    <li key={i} className="flex gap-3 items-start">
                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-red-500 shadow-sm shadow-red-200"></div>
                                                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </ReportCard>
                                    )}

                                    {report.opportunites && report.opportunites.length > 0 && (
                                        <ReportCard title="Opportunités" icon={CheckCircleIcon} colorClass="bg-emerald-500" iconColorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            <ul className="space-y-3">
                                                {report.opportunites.map((item, i) => (
                                                    <li key={i} className="flex gap-3 items-start">
                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                                                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </ReportCard>
                                    )}

                                    {report.conseils && report.conseils.length > 0 && (
                                        <ReportCard title="Plan d'action" icon={RobotIcon} colorClass="bg-blue-500" iconColorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                             <div className="space-y-3">
                                                {report.conseils.map((item, i) => (
                                                    <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium border border-slate-100 dark:border-slate-700 flex gap-3">
                                                        <div className="font-bold text-blue-500 opacity-50">#{i+1}</div>
                                                        <div className="text-slate-700 dark:text-slate-300">{item}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ReportCard>
                                    )}
                                </div>

                                <div className="text-center pt-8 pb-4">
                                     <Button onClick={handleAnalyze} variant="outline" className="w-auto px-8 rounded-full border-2 border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold">
                                        Lancer une nouvelle analyse
                                     </Button>
                                     <p className="text-[10px] text-slate-400 mt-6 max-w-xs mx-auto">
                                        L'IA générative peut produire des résultats imprécis. Vérifiez toujours vos comptes avant de prendre des décisions importantes.
                                     </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};
