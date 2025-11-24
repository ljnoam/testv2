import React, { useEffect, useState } from 'react';

// --- Donut Chart ---
interface DonutData {
  label: string;
  value: number;
  color: string;
}

export const DonutChart = ({ data }: { data: DonutData[] }) => {
  const [isVisible, setIsVisible] = useState(false);
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (total === 0) return (
    <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-800 rounded-full w-48 mx-auto border-4 border-slate-100 dark:border-slate-700 animate-enter">
        <span className="text-xs text-slate-400">Pas de données</span>
    </div>
  );

  return (
    <div className="relative w-52 h-52 mx-auto animate-enter">
      {/* Outer Glow Layer (Optional decorative ring) */}
      <div className="absolute inset-2 rounded-full border border-slate-100 dark:border-slate-800 opacity-50"></div>
      
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-sm">
        {data.map((slice, i) => {
          const percent = slice.value / total;
          const circumference = 2 * Math.PI * 40; // ~251.2
          const strokeDasharray = `${percent * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercent * circumference;
          
          // Animation Logic: Start with dasharray 0 (hidden) if not visible
          const initialDashArray = `0 ${circumference}`;
          
          cumulativePercent += percent;

          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={slice.color}
              strokeWidth="12"
              strokeDasharray={isVisible ? strokeDasharray : initialDashArray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" 
              className="transition-all duration-[1.5s] ease-[cubic-bezier(0.22,1,0.36,1)] hover:stroke-[14] hover:opacity-90 cursor-pointer"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`text-2xl font-bold text-slate-900 dark:text-white tracking-tighter transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {total.toLocaleString('fr-FR', {style:'currency', currency:'EUR', maximumFractionDigits:0})}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mt-1">Total</span>
      </div>
    </div>
  );
};

// --- Modern Bar Chart ---
export const BarChart = ({ data, height = 180 }: { data: { label: string, value: number }[], height?: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const max = Math.max(...data.map(d => d.value), 1); 
    
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full" style={{ height: `${height}px` }}>
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="w-full h-px bg-slate-900 dark:bg-white border-dashed"></div>
                <div className="w-full h-px bg-slate-900 dark:bg-white border-dashed"></div>
                <div className="w-full h-px bg-slate-900 dark:bg-white border-dashed"></div>
                <div className="w-full h-px bg-slate-900 dark:bg-white border-dashed"></div>
            </div>

            <div className="flex items-end justify-between space-x-3 w-full h-full pt-4 pb-6 px-1">
                {data.map((d, i) => {
                    const heightPct = (d.value / max) * 100;
                    return (
                        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                            <div className="relative w-full flex items-end justify-center h-full">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 transition-all duration-200 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-10 transform translate-y-2 group-hover:translate-y-0">
                                    {d.value.toLocaleString()}€
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-white"></div>
                                </div>
                                
                                {/* Bar */}
                                <div 
                                    className="w-full max-w-[20px] rounded-t-lg transition-all duration-[800ms] ease-out bg-gradient-to-t from-indigo-500 to-purple-400 dark:from-indigo-600 dark:to-purple-500 hover:to-purple-300 dark:hover:to-purple-400 shadow-[0_4px_10px_-2px_rgba(99,102,241,0.3)]"
                                    style={{ 
                                        height: isVisible ? `${heightPct}%` : '0%',
                                        minHeight: d.value > 0 ? (isVisible ? '6px' : '0') : '0',
                                        transitionDelay: `${i * 50}ms`
                                    }} 
                                />
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2 truncate w-full text-center group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                {d.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Area Line Chart (Cumulative) ---
export const AreaLineChart = ({ data, height = 200 }: { data: { label: string, value: number }[], height?: number }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (data.length === 0) return null;
    
    const maxVal = Math.max(...data.map(d => d.value)) * 1.1; // +10% padding
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d.value / maxVal) * 100;
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `0,100 ${points} 100,100`;

    // Simple fade-in and slide-up for the whole chart container for now
    // SVG path animation is complex without libraries
    return (
        <div className={`relative w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ height: `${height}px` }}>
             {/* Grid */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="w-full h-px bg-slate-900 dark:bg-white border-dashed"></div>
                <div className="w-full h-px bg-slate-900 dark:bg-white border-dashed"></div>
                <div className="w-full h-px bg-slate-900 dark:bg-white border-dashed"></div>
            </div>

            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible preserve-3d">
                <defs>
                    <linearGradient id="gradientArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                
                {/* Area Fill */}
                <polygon points={fillPath} fill="url(#gradientArea)" className="transition-all duration-500" />
                
                {/* Line */}
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="drop-shadow-md transition-all duration-500"
                />

                {/* Dots on points */}
                {data.length < 15 && data.map((d, i) => {
                     const x = (i / (data.length - 1)) * 100;
                     const y = 100 - (d.value / maxVal) * 100;
                     return (
                         <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r="1.5" 
                            className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-[0.5]"
                         />
                     )
                })}
            </svg>
            
            {/* Labels X Axis */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>1er</span>
                <span>Milieu</span>
                <span>Fin</span>
            </div>
        </div>
    );
};