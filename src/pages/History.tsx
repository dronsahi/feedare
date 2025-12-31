import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';

export default function History() {
  return (
    <div className="min-h-screen bg-background pb-36">
      <header className="bg-card border-b border-border p-4 safe-area-top">
        <h1 className="text-xl font-semibold">History</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <p className="text-muted-foreground text-center py-12">Feed and poop history will appear here</p>
      </main>
      <AdBanner />
      <BottomNav />
    </div>
  );
}
