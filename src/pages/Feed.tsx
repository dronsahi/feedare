import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { calculateAge, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const feedTypes = ['Breastmilk', 'Formula', 'Mixed'];

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const { selectedBaby, loading: babyLoading } = useBaby();
  const [todayFeedAmount, setTodayFeedAmount] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [feedType, setFeedType] = useState('Formula');
  const [fedBy, setFedBy] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedBaby) {
      fetchTodayFeeds();
    }
  }, [selectedBaby]);

  const fetchTodayFeeds = async () => {
    if (!selectedBaby) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from('feed_entries')
      .select('quantity')
      .eq('baby_id', selectedBaby.id)
      .gte('date_time', today.toISOString());

    if (data) {
      setTodayFeedAmount(data.reduce((sum, f) => sum + (f.quantity || 0), 0));
    }
  };

  const handleSubmit = async () => {
    if (!selectedBaby || !quantity) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feed_entries').insert({
        baby_id: selectedBaby.id,
        quantity: parseFloat(quantity),
        feed_type: feedType,
        fed_by: fedBy || 'Unknown',
        date_time: dateTime.toISOString(),
      });

      if (error) throw error;
      
      toast.success('Feed entry added!');
      setQuantity('');
      setFedBy('');
      setDateTime(new Date());
      fetchTodayFeeds();
    } catch (error) {
      toast.error('Failed to add feed entry');
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

  const age = selectedBaby ? calculateAge(selectedBaby.date_of_birth) : null;
  const targetFeed = 750;
  const feedPercentage = Math.round((todayFeedAmount / targetFeed) * 100);
  const isBelowTarget = feedPercentage < 100;

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Coral Header */}
      <header className="bg-coral safe-area-top h-12" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Tracker</h1>
          <p className="text-muted-foreground">{selectedBaby?.name}'s daily feeding log</p>
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

        {/* Add Feed Form */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">Add Feed Entry</h3>
          
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <div className="p-3 rounded-lg border border-input bg-background">
              {formatDateTime(dateTime)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quantity (ml)</Label>
            <Input
              type="number"
              placeholder="e.g., 120"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Feed Type</Label>
            <div className="flex gap-2">
              {feedTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFeedType(type)}
                  className={`px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                    feedType === type
                      ? 'bg-coral text-white border-coral'
                      : 'border-border text-foreground hover:border-coral/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fed By</Label>
            <Input
              placeholder="e.g., Mom, Dad, Grandma"
              value={fedBy}
              onChange={(e) => setFedBy(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !quantity}
            className="w-full bg-coral hover:bg-coral/90 text-white py-6 text-lg"
          >
            {submitting ? 'Saving...' : 'Save Feed Entry'}
          </Button>
        </Card>
      </main>

      <AdBanner />
      <BottomNav />
    </div>
  );
}
