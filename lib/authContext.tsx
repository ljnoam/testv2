import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, isInitialized } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si Firebase n'est pas configuré, on arrête le chargement immédiatement
    // pour ne pas bloquer l'UI sur un spinner infini.
    if (!isInitialized) {
      console.warn("Auth provider skipping init: Firebase not configured");
      setLoading(false);
      return;
    }

    try {
      // Listener temps réel pour l'état d'authentification
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Auth listener error:", error);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    if (!isInitialized) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};