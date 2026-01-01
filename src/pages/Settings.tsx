import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { calculateAge, formatDate } from '@/lib/utils';
import { Baby, Trash2, Cloud, LogOut, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { selectedBaby, loading: babyLoading, refreshBabies } = useBaby();
  const navigate = useNavigate();
  const [name, setName] = useState(selectedBaby?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(selectedBaby?.date_of_birth || '');
  const [updating, setUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (authLoading || babyLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const age = selectedBaby ? calculateAge(selectedBaby.date_of_birth) : null;
  const ageText = age 
    ? age.days < 30 
      ? `${age.days} days old`
      : `${age.months} month${age.months === 1 ? '' : 's'} old`
    : '';

  const handleUpdate = async () => {
    if (!selectedBaby || !name || !dateOfBirth) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('babies')
        .update({ name, date_of_birth: dateOfBirth })
        .eq('id', selectedBaby.id);

      if (error) throw error;
      
      toast.success('Baby information updated!');
      refreshBabies();
    } catch (error) {
      toast.error('Failed to update baby information');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBaby) return;

    setDeleting(true);
    try {
      // Delete all related data first
      await Promise.all([
        supabase.from('feed_entries').delete().eq('baby_id', selectedBaby.id),
        supabase.from('poop_entries').delete().eq('baby_id', selectedBaby.id),
        supabase.from('measurements').delete().eq('baby_id', selectedBaby.id),
        supabase.from('photos').delete().eq('baby_id', selectedBaby.id),
      ]);

      // Then delete the baby
      const { error } = await supabase
        .from('babies')
        .delete()
        .eq('id', selectedBaby.id);

      if (error) throw error;
      
      toast.success('Baby and all data deleted');
      setDeleteDialogOpen(false);
      refreshBabies();
    } catch (error) {
      toast.error('Failed to delete baby data');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success('Password changed successfully!');
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Coral Header */}
      <header className="bg-coral safe-area-top h-12" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Baby Setup</h1>
          <p className="text-muted-foreground">{selectedBaby?.name} • {ageText}</p>
        </div>

        {selectedBaby && (
          <>
            {/* Baby Icon */}
            <div className="flex justify-center py-4">
              <div className="w-24 h-24 rounded-full bg-coral flex items-center justify-center">
                <Baby className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Baby Info Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Baby's Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Date of Birth</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Born Info Card */}
              <Card className="p-4 bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Born on</p>
                <p className="text-lg font-semibold">{formatDate(selectedBaby.date_of_birth)}</p>
                <p className="text-sm text-muted-foreground">{age?.days} days ago</p>
              </Card>

              <Button 
                onClick={handleUpdate} 
                disabled={updating}
                className="w-full bg-coral hover:bg-coral/90 text-white py-6 text-lg"
              >
                {updating ? 'Updating...' : 'Update Information'}
              </Button>

              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-3 text-destructive font-medium"
              >
                <Trash2 className="w-5 h-5" />
                Delete Baby & All Data
              </button>
            </div>

            {/* Cloud Sync Info */}
            <Card className="p-4 bg-sage/10 border-sage/30">
              <div className="flex items-center gap-2 text-sage mb-1">
                <Cloud className="w-5 h-5" />
                <span className="font-medium">Secure cloud sync</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your baby's data is protected and syncs across devices
              </p>
            </Card>
          </>
        )}

        {/* Account Section */}
        <div className="pt-4 space-y-3">
          <h3 className="font-semibold text-lg">Account</h3>
          
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="font-medium">{user?.email}</p>
          </Card>

          <Button 
            variant="outline" 
            onClick={() => setPasswordDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Change Password
          </Button>

          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </main>

      <BottomNav />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Baby & All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedBaby?.name}'s profile and all associated data including feeds, poops, measurements, and photos. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
