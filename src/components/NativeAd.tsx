import { getAdUnitId } from '@/config/admob';

interface NativeAdProps {
  className?: string;
}

export function NativeAd({ className }: NativeAdProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Ad</span>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-muted rounded w-3/4 mb-2" />
          <div className="h-2 bg-muted/50 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 text-[10px] text-muted-foreground text-center">
        Native Ad • {getAdUnitId('native').slice(-8)}
      </div>
    </div>
  );
}
