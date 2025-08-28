import { useState, useEffect } from 'react';
import { useGetIdentity } from "@refinedev/core";

interface UserIdentity {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
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
    const saved = localStorage.getItem('promptFavorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing local favorites:', error);
        setFavorites([]);
      }
    }
  };

  const loadServerFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/favorites');
      
      if (response.ok) {
        const { favorites: serverFavorites } = await response.json();
        setFavorites(serverFavorites);
      } else {
        console.error('Failed to load favorites from server');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncLocalToServer = async () => {
    if (!user) return;

    const localFavorites = JSON.parse(localStorage.getItem('promptFavorites') || '[]');
    if (localFavorites.length === 0) return;

    // Add each local favorite to server
    for (const promptId of localFavorites) {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptId })
        });
      } catch (error) {
        // Ignore errors (duplicates, etc.)
      }
    }

    // Clear local storage and reload from server
    localStorage.removeItem('promptFavorites');
    await loadServerFavorites();
  };

  const toggleFavorite = async (promptId: number) => {
    const isFavorited = favorites.includes(promptId);
    
    if (user) {
      // Server operations for authenticated users
      try {
        if (isFavorited) {
          const response = await fetch(`/api/favorites?promptId=${promptId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            setFavorites(prev => prev.filter(id => id !== promptId));
          }
        } else {
          const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promptId })
          });
          
          if (response.ok) {
            setFavorites(prev => [...prev, promptId]);
          }
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    } else {
      // Local storage operations for guests
      const newFavorites = isFavorited
        ? favorites.filter(id => id !== promptId)
        : [...favorites, promptId];
      
      setFavorites(newFavorites);
      localStorage.setItem('promptFavorites', JSON.stringify(newFavorites));
    }
  };

  return {
    favorites,
    loading: loading || isLoading,
    user,
    toggleFavorite,
    isFavorite: (promptId: number) => favorites.includes(promptId)
  };
};