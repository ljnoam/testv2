import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { useTheme } from '../../lib/themeContext';
import { useSettings } from '../../lib/settingsContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { ChevronDownIcon, EditIcon, ChevronRightIcon } from '../../components/ui/Icons';
import { Link, useNavigate } from 'react-router-dom';

const AccordionItem = ({ title, children, isOpen, onClick }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => {
  return (
    <div className="border-b border-border last:border-0">
      <button 
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-secondary/50 transition-colors rounded-lg"
      >
        <span className="font-medium text-foreground">{title}</span>
        <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="pt-2 pb-2 px-1 text-sm text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Profile = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings, updateUserProfile, exportData, deleteAccount } = useSettings();
  const navigate = useNavigate();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Edit Profile States
  const [editName, setEditName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user || !settings) return null;

  const joinDate = settings.created_at ? new Date(settings.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  }) : 'Récemment';

  const toggleAccordion = (id: string) => {
      setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    setIsSaving(true);
    try {
      await updateUserProfile(editName);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Logic (Priorité : Settings Firestore > Auth Profile > Initiale)
  const avatarSrc = settings.avatar_url || user.photoURL;

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 space-y-6 max-w-lg mx-auto">
      
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            aria-label="Retour"
        >
            <ChevronRightIcon className="w-6 h-6 rotate-180" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mon Profil</h1>
      </div>

      {/* Header Profil */}
      <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-sm border border-border flex flex-col items-center text-center relative">
        <button 
            onClick={() => {
                setEditName(user.displayName || '');
                setShowEditModal(true);
            }}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-full"
            title="Modifier le profil"
        >
            <EditIcon className="w-4 h-4" />
        </button>

        <div className="relative mb-4 group">
            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                {avatarSrc ? (
                    <img 
                        src={avatarSrc} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-3xl font-bold">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                )}
            </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-1">{settings.display_name || user.displayName || 'Utilisateur'}</h2>
        <p className="text-muted-foreground font-medium text-sm">{user.email}</p>
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
          Membre depuis {joinDate}
        </div>
      </div>

      {/* Préférences */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Préférences</h3>
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-5 space-y-4">
            <Toggle 
              checked={theme === 'dark'} 
              onChange={toggleTheme} 
              label="Mode Sombre" 
              description="Basculer entre l'apparence claire et sombre" 
            />
            <div className="h-px bg-border w-full" />
            <Toggle 
              checked={settings.analytics_opt_in} 
              onChange={(v) => updateSettings({ analytics_opt_in: v })} 
              label="Analyses & Améliorations" 
              description="Partager des statistiques anonymes pour nous aider" 
            />
        </div>
      </div>

      {/* Centre de Confidentialité */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Confidentialité & Données</h3>
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border px-5 py-2">
            
            <AccordionItem 
                title="Politique de confidentialité" 
                isOpen={openAccordion === 'privacy'} 
                onClick={() => toggleAccordion('privacy')}
            >
                <div className="space-y-3">
                    <p>Vos données sont stockées de manière sécurisée et chiffrée. Nous ne vendons pas vos informations.</p>
                    <Link to="/privacy" className="text-primary font-semibold hover:underline block">
                        Lire le document complet
                    </Link>
                </div>
            </AccordionItem>

            <AccordionItem 
                title="Conditions d'utilisation" 
                isOpen={openAccordion === 'terms'} 
                onClick={() => toggleAccordion('terms')}
            >
                <div className="space-y-3">
                    <p>En utilisant MyFinance, vous acceptez nos conditions de service régissant l'utilisation de la plateforme.</p>
                    <Link to="/terms" className="text-primary font-semibold hover:underline block">
                        Lire les CGU
                    </Link>
                </div>
            </AccordionItem>

            <AccordionItem 
                title="Exporter mes données" 
                isOpen={openAccordion === 'export'} 
                onClick={() => toggleAccordion('export')}
            >
                <div className="space-y-3">
                    <p>Récupérez une copie complète de vos transactions, budgets et paramètres au format JSON standard.</p>
                    <Button variant="outline" onClick={exportData} className="w-full justify-center">
                        Télécharger l'archive JSON
                    </Button>
                </div>
            </AccordionItem>
            
            <div className="border-b border-border last:border-0">
                <button 
                    onClick={() => toggleAccordion('delete')}
                    className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors rounded-lg group"
                >
                    <span className="font-medium text-red-600 group-hover:text-red-700">Supprimer mon compte</span>
                    <ChevronDownIcon className={`w-4 h-4 text-red-300 transition-transform duration-200 ${openAccordion === 'delete' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'delete' ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-2 pb-2 px-1 text-sm text-muted-foreground">
                        <p className="mb-3 text-red-500">Zone de danger : Cette action est irréversible.</p>
                        <Button 
                            variant="primary" 
                            className="w-full bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-none"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            Supprimer définitivement
                        </Button>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Logout */}
      <div className="pt-4">
        <Button 
            variant="secondary" 
            onClick={logout} 
            className="w-full py-4 rounded-xl text-base font-medium shadow-sm border border-border bg-card hover:bg-secondary text-foreground"
        >
            Se déconnecter
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4">MyFinance Tracker v1.3.0</p>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le profil">
        <form onSubmit={handleSaveProfile} className="space-y-6 pt-2">
            <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="relative w-20 h-20 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                    <span className="text-3xl font-bold text-slate-300">
                        {editName ? editName[0].toUpperCase() : '?'}
                    </span>
                </div>
                <p className="text-xs text-center text-muted-foreground max-w-[200px]">
                  Votre avatar sera généré automatiquement avec vos initiales (DiceBear).
                </p>
            </div>

            <Input 
                label="Nom d'affichage"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Jean Dupont"
                required
            />

            <Button type="submit" isLoading={isSaving}>Enregistrer les modifications</Button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Supprimer le compte">
         <div className="space-y-4 pt-2">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-red-800 dark:text-red-200 text-sm border border-red-100 dark:border-red-900/30">
                <strong>Attention :</strong> Cette action effacera toutes vos transactions, budgets et préférences.
            </div>
            <p className="text-sm text-muted-foreground">
                Pour confirmer, veuillez taper <strong>SUPPRIMER</strong> ci-dessous.
            </p>
            <input 
               type="text" 
               className="w-full border border-input rounded-lg p-3 bg-background text-foreground focus:ring-2 focus:ring-red-500 focus:outline-none font-bold"
               placeholder="SUPPRIMER"
               value={deleteInput}
               onChange={e => setDeleteInput(e.target.value)}
            />
            <Button 
                variant="primary" 
                className="bg-red-600 hover:bg-red-700 text-white w-full shadow-lg shadow-red-200 dark:shadow-none h-12"
                disabled={deleteInput !== 'SUPPRIMER'}
                onClick={deleteAccount}
            >
                Confirmer la suppression
            </Button>
         </div>
      </Modal>
    </div>
  );
};
