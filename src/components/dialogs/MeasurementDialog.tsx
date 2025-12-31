import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useBaby } from '@/contexts/BabyContext';
import { toast } from 'sonner';

interface MeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeasurementDialog({ open, onOpenChange }: MeasurementDialogProps) {
  const { selectedBaby } = useBaby();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaby || (!weight && !height)) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('measurements').insert({
        baby_id: selectedBaby.id,
        weight_kg: weight ? parseFloat(weight) : null,
        height_cm: height ? parseFloat(height) : null,
        notes: notes || null,
        date_time: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Measurement logged successfully!');
      onOpenChange(false);
      setWeight('');
      setHeight('');
      setNotes('');
    } catch (error) {
      console.error('Error logging measurement:', error);
      toast.error('Failed to log measurement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>Log Measurement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="e.g., 5.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              placeholder="e.g., 60"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || (!weight && !height)}>
            {loading ? 'Saving...' : 'Log Measurement'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
