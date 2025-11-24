import { doc, setDoc, deleteDoc, updateDoc, collection, writeBatch, Timestamp } from 'firebase/firestore';
import { db as firestore } from './firebase';

// --- 1. PWA Detection ---
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // @ts-ignore
  const isStandalone = navigator.standalone === true;
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroidApp = document.referrer.includes('android-app://');

  return isStandalone || isDisplayStandalone || isAndroidApp;
}

// --- 2. IndexedDB Wrapper (LocalDB) ---
const DB_NAME = 'MyFinanceDB';
const DB_VERSION = 1;

class LocalDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.dbPromise = this.openDB();
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Stores
        if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('budgets')) db.createObjectStore('budgets', { keyPath: 'category' }); // using category as ID for budgets
        if (!db.objectStoreNames.contains('savings_goals')) db.createObjectStore('savings_goals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' }); // Settings/Categories
        if (!db.objectStoreNames.contains('pending_actions')) db.createObjectStore('pending_actions', { keyPath: 'id', autoIncrement: true });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Get All
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.dbPromise;
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Put (Insert/Update)
  async put(storeName: string, value: any): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Delete
  async delete(storeName: string, key: string | number): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear Store (Useful for full sync resets)
  async clear(storeName: string): Promise<void> {
     const db = await this.dbPromise;
     if (!db) return;
     return new Promise((resolve, reject) => {
       const tx = db.transaction(storeName, 'readwrite');
       const store = tx.objectStore(storeName);
       store.clear();
       tx.oncomplete = () => resolve();
     });
  }
}

export const localDB = new LocalDB();

// --- 3. Synchronization Logic ---

export type ActionType = 
  | 'ADD_TRANSACTION' | 'UPDATE_TRANSACTION' | 'DELETE_TRANSACTION'
  | 'ADD_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL'
  | 'UPDATE_BUDGET' 
  | 'UPDATE_CATEGORIES';

interface PendingAction {
  id?: number;
  type: ActionType;
  payload: any;
  userId: string;
  createdAt: number;
}

export const syncManager = {
  async queueAction(action: Omit<PendingAction, 'id' | 'createdAt'>) {
    if (!isPWA()) return; // Only PWA uses the queue
    await localDB.put('pending_actions', { ...action, createdAt: Date.now() });
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  },

  async processQueue() {
    if (!navigator.onLine) return;
    
    const queue = await localDB.getAll<PendingAction>('pending_actions');
    if (queue.length === 0) return;

    // Process sequentially to maintain order
    for (const action of queue.sort((a, b) => a.createdAt - b.createdAt)) {
      try {
        await this.executeAction(action);
        await localDB.delete('pending_actions', action.id!);
      } catch (error) {
        console.error(`Sync failed for action ${action.type}:`, error);
        // We keep it in queue to retry later, or implement a "dead letter queue" logic
        // For now, if it fails, we break the loop to preserve order dependencies
        break; 
      }
    }
  },

  async executeAction(action: PendingAction) {
    const uid = action.userId;
    const { payload } = action;

    switch (action.type) {
      case 'ADD_TRANSACTION':
        // Payload should already have an ID generated client-side
        await setDoc(doc(firestore, 'users', uid, 'transactions', payload.id), {
            ...payload,
            date: Timestamp.fromDate(new Date(payload.date))
        });
        break;

      case 'UPDATE_TRANSACTION':
        await updateDoc(doc(firestore, 'users', uid, 'transactions', payload.id), {
             ...payload,
             date: Timestamp.fromDate(new Date(payload.date))
        });
        break;

      case 'DELETE_TRANSACTION':
        await deleteDoc(doc(firestore, 'users', uid, 'transactions', payload.id));
        break;

      case 'ADD_GOAL':
        await setDoc(doc(firestore, 'users', uid, 'savings_goals', payload.id), payload);
        break;

      case 'UPDATE_GOAL':
        // Used for adding money too
        await updateDoc(doc(firestore, 'users', uid, 'savings_goals', payload.id), payload);
        break;

      case 'UPDATE_BUDGET':
        // Budget logic: if limit < 0 delete, else set
        if (payload.limit < 0) {
            await deleteDoc(doc(firestore, 'users', uid, 'budgets', payload.category));
        } else {
            await setDoc(doc(firestore, 'users', uid, 'budgets', payload.category), payload);
        }
        break;

      case 'UPDATE_CATEGORIES':
        // Always overwrite complete list
        await setDoc(doc(firestore, 'users', uid, 'settings', 'categories'), { items: payload });
        break;
    }
  }
};