import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { BottomNav } from '@/components/BottomNav';
import { BabyHeader } from '@/components/BabyHeader';
import { ActionCard } from '@/components/ActionCard';
import { AdBanner } from '@/components/AdBanner';
import { NativeAd } from '@/components/NativeAd';
import { FeedDialog } from '@/components/dialogs/FeedDialog';
import { PoopDialog } from '@/components/dialogs/PoopDialog';
import { MeasurementDialog } from '@/components/dialogs/MeasurementDialog';
import { AddBabyDialog } from '@/components/dialogs/AddBabyDialog';
import { Milk, Baby, Ruler, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { selectedBaby, loading: babyLoading } = useBaby();
  const [feedOpen, setFeedOpen] = useState(false);
  const [poopOpen, setPoopOpen] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [addBabyOpen, setAddBabyOpen] = useState(false);

  if (authLoading || babyLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <header className="bg-card border-b border-border safe-area-top">
        <BabyHeader />
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {!selectedBaby ? (
          <div className="text-center py-12">
            <Baby className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No baby added yet</h2>
            <p className="text-muted-foreground mb-6">Add your baby to start tracking</p>
            <Button onClick={() => setAddBabyOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Baby
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <ActionCard icon={Milk} label="Feed" color="coral" onClick={() => setFeedOpen(true)} />
              <ActionCard icon={Baby} label="Poop" color="sage" onClick={() => setPoopOpen(true)} />
              <ActionCard icon={Ruler} label="Measure" color="sky" onClick={() => setMeasurementOpen(true)} />
            </div>
            <NativeAd className="mt-4" />
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
