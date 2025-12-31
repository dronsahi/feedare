import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBaby } from '@/contexts/BabyContext';
import { toast } from 'sonner';

interface AddBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBabyDialog({ open, onOpenChange }: AddBabyDialogProps) {
  const { addBaby } = useBaby();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dateOfBirth) return;

    setLoading(true);
    try {
      await addBaby(name, dateOfBirth);
      toast.success(`Welcome ${name}!`);
      onOpenChange(false);
      setName('');
      setDateOfBirth('');
    } catch (error) {
      console.error('Error adding baby:', error);
      toast.error('Failed to add baby');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>Add Baby</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="babyName">Baby's Name</Label>
            <Input
              id="babyName"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name || !dateOfBirth}>
            {loading ? 'Adding...' : 'Add Baby'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
