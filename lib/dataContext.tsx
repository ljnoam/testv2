import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  setDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './authContext';
import { isPWA, localDB, syncManager } from './offline';

// --- Types ---
export type TransactionType = 'expense' | 'income';
export type Category = string; 

export interface CategoryItem {
    id: string; 
    name: string;
    icon: string;
    color: string; 
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: Date;
  title: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number; 
  pct: number;
}

export interface Insight {
  id: string;
  type: 'alert' | 'success' | 'info';
  title: string;
  message: string;
  metric?: string;
  date: Date;
}

interface DataContextType {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgets: Budget[];
  insights: Insight[];
  categories: CategoryItem[];
  loading: boolean;
  isOfflineMode: boolean; 
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'currentAmount'>) => Promise<void>;
  addToSavings: (id: string, amount: number) => Promise<void>;
  updateBudget: (category: string, limit: number) => Promise<void>;
  addCategory: (category: CategoryItem) => Promise<void>;
  deleteCategory: (categoryName: string) => Promise<void>;
  stats: {
    income: number;
    expense: number;
    balance: number;
  };
  getCategoryStyles: (name: string) => { icon: string, color: string };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

// --- Helper for Robust Date Parsing ---
const toJSDate = (val: any): Date => {
    if (!val) return new Date();
    if (val.toDate && typeof val.toDate === 'function') return val.toDate(); // Firestore Timestamp
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') return new Date(val); // ISO String or Timestamp
    return new Date();
};

