import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useBaby } from '@/contexts/BabyContext';
import { toast } from 'sonner';

interface FeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedTypes = ['Breast', 'Bottle', 'Formula', 'Solid'];

export function FeedDialog({ open, onOpenChange }: FeedDialogProps) {
  const { selectedBaby } = useBaby();
  const [feedType, setFeedType] = useState('Bottle');
  const [quantity, setQuantity] = useState('');
  const [fedBy, setFedBy] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaby || !quantity) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('feed_entries').insert({
        baby_id: selectedBaby.id,
        feed_type: feedType,
        quantity: parseInt(quantity),
        fed_by: fedBy || 'Parent',
        date_time: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Feed logged successfully!');
      onOpenChange(false);
      setQuantity('');
      setFedBy('');
    } catch (error) {
      console.error('Error logging feed:', error);
      toast.error('Failed to log feed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>Log Feed</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Feed Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {feedTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={feedType === type ? 'default' : 'outline'}
                  onClick={() => setFeedType(type)}
                  className="w-full"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (ml)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="e.g., 120"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fedBy">Fed By</Label>
            <Input
              id="fedBy"
              placeholder="e.g., Mom, Dad"
              value={fedBy}
              onChange={(e) => setFedBy(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !quantity}>
            {loading ? 'Saving...' : 'Log Feed'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
