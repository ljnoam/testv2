import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, isInitialized } from './firebase';
import { useAuth } from './authContext';

export interface UserSettings {
  accept_cgu: boolean;
  accept_privacy: boolean;
  analytics_opt_in: boolean;
  marketing_opt_in: boolean;
  cookie_consent: boolean;
  ai_financial_consent?: boolean; // New field for AI Assistant
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface SettingsContextType {
  settings: UserSettings | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  acceptCookies: () => Promise<void>;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isInitialized) {
      setSettings(null);
      setLoading(false);
      return;
    }

    // Realtime Listener for Settings/Profile
    const ref = doc(db, 'users', user.uid, 'settings', 'preferences');
    const unsubscribe = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as UserSettings);
      } else {
        // Defaults if not exists
        const defaults: UserSettings = {
            accept_cgu: true,
            accept_privacy: true,
            analytics_opt_in: false,
            marketing_opt_in: false,
            cookie_consent: false,
            ai_financial_consent: false,
            created_at: new Date().toISOString()
        };
        try {
          await setDoc(ref, defaults);
          setSettings(defaults);
        } catch (e) {
          console.error("Error creating default settings:", e);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !isInitialized) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), newSettings, { merge: true });
    } catch (e) {
      console.error("Error updating settings", e);
      throw e;
    }
  };

  const acceptCookies = async () => {
    localStorage.setItem('cookie_consent', 'true');
    if (user && isInitialized) {
      await updateSettings({ cookie_consent: true });
    }
  };

  const updateUserProfile = async (name: string) => {
    if (!user || !isInitialized) return;
    
    // Génération automatique d'avatar (DiceBear)
    const encodedName = encodeURIComponent(name);
    const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedName}&backgroundColor=4f46e5,db2777,16a34a&textColor=ffffff`;

    try {
        // 1. Mise à jour Auth Profile
        await updateProfile(user, { 
        displayName: name, 
        photoURL: avatarUrl
        });
        
        // Reload pour l'UI
        await user.reload();

        // 2. Mise à jour Firestore
        await updateSettings({
        display_name: name,
        avatar_url: avatarUrl
        });

        // Optimistic UI update
        setSettings(prev => prev ? ({ ...prev, display_name: name, avatar_url: avatarUrl }) : null);
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
  };

  const exportData = async () => {
     console.log("Export triggered");
  };

  const deleteAccount = async () => {
     console.log("Delete triggered");
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      updateUserProfile,
      acceptCookies,
      exportData, 
      deleteAccount, 
      loading 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};