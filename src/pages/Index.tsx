import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';
import { NativeAd } from '@/components/NativeAd';
import { FeedDialog } from '@/components/dialogs/FeedDialog';
import { PoopDialog } from '@/components/dialogs/PoopDialog';
import { MeasurementDialog } from '@/components/dialogs/MeasurementDialog';
import { AddBabyDialog } from '@/components/dialogs/AddBabyDialog';
import { Baby, Plus, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { calculateAge } from '@/lib/utils';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { selectedBaby, loading: babyLoading } = useBaby();
  const navigate = useNavigate();
  const [feedOpen, setFeedOpen] = useState(false);
  const [poopOpen, setPoopOpen] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [addBabyOpen, setAddBabyOpen] = useState(false);
  const [todayFeeds, setTodayFeeds] = useState(0);
  const [todayPoops, setTodayPoops] = useState(0);
  const [todayFeedAmount, setTodayFeedAmount] = useState(0);

  useEffect(() => {
    if (selectedBaby) {
      fetchTodayStats();
    }
  }, [selectedBaby]);

  const fetchTodayStats = async () => {
    if (!selectedBaby) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [feedsResult, poopsResult] = await Promise.all([
      supabase
        .from('feed_entries')
        .select('quantity')
        .eq('baby_id', selectedBaby.id)
        .gte('date_time', todayISO),
      supabase
        .from('poop_entries')
        .select('id')
        .eq('baby_id', selectedBaby.id)
        .eq('occurred', true)
        .gte('date_time', todayISO)
    ]);

    if (feedsResult.data) {
      setTodayFeeds(feedsResult.data.length);
      setTodayFeedAmount(feedsResult.data.reduce((sum, f) => sum + (f.quantity || 0), 0));
    }
    if (poopsResult.data) {
      setTodayPoops(poopsResult.data.length);
    }
  };

  if (authLoading || babyLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const age = selectedBaby ? calculateAge(selectedBaby.date_of_birth) : null;
  const ageText = age 
    ? age.days < 7 
      ? `${age.days} day${age.days === 1 ? '' : 's'} old`
      : age.months > 0
        ? `${age.months} month${age.months === 1 ? '' : 's'} old`
        : `${age.days} days old`
    : '';

  const targetFeed = 750; // ml target for baby
  const feedPercentage = Math.round((todayFeedAmount / targetFeed) * 100);
  const isBelowTarget = feedPercentage < 100;

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Coral Header */}
      <header className="bg-coral safe-area-top h-12" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {!selectedBaby ? (
          <div className="text-center py-12">
            <Baby className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No baby added yet</h2>
            <p className="text-muted-foreground mb-6">Add your baby to start tracking</p>
            <Button onClick={() => setAddBabyOpen(true)} className="bg-coral hover:bg-coral/90">
              <Plus className="w-4 h-4 mr-2" /> Add Baby
            </Button>
          </div>
        ) : (
          <>
            {/* Greeting */}
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Hi, {selectedBaby.name}! 👋</h1>
              <p className="text-muted-foreground">{ageText}</p>
            </div>

            {/* Feeding Target Card */}
            <Card className={`p-4 ${isBelowTarget ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-xl font-bold ${isBelowTarget ? 'text-amber-600' : 'text-green-600'}`}>
                    {isBelowTarget ? 'Below Target' : 'On Target'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isBelowTarget ? 'Feeding is below recommended' : 'Feeding is on track'}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-sm">Today: <span className={isBelowTarget ? 'text-amber-600 font-semibold' : 'text-green-600 font-semibold'}>{todayFeedAmount}ml</span></span>
                    <span className="text-sm text-muted-foreground">Target: {targetFeed}ml</span>
                  </div>
                </div>
                <span className={`text-4xl font-bold ${isBelowTarget ? 'text-amber-500' : 'text-green-500'}`}>
                  {feedPercentage}%
                </span>
              </div>
            </Card>

            {/* Today's Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
                    <Baby className="w-5 h-5 text-coral" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Feeds</p>
                    <p className="text-2xl font-bold text-foreground">{todayFeeds}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                    <span className="text-sage text-lg">💧</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Poops</p>
                    <p className="text-2xl font-bold text-foreground">{todayPoops}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => navigate('/feed')}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-coral text-coral font-medium hover:bg-coral/5 transition-colors"
            >
              <Baby className="w-5 h-5" />
              Record Feed
            </button>

            <button
              onClick={() => navigate('/poop')}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-coral text-coral font-medium hover:bg-coral/5 transition-colors"
            >
              <span>💧</span>
              Record Poop
            </button>

            <NativeAd className="mt-2" />

            <button
              onClick={() => setMeasurementOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-coral text-coral font-medium hover:bg-coral/5 transition-colors"
            >
              <Scale className="w-5 h-5" />
              Record Weight & Height
            </button>
          </>
        )}
      </main>

      <AdBanner />
      <BottomNav />

      <FeedDialog open={feedOpen} onOpenChange={setFeedOpen} />
      <PoopDialog open={poopOpen} onOpenChange={setPoopOpen} />
      <MeasurementDialog open={measurementOpen} onOpenChange={setMeasurementOpen} />
      <AddBabyDialog open={addBabyOpen} onOpenChange={setAddBabyOpen} />
    </div>
  );
}
