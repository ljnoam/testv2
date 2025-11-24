import React, { useState, useRef } from 'react';
import { useData, Transaction, TransactionType, CategoryItem } from '../../lib/dataContext';
import { FilterIcon, TrashIcon, SearchIcon, EditIcon, PlusIcon, CheckCircleIcon } from '../../components/ui/Icons';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

// --- Components Helpers ---

const SwipeableListItem = ({ 
  item, 
  onDelete, 
  onEdit, 
  children,
  index
}: { 
  item: Transaction; 
  onDelete: () => void; 
  onEdit: (t: Transaction) => void; 
  children: React.ReactNode;
  index: number;
}) => {
    const [offsetX, setOffsetX] = useState(0);
    const startX = useRef<number | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);
    const threshold = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        
        // Only allow swiping left (negative diff) or slightly right (bounce)
        if (diff < 0 && diff > -150) {
            setOffsetX(diff);
        }
    };

    const handleTouchEnd = () => {
        if (offsetX < -threshold) {
             setOffsetX(-120); // Keep open
        } else {
             setOffsetX(0); // Reset
        }
        startX.current = null;
    };

    return (
        <div 
          className="relative overflow-hidden mb-1 rounded-2xl animate-enter"
          style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Background Actions */}
            <div className="absolute inset-0 flex justify-end">
                <div className="w-[120px] flex">
                    <button 
                        onClick={() => { setOffsetX(0); onEdit(item); }}
                        className="w-1/2 h-full bg-indigo-500 text-white flex items-center justify-center"
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => { setOffsetX(0); onDelete(); }}
                        className="w-1/2 h-full bg-red-500 text-white flex items-center justify-center rounded-r-2xl"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Foreground Content */}
            <div 
                ref={itemRef}
                className="relative bg-white dark:bg-slate-900 z-10 transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};

