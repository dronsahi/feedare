import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  color?: 'coral' | 'sage' | 'sky' | 'peach';
}

const colorVariants = {
  coral: 'bg-coral/10 text-coral',
  sage: 'bg-sage/10 text-sage',
  sky: 'bg-sky/10 text-sky',
  peach: 'bg-peach/10 text-peach',
};

export function ActionCard({ icon: Icon, label, description, onClick, color = 'coral' }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border",
        "hover:shadow-md transition-all active:scale-[0.98]",
        "min-h-[100px] w-full"
      )}
    >
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-2", colorVariants[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground mt-1">{description}</span>
      )}
    </button>
  );
}
