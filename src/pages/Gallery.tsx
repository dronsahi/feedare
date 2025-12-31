import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';

export default function Gallery() {
  return (
    <div className="min-h-screen bg-background pb-36">
      <header className="bg-card border-b border-border p-4 safe-area-top">
        <h1 className="text-xl font-semibold">Gallery</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <p className="text-muted-foreground text-center py-12">Baby photos will appear here</p>
      </main>
      <AdBanner />
      <BottomNav />
    </div>
  );
}
