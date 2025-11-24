import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ce composant écoute les changements de route (pathname)
 * et remet instantanément la fenêtre en haut de page.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Utilisation de behavior: 'instant' pour éviter l'effet de défilement visible
    // lors du changement de page, ce qui rend la navigation plus native.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [pathname]);

  return null;
};
