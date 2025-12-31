import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useBaby } from '@/contexts/BabyContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PoopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const colors = [
  { name: 'Yellow', color: '#F4D03F' },
  { name: 'Brown', color: '#8B4513' },
  { name: 'Green', color: '#27AE60' },
  { name: 'Black', color: '#2C3E50' },
];

export function PoopDialog({ open, onOpenChange }: PoopDialogProps) {
  const { selectedBaby } = useBaby();
  const [selectedColor, setSelectedColor] = useState('Yellow');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaby) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('poop_entries').insert({
        baby_id: selectedBaby.id,
        colour: selectedColor,
        occurred: true,
        date_time: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Poop logged successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error logging poop:', error);
      toast.error('Failed to log poop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>Log Poop</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Stool Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map(({ name, color }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedColor(name)}
                  className={cn(
                    "w-full aspect-square rounded-full border-4 transition-all",
                    selectedColor === name ? "border-primary scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">{selectedColor}</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Log Poop'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
