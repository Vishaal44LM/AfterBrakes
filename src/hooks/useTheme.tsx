import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Theme = 'dark' | 'light';

export const useTheme = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Load theme from profile or localStorage
    const loadTheme = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('theme')
          .eq('id', user.id)
          .single();

        if (data?.theme) {
          setTheme(data.theme as Theme);
          applyTheme(data.theme as Theme);
        }
      } else {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
          setTheme(savedTheme);
          applyTheme(savedTheme);
        }
      }
    };

    loadTheme();
  }, [user]);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);

    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('id', user.id);
    } else {
      localStorage.setItem('theme', newTheme);
    }
  };

  return { theme, toggleTheme };
};
