import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Tables } from '@/integrations/supabase/types';

type Baby = Tables<'babies'>;

interface BabyContextType {
  babies: Baby[];
  selectedBaby: Baby | null;
  setSelectedBaby: (baby: Baby | null) => void;
  loading: boolean;
  addBaby: (name: string, dateOfBirth: string) => Promise<void>;
  refreshBabies: () => Promise<void>;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

export function BabyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBabies = async () => {
    if (!user) {
      setBabies([]);
      setSelectedBaby(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('babies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBabies(data || []);
      if (data && data.length > 0 && !selectedBaby) {
        setSelectedBaby(data[0]!);
      }
    } catch (error) {
      console.error('Error fetching babies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabies();
  }, [user]);

  const addBaby = async (name: string, dateOfBirth: string) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('babies')
      .insert({ name, date_of_birth: dateOfBirth, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setBabies(prev => [data, ...prev]);
      setSelectedBaby(data);
    }
  };

  return (
    <BabyContext.Provider value={{
      babies,
      selectedBaby,
      setSelectedBaby,
      loading,
      addBaby,
      refreshBabies: fetchBabies
    }}>
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  const context = useContext(BabyContext);
  if (context === undefined) {
    throw new Error('useBaby must be used within a BabyProvider');
  }
  return context;
}