export const Transactions = () => {
  const { transactions, deleteTransaction, addTransaction, updateTransaction, loading, categories, addCategory, deleteCategory, getCategoryStyles } = useData();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Transaction Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.name || 'Alimentation');
  const [type, setType] = useState<TransactionType>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Management
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-slate-100 text-slate-600');

  const colorOptions = [
      { label: 'Red', class: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { label: 'Orange', class: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
      { label: 'Amber', class: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { label: 'Green', class: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
      { label: 'Emerald', class: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { label: 'Teal', class: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
      { label: 'Blue', class: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { label: 'Indigo', class: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
      { label: 'Violet', class: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
      { label: 'Purple', class: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
      { label: 'Pink', class: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
      { label: 'Slate', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  ];

  // --- CRUD Handlers ---

  const openAddModal = () => {
      setAmount('');
      setTitle('');
      setCategory(categories[0]?.name || 'Alimentation');
      setType('expense');
      setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !title) return;
    
    setIsSubmitting(true);
    try {
        await addTransaction({
          amount: parseFloat(amount),
          title,
          category,
          type,
          date: new Date()
        });
        setIsAddModalOpen(false);
    } catch (error) {
        console.error("Error adding transaction", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const openEditModal = (t: Transaction) => {
      setSelectedTransaction(t);
      setAmount(t.amount.toString());
      setTitle(t.title);
      setCategory(t.category);
      setType(t.type);
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTransaction || !amount || !title) return;

      setIsSubmitting(true);
      try {
          await updateTransaction({
              ...selectedTransaction,
              amount: parseFloat(amount),
              title,
              category,
              type
          });
          setIsEditModalOpen(false);
          setSelectedTransaction(null);
      } catch (error) {
          console.error("Error editing", error);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Supprimer cette transaction ?")) {
          await deleteTransaction(id);
      }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCategoryName.trim()) return;
      await addCategory({
          id: newCategoryName.trim(),
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
          color: newCategoryColor
      });
      setNewCategoryName('');
      setNewCategoryIcon('🏷️');
  };

  // --- Filtering & Grouping ---
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' ? true : t.type === filterType;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const grouped = filteredTransactions.reduce((groups, transaction) => {
    if (!transaction.date) return groups;
    const date = new Date(transaction.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (date.toDateString() === today.toDateString()) dateStr = "Aujourd'hui";
    else if (date.toDateString() === yesterday.toDateString()) dateStr = "Hier";

    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 space-y-4">
             {/* Search Skeleton */}
             <Skeleton className="h-12 w-full rounded-2xl" />
             <div className="flex gap-2">
                 <Skeleton className="h-8 w-20 rounded-full" />
                 <Skeleton className="h-8 w-20 rounded-full" />
             </div>

             {/* List Skeletons */}
             {[1,2,3,4,5].map(i => (
                 <Skeleton key={i} className="h-20 w-full rounded-2xl" />
             ))}
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 font-sans relative">
      
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Header Sticky */}
      <header className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-6 pb-4 animate-enter">
         <div className="flex justify-between items-center mb-4">
             <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Historique</h1>
             <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
             >
                <EditIcon className="w-4 h-4" />
                Catégories
             </button>
         </div>

         {/* Search & Filter */}
         <div className="space-y-3">
             <div className="relative">
                <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-none rounded-2xl shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 dark:text-white transition-shadow"
                />
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             </div>

             <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                    { id: 'all', label: 'Tout' },
                    { id: 'expense', label: 'Dépenses' },
                    { id: 'income', label: 'Revenus' }
                ].map((f) => (
                    <button 
                        key={f.id}
                        onClick={() => setFilterType(f.id as any)}
                        className={`
                            px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300
                            ${filterType === f.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 scale-105' 
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'}
                        `}
                    >
                        {f.label}
                    </button>
                ))}
             </div>
         </div>
      </header>

      <main className="px-5 py-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-enter stagger-1">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <FilterIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
             </div>
             <p className="text-slate-900 dark:text-white font-medium text-lg">Aucune transaction</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items], groupIndex) => (
            <div key={date} className="mb-6 last:mb-0 relative group-date animate-enter" style={{animationDelay: `${groupIndex * 100}ms`}}>
              <div className="sticky top-[160px] z-10 inline-block mb-3 ml-1">
                  <span className="bg-slate-200/50 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 shadow-sm">
                      {date}
                  </span>
              </div>
              
              <div className="space-y-2">
                {items.map((t, index) => {
                  const styles = getCategoryStyles(t.category);
                  return (
                    <SwipeableListItem 
                        key={t.id} 
                        item={t} 
                        index={index}
                        onDelete={() => handleDelete(t.id)}
                        onEdit={openEditModal}
                    >
                        <div className="p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-colors">
                             <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${styles.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                                  {styles.icon}
                               </div>
                               <div>
                                 <p className="font-bold text-slate-900 dark:text-white text-sm">{t.title}</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t.category}</p>
                               </div>
                             </div>
                             <div className="text-right">
                                <span className={`block font-bold text-sm tracking-tight ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                </span>
                             </div>
                        </div>
                    </SwipeableListItem>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* FAB Add Transaction */}
      <button 
        onClick={openAddModal}
        className="fixed bottom-24 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-full shadow-lg shadow-black/20 hover:scale-110 active:scale-90 transition-all z-40 flex items-center justify-center animate-enter stagger-2"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* ADD / EDIT TRANSACTION MODAL */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
        title={isEditModalOpen ? "Modifier" : "Nouvelle Transaction"}
      >
        <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="space-y-6 pt-2">
           <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
                onClick={() => setType('expense')}
              >
                Dépense
              </button>
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}
                onClick={() => setType('income')}
              >
                Revenu
              </button>
           </div>

           <div className="text-center">
             <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Montant</label>
             <div className="relative inline-block w-full max-w-[200px]">
                <input 
                  type="number"
                  inputMode="decimal" // Force numeric keyboard on mobile
                  pattern="[0-9]*"
                  step="0.01"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 py-2 text-center text-4xl font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-300"
                  placeholder="0"
                  required
                  autoFocus
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 text-slate-400 text-xl font-bold">€</span>
             </div>
           </div>

           <div className="space-y-4">
               <Input 
                label="Titre" 
                placeholder="Ex: Supermarché" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                className="dark:bg-slate-800 dark:text-white dark:border-slate-700"
                />

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie</label>
                    <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                        {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                </div>
           </div>

           <div className="pt-4">
             <Button type="submit" isLoading={isSubmitting} className="h-14 text-lg">
                Confirmer
             </Button>
           </div>
        </form>
      </Modal>

      {/* MANAGE CATEGORIES MODAL */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Gérer les Catégories">
          <div className="space-y-6 pt-2 h-[60vh] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {categories.map(cat => (
                      <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-enter">
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color} text-sm`}>
                                  {cat.icon}
                              </div>
                              <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
                          </div>
                          <button 
                            onClick={() => deleteCategory(cat.name)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                              <TrashIcon className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
              </div>

              <form onSubmit={handleAddCategory} className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Nouvelle catégorie</p>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="col-span-1">
                          <input 
                            type="text"
                            placeholder="Emoji"
                            className="w-full text-center py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                            value={newCategoryIcon}
                            onChange={e => setNewCategoryIcon(e.target.value)}
                            maxLength={2}
                          />
                      </div>
                      <div className="col-span-3">
                         <Input 
                            placeholder="Nom..." 
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="mb-0 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                          />
                      </div>
                  </div>

                  <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">Couleur</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                          {colorOptions.map((opt) => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setNewCategoryColor(opt.class)}
                                className={`w-8 h-8 rounded-full shrink-0 border-2 ${opt.class} ${newCategoryColor === opt.class ? 'border-indigo-500 scale-110' : 'border-transparent'} transition-all`}
                                title={opt.label}
                              />
                          ))}
                      </div>
                  </div>

                  <Button type="submit" disabled={!newCategoryName.trim()}>
                      <PlusIcon className="w-5 h-5 mr-2" /> Ajouter
                  </Button>
              </form>
          </div>
      </Modal>
    </div>
  );
};