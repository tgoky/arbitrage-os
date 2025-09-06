import { useState, useEffect } from 'react';
import { useGetIdentity } from "@refinedev/core";

interface UserIdentity {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export const useAIToolFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: user, isLoading } = useGetIdentity<UserIdentity>();

  // Load favorites when user changes
  useEffect(() => {
    if (user && !isLoading) {
      loadServerFavorites();
      syncLocalToServer();
    } else if (!isLoading) {
      loadLocalFavorites();
    }
  }, [user, isLoading]);

  const loadLocalFavorites = () => {
    const saved = localStorage.getItem('aitoolFavorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing local AI tool favorites:', error);
        setFavorites([]);
      }
    }
  };

  const loadServerFavorites = async () => {
    if (!user) return;
        
    setLoading(true);
    try {
      const response = await fetch('/api/aitool-favorites');
            
      if (response.ok) {
        const { favorites: serverFavorites } = await response.json();
        setFavorites(serverFavorites);
      } else {
        console.error('Failed to load AI tool favorites from server');
      }
    } catch (error) {
      console.error('Error loading AI tool favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncLocalToServer = async () => {
    if (!user) return;

    const localFavorites = JSON.parse(localStorage.getItem('aitoolFavorites') || '[]');
    if (localFavorites.length === 0) return;

    // Add each local favorite to server
    for (const toolId of localFavorites) {
      try {
        await fetch('/api/aitool-favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            toolId,
            action: 'add'
          })
        });
      } catch (error) {
        // Ignore errors (duplicates, etc.)
      }
    }

    // Clear local storage and reload from server
    localStorage.removeItem('aitoolFavorites');
    await loadServerFavorites();
  };

  const toggleFavorite = async (toolId: string) => {
    const isFavorited = favorites.includes(toolId);
        
    if (user) {
      // Server operations for authenticated users
      try {
        if (isFavorited) {
          const response = await fetch(`/api/aitool-favorites?toolId=${toolId}`, {
            method: 'DELETE'
          });
                    
          if (response.ok) {
            setFavorites(prev => prev.filter(id => id !== toolId));
          }
        } else {
          const response = await fetch('/api/aitool-favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              toolId,
              action: 'add'
            })
          });
                    
          if (response.ok) {
            setFavorites(prev => [...prev, toolId]);
          }
        }
      } catch (error) {
        console.error('Error toggling AI tool favorite:', error);
      }
    } else {
      // Local storage operations for guests
      const newFavorites = isFavorited
        ? favorites.filter(id => id !== toolId)
        : [...favorites, toolId];
            
      setFavorites(newFavorites);
      localStorage.setItem('aitoolFavorites', JSON.stringify(newFavorites));
    }
  };

  return {
    favorites,
    loading: loading || isLoading,
    user,
    toggleFavorite,
    isFavorite: (toolId: string) => favorites.includes(toolId)
  };
};