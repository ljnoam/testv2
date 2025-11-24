import React, { useState, useMemo } from 'react';
import { useData } from '../../lib/dataContext';
import { AreaLineChart, DonutChart } from '../../components/ui/Charts';
import { CalendarIcon, TrendingUpIcon, ArrowUpRightIcon, ArrowDownLeftIcon, SparklesIcon, ChevronRightIcon } from '../../components/ui/Icons';
import { Link } from 'react-router-dom';

export const Stats = () => {
  const { transactions } = useData();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // --- 1. FILTER DATA ---
  
  // Current Month Expenses
  const currentMonthExpenses = useMemo(() => {
    return transactions.filter(t => 
        t.type === 'expense' && 
        t.date.getMonth() === currentMonth && 
        t.date.getFullYear() === currentYear
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [transactions, currentMonth, currentYear]);

  // Previous Month Expenses (for Comparison)
  const previousMonthExpenses = useMemo(() => {
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      return transactions.filter(t => 
        t.type === 'expense' && 
        t.date.getMonth() === prevDate.getMonth() && 
        t.date.getFullYear() === prevDate.getFullYear()
      );
  }, [transactions, currentMonth, currentYear]);


  // --- 2. CALCULATE METRICS ---

  const totalCurrent = currentMonthExpenses.reduce((acc, t) => acc + t.amount, 0);
  const totalPrevious = previousMonthExpenses.reduce((acc, t) => acc + t.amount, 0);

  // Comparison Logic
  const diffPercent = totalPrevious > 0 
    ? Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100) 
    : 0;
  
  // Projection Logic (Based on last 7 days average)
  const projection = useMemo(() => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const lastWeekExpenses = transactions.filter(t => 
          t.type === 'expense' && 
          t.date >= sevenDaysAgo && 
          t.date <= now
      );

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const remainingDays = daysInMonth - now.getDate();
      
      // Calculate daily avg over last 7 days (or 1 if 0 to avoid Infinity)
      const avgDaily = lastWeekExpenses.reduce((acc, t) => acc + t.amount, 0) / 7;
      
      return totalCurrent + (avgDaily * remainingDays);
  }, [transactions, totalCurrent, currentMonth, currentYear]);


  // --- 3. CHART DATA PREPARATION ---

  // Cumulative Evolution Data
  const cumulativeData = useMemo(() => {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dataPoints = [];
      let runningTotal = 0;
      
      // We only map up to today's date to avoid flat line in the future
      const limitDay = now.getDate();

      for (let day = 1; day <= limitDay; day++) {
          // Find expenses for this specific day
          const dayExpenses = currentMonthExpenses
            .filter(t => t.date.getDate() === day)
            .reduce((sum, t) => sum + t.amount, 0);
          
          runningTotal += dayExpenses;
          dataPoints.push({ label: day.toString(), value: runningTotal });
      }
      return dataPoints;
  }, [currentMonthExpenses, currentMonth, currentYear]);


  // Category Breakdown Data
  const sortedCategories = useMemo(() => {
    const breakdown = currentMonthExpenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown)
        .sort(([, a], [, b]) => b - a)
        .map(([label, value], i) => ({
        label, 
        value,
        color: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'][i % 5] || '#cbd5e1'
        }));
  }, [currentMonthExpenses]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 relative font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none"></div>

      <header className="px-6 pt-6 pb-2 sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-lg">
        <div className="flex justify-between items-center mb-6">
             <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Analyses</h1>
             <div className="text-xs font-bold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                 {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
             </div>
        </div>

        {/* AI Assistant Banner */}
        <Link to="/assistant" className="group relative w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20 mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-sm">Assistant Financier IA</h3>
                    <p className="text-indigo-100 text-xs">Obtenir une analyse intelligente</p>
                </div>
            </div>
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm relative z-10 group-active:scale-95 transition-transform">
                 <ChevronRightIcon className="w-4 h-4 text-white" />
            </div>
        </Link>

        {/* Total & Comparison Card */}
        <div className="bg-slate-900 dark:bg-slate-800 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200/50 dark:shadow-black/20 relative overflow-hidden mb-4 border border-slate-800 dark:border-slate-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Total Dépenses</span>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight mb-1">
                        {totalCurrent.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </h2>
                </div>
                
                {/* Comparison Badge */}
                <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold backdrop-blur-md border border-white/10 ${diffPercent > 0 ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                    {diffPercent > 0 ? <ArrowUpRightIcon className="w-3 h-3" /> : <ArrowDownLeftIcon className="w-3 h-3" />}
                    <span>{Math.abs(diffPercent)}% vs M-1</span>
                </div>
            </div>
        </div>
      </header>

      <main className="px-5 py-2 space-y-6">

        {/* Projection Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                     <TrendingUpIcon className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Estimation Fin de Mois</p>
                     <p className="text-xs text-slate-400">Basé sur les 7 derniers jours</p>
                 </div>
             </div>
             <div className="text-right">
                 <span className="block text-xl font-extrabold text-slate-900 dark:text-white">
                     ~{Math.round(projection).toLocaleString()} €
                 </span>
             </div>
        </div>

        {/* Cumulative Chart Container */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
           <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Évolution du mois
                </h3>
           </div>
           <div className="mt-2">
              <AreaLineChart data={cumulativeData} height={180} />
           </div>
        </div>

        {/* Breakdown Container */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
           <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Répartition
           </h3>
           
           {sortedCategories.length > 0 ? (
               <div className="flex flex-col gap-8">
                  {/* Donut centered */}
                  <div className="flex justify-center py-4">
                      <DonutChart data={sortedCategories} />
                  </div>

                  {/* List */}
                  <div className="space-y-5">
                     {sortedCategories.map((c, i) => {
                        const maxVal = Math.max(...sortedCategories.map(s => s.value));
                        const percent = Math.round((c.value / totalCurrent) * 100);
                        
                        return (
                        <div key={i} className="group">
                           <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                                    {c.label.substring(0, 1)}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white">{c.label}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{percent}% du total</p>
                                  </div>
                               </div>
                               <span className="text-sm font-bold text-slate-900 dark:text-white">{c.value.toLocaleString()} €</span>
                           </div>
                           {/* Custom Progress Bar */}
                           <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ 
                                        width: `${(c.value / maxVal) * 100}%`, 
                                        backgroundColor: c.color,
                                        boxShadow: `0 0 10px ${c.color}60`
                                    }} 
                                 />
                           </div>
                        </div>
                     )})}
                  </div>
               </div>
           ) : (
             <div className="text-center py-10">
                 <p className="text-slate-400 text-sm">Aucune donnée disponible pour ce mois.</p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};