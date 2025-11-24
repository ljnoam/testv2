import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { HomeIcon, ListIcon, ChartIcon, LightbulbIcon, WalletIcon } from '../ui/Icons';

export const BottomNav = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/transactions', label: 'Transac.', icon: ListIcon },
    { path: '/savings', label: 'Épargne', icon: WalletIcon },
    { path: '/stats', label: 'Stats', icon: ChartIcon },
    { path: '/insights', label: 'Budget', icon: LightbulbIcon },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] z-50 md:hidden">
      <div className="bg-card/85 dark:bg-card/75 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg rounded-full px-1 py-3 flex justify-between items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-full relative transition-all duration-300
              ${isActive ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}
            `}
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5">
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {isActive && (
                    <span className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></span>
                )}
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};