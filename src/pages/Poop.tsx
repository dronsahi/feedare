import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const colors = [
  { name: 'Yellow', color: '#F5D547' },
  { name: 'Green', color: '#4CAF50' },
  { name: 'Brown', color: '#8B4513' },
  { name: 'Black', color: '#1a1a1a' },
  { name: 'Red', color: '#EF4444' },
  { name: 'White', color: '#E5E5E5' },
  { name: 'Other', color: '#D4C4B0' },
];

export default function Poop() {
  const { user, loading: authLoading } = useAuth();
  const { selectedBaby, loading: babyLoading } = useBaby();
  const [todayPoops, setTodayPoops] = useState(0);
  const [occurred, setOccurred] = useState(true);
  const [selectedColor, setSelectedColor] = useState('Yellow');
  const [dateTime, setDateTime] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedBaby) {
      fetchTodayPoops();
    }
  }, [selectedBaby]);

  const fetchTodayPoops = async () => {
    if (!selectedBaby) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from('poop_entries')
      .select('id')
      .eq('baby_id', selectedBaby.id)
      .eq('occurred', true)
      .gte('date_time', today.toISOString());

    if (data) {
      setTodayPoops(data.length);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBaby) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('poop_entries').insert({
        baby_id: selectedBaby.id,
        occurred,
        colour: selectedColor,
        date_time: dateTime.toISOString(),
      });

      if (error) throw error;
      
      toast.success('Poop entry added!');
      setOccurred(true);
      setSelectedColor('Yellow');
      setDateTime(new Date());
      fetchTodayPoops();
    } catch (error) {
      toast.error('Failed to add poop entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || babyLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Coral Header */}
      <header className="bg-coral safe-area-top h-12" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Poop Tracker</h1>
          <p className="text-muted-foreground">{selectedBaby?.name}'s diaper log</p>
        </div>

        {/* Today's Count Card */}
        <Card className="p-6 bg-sage/10 border-sage/30 text-center">
          <span className="text-5xl font-bold text-sage">{todayPoops}</span>
          <p className="text-sage mt-1">poops today</p>
        </Card>

        {/* Add Poop Form */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">Add Poop Entry</h3>
          
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <div className="p-3 rounded-lg border border-input bg-background">
              {formatDateTime(dateTime)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Did poop occur?</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setOccurred(true)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  occurred
                    ? 'bg-sage text-white border-sage'
                    : 'border-border text-foreground hover:border-sage/50'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setOccurred(false)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  !occurred
                    ? 'bg-muted text-foreground border-muted'
                    : 'border-border text-foreground hover:border-muted'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {occurred && (
            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="grid grid-cols-4 gap-3">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                      selectedColor === c.name
                        ? 'border-coral bg-coral/5'
                        : 'border-transparent'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full border border-border/50"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-full bg-sage hover:bg-sage/90 text-white py-6 text-lg"
          >
            {submitting ? 'Saving...' : 'Save Poop Entry'}
          </Button>
        </Card>
      </main>

      <AdBanner />
      <BottomNav />
    </div>
  );
}