const DEFAULT_CATEGORIES_DATA: CategoryItem[] = [
    { id: 'Alimentation', name: 'Alimentation', icon: '🍔', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { id: 'Transport', name: 'Transport', icon: '🚗', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'Loisirs', name: 'Loisirs', icon: '🍿', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'Logement', name: 'Logement', icon: '🏠', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { id: 'Santé', name: 'Santé', icon: '💊', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { id: 'Salaire', name: 'Salaire', icon: '💰', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: 'Shopping', name: 'Shopping', icon: '🛍️', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
    { id: 'Autre', name: 'Autre', icon: '📄', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const isPwaMode = isPWA();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [rawBudgets, setRawBudgets] = useState<{id: string, category: string, limit: number}[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES_DATA);
  
  // Loading States
  const [loading, setLoading] = useState(true);

  // Network Listeners
  useEffect(() => {
      const handleOnline = () => {
          setIsOnline(true);
          if (isPwaMode) syncManager.processQueue();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, [isPwaMode]);

  // --- DATA LOADING STRATEGY ---
  useEffect(() => {
      if (authLoading) return;
      if (!user) {
          setTransactions([]);
          setSavingsGoals([]);
          setRawBudgets([]);
          setCategories(DEFAULT_CATEGORIES_DATA);
          setLoading(false);
          return;
      }

      setLoading(true);

      if (isPwaMode) {
          // === PWA OFFLINE-FIRST STRATEGY ===
          
          const loadLocal = async () => {
              const [txs, bgs, goals, cats] = await Promise.all([
                  localDB.getAll<Transaction>('transactions'),
                  localDB.getAll<{category: string, limit: number}>('budgets'),
                  localDB.getAll<SavingsGoal>('savings_goals'),
                  localDB.getAll<CategoryItem>('categories'),
              ]);
              
              setTransactions(txs.map(t => ({...t, date: toJSDate(t.date)})).sort((a,b) => b.date.getTime() - a.date.getTime()));
              setRawBudgets(bgs.map(b => ({ id: b.category, ...b })));
              setSavingsGoals(goals);
              if (cats.length > 0) setCategories(cats);
              
              setLoading(false); 
          };

          loadLocal();

          if (navigator.onLine) {
             const unsubT = onSnapshot(collection(db, 'users', user.uid, 'transactions'), (snap) => {
                 const docs = snap.docs.map(d => ({ 
                     id: d.id, ...d.data(), date: toJSDate(d.data().date) 
                 })) as Transaction[];
                 setTransactions(docs.sort((a,b) => b.date.getTime() - a.date.getTime()));
                 localDB.clear('transactions').then(() => {
                    docs.forEach(d => localDB.put('transactions', d));
                 });
             });

             const unsubB = onSnapshot(collection(db, 'users', user.uid, 'budgets'), (snap) => {
                 const docs = snap.docs.map(d => ({ id: d.id, category: d.id, ...d.data() })) as any;
                 setRawBudgets(docs);
                 localDB.clear('budgets').then(() => {
                    docs.forEach((d: any) => localDB.put('budgets', { category: d.category, limit: d.limit }));
                 });
             });

             const unsubG = onSnapshot(collection(db, 'users', user.uid, 'savings_goals'), (snap) => {
                 const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SavingsGoal[];
                 setSavingsGoals(docs);
                 localDB.clear('savings_goals').then(() => {
                    docs.forEach(d => localDB.put('savings_goals', d));
                 });
             });

             const unsubC = onSnapshot(doc(db, 'users', user.uid, 'settings', 'categories'), (snap) => {
                 if (snap.exists() && snap.data().items) {
                     setCategories(snap.data().items);
                     localDB.clear('categories').then(() => {
                        snap.data().items.forEach((c: CategoryItem) => localDB.put('categories', c));
                     });
                 }
             });

             syncManager.processQueue();

             return () => { unsubT(); unsubB(); unsubG(); unsubC(); };
          }

      } else {
          // === STANDARD WEB STRATEGY ===
          
          const qT = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
          const unsubT = onSnapshot(qT, (snap) => {
              setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data(), date: toJSDate(d.data().date) })) as Transaction[]);
          });

          const unsubB = onSnapshot(collection(db, 'users', user.uid, 'budgets'), (snap) => {
             setRawBudgets(snap.docs.map(d => ({ id: d.id, category: d.id, ...d.data() })) as any);
          });

          const unsubG = onSnapshot(collection(db, 'users', user.uid, 'savings_goals'), (snap) => {
             setSavingsGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })) as SavingsGoal[]);
          });

          const unsubC = onSnapshot(doc(db, 'users', user.uid, 'settings', 'categories'), (snap) => {
              if (snap.exists() && snap.data().items) setCategories(snap.data().items);
          });

          // Optimistic loading false to show skeletons/empty states while waiting for network
          setLoading(false);
          return () => { unsubT(); unsubB(); unsubG(); unsubC(); };
      }
  }, [user, authLoading, isPwaMode, isOnline]);


  // --- CRUD ACTIONS ---

  const generateId = () => doc(collection(db, 'dummy')).id;

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const newId = generateId();
    const fullTransaction = { ...t, id: newId };

    if (isPwaMode) {
        setTransactions(prev => [fullTransaction, ...prev]);
        await localDB.put('transactions', fullTransaction);
        await syncManager.queueAction({
            type: 'ADD_TRANSACTION',
            payload: fullTransaction,
            userId: user.uid
        });
    } else {
        await setDoc(doc(db, 'users', user.uid, 'transactions', newId), {
            ...t,
            date: Timestamp.fromDate(t.date)
        });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    if (isPwaMode) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        await localDB.delete('transactions', id);
        await syncManager.queueAction({
            type: 'DELETE_TRANSACTION',
            payload: { id },
            userId: user.uid
        });
    } else {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    }
  };

  const updateTransaction = async (t: Transaction) => {
    if (!user) return;
    if (isPwaMode) {
        setTransactions(prev => prev.map(old => old.id === t.id ? t : old));
        await localDB.put('transactions', t);
        await syncManager.queueAction({
            type: 'UPDATE_TRANSACTION',
            payload: t,
            userId: user.uid
        });
    } else {
        await updateDoc(doc(db, 'users', user.uid, 'transactions', t.id), {
            ...t,
            date: Timestamp.fromDate(t.date)
        });
    }
  };

  const addSavingsGoal = async (g: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    if (!user) return;
    const newId = generateId();
    const fullGoal = { ...g, id: newId, currentAmount: 0 };

    if (isPwaMode) {
        setSavingsGoals(prev => [...prev, fullGoal]);
        await localDB.put('savings_goals', fullGoal);
        await syncManager.queueAction({
            type: 'ADD_GOAL',
            payload: fullGoal,
            userId: user.uid
        });
    } else {
        await setDoc(doc(db, 'users', user.uid, 'savings_goals', newId), { ...g, currentAmount: 0 });
    }
  };

  const addToSavings = async (id: string, amount: number) => {
    if (!user) return;
    const goal = savingsGoals.find(g => g.id === id);
    if (!goal) return;
    const updated = { ...goal, currentAmount: goal.currentAmount + amount };

    if (isPwaMode) {
        setSavingsGoals(prev => prev.map(g => g.id === id ? updated : g));
        await localDB.put('savings_goals', updated);
        await syncManager.queueAction({
            type: 'UPDATE_GOAL',
            payload: { id, currentAmount: updated.currentAmount },
            userId: user.uid
        });
    } else {
        await updateDoc(doc(db, 'users', user.uid, 'savings_goals', id), {
            currentAmount: updated.currentAmount
        });
    }
  };

  const updateBudget = async (category: string, limit: number) => {
      if (!user) return;
      const payload = { category, limit };
      if (isPwaMode) {
          if (limit < 0) {
              setRawBudgets(prev => prev.filter(b => b.category !== category));
              await localDB.delete('budgets', category);
          } else {
              const exists = rawBudgets.find(b => b.category === category);
              if (exists) {
                  setRawBudgets(prev => prev.map(b => b.category === category ? { ...b, limit } : b));
              } else {
                  setRawBudgets(prev => [...prev, { id: category, category, limit }]);
              }
              await localDB.put('budgets', payload);
          }
          await syncManager.queueAction({
              type: 'UPDATE_BUDGET',
              payload,
              userId: user.uid
          });
      } else {
          if (limit < 0) {
            await deleteDoc(doc(db, 'users', user.uid, 'budgets', category));
          } else {
            await setDoc(doc(db, 'users', user.uid, 'budgets', category), payload);
          }
      }
  };

  const addCategory = async (category: CategoryItem) => {
      if (!user) return;
      const newItems = [...categories, category];
      if (isPwaMode) {
          setCategories(newItems);
          await localDB.put('categories', category); 
          await syncManager.queueAction({
              type: 'UPDATE_CATEGORIES',
              payload: newItems,
              userId: user.uid
          });
      } else {
          await setDoc(doc(db, 'users', user.uid, 'settings', 'categories'), { items: newItems });
      }
  };

  const deleteCategory = async (categoryName: string) => {
      if (!user) return;
      const newItems = categories.filter(c => c.name !== categoryName);
      if (isPwaMode) {
          setCategories(newItems);
          const catToDelete = categories.find(c => c.name === categoryName);
          if (catToDelete) await localDB.delete('categories', catToDelete.id);
          await syncManager.queueAction({
              type: 'UPDATE_CATEGORIES',
              payload: newItems,
              userId: user.uid
          });
      } else {
          await setDoc(doc(db, 'users', user.uid, 'settings', 'categories'), { items: newItems });
      }
  };

  // --- ENGINE: Calculated Logic ---

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const calculatedBudgets = useMemo(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlySpending = transactions
        .filter(t => 
            t.type === 'expense' && 
            t.date.getMonth() === currentMonth && 
            t.date.getFullYear() === currentYear
        )
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

      return rawBudgets.map(b => ({
          ...b,
          spent: monthlySpending[b.category] || 0,
          pct: b.limit > 0 ? (monthlySpending[b.category] || 0) / b.limit : 0
      }));
  }, [transactions, rawBudgets]);

  const insights = useMemo(() => {
      const results: Insight[] = [];
      const now = new Date();
      
      const getMonthTotal = (monthOffset: number) => {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
          return transactions
            .filter(t => 
                t.type === 'expense' && 
                t.date.getMonth() === targetDate.getMonth() && 
                t.date.getFullYear() === targetDate.getFullYear()
            )
            .reduce((acc, t) => acc + t.amount, 0);
      };

      const currentMonthTotal = getMonthTotal(0);
      
      calculatedBudgets.forEach(b => {
          if (b.spent > b.limit) {
              results.push({
                  id: `budget-over-${b.category}`,
                  type: 'alert',
                  title: 'Budget dépassé',
                  message: `Vous avez dépassé votre budget ${b.category} de ${(b.spent - b.limit).toFixed(0)}€.`,
                  metric: `${Math.round(b.pct * 100)}%`,
                  date: now
              });
          } else if (b.pct > 0.8) {
               results.push({
                  id: `budget-warn-${b.category}`,
                  type: 'info',
                  title: 'Attention Budget',
                  message: `Vous avez consommé 80% de votre budget ${b.category}.`,
                  metric: `${(b.limit - b.spent).toFixed(0)}€ restants`,
                  date: now
              });
          }
      });

      const lastMonthTotal = getMonthTotal(1);
      const twoMonthsAgoTotal = getMonthTotal(2);
      const threeMonthsAgoTotal = getMonthTotal(3);
      const average3Months = (lastMonthTotal + twoMonthsAgoTotal + threeMonthsAgoTotal) / 3;

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      
      if (currentDay > 5 && average3Months > 0) {
          const projection = (currentMonthTotal / currentDay) * daysInMonth;
          const diffVsAvg = projection - average3Months;
          
          if (projection > average3Months * 1.2) {
              results.push({
                  id: 'high-spending',
                  type: 'alert',
                  title: 'Dépenses élevées',
                  message: `Vos dépenses prévues (${projection.toFixed(0)}€) sont 20% plus élevées que votre moyenne habituelle.`,
                  metric: `+${Math.round((diffVsAvg/average3Months)*100)}%`,
                  date: now
              });
          }
      }
      return results;
  }, [calculatedBudgets, transactions]);

  const getCategoryStyles = (name: string) => {
      const cat = categories.find(c => c.name === name);
      return cat ? { icon: cat.icon, color: cat.color } : { icon: '🏷️', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
  };

  return (
    <DataContext.Provider value={{
      transactions,
      savingsGoals,
      budgets: calculatedBudgets,
      insights,
      categories,
      loading,
      isOfflineMode: isPwaMode && !isOnline,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      addSavingsGoal,
      addToSavings,
      updateBudget,
      addCategory,
      deleteCategory,
      stats,
      getCategoryStyles
    }}>
      {children}
    </DataContext.Provider>
  );
};