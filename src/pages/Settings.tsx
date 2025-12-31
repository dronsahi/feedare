import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4 safe-area-top">
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <Button variant="destructive" className="w-full" onClick={handleSignOut}>Sign Out</Button>
      </main>
      <BottomNav />
    </div>
  );
}
