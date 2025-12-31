import { useBaby } from '@/contexts/BabyContext';
import { calculateAge } from '@/lib/utils';
import { Baby } from 'lucide-react';

export function BabyHeader() {
  const { selectedBaby } = useBaby();

  if (!selectedBaby) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Baby className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Welcome to Feedare</h1>
          <p className="text-sm text-muted-foreground">Add your baby to get started</p>
        </div>
      </div>
    );
  }

  const age = calculateAge(selectedBaby.date_of_birth);
  const ageText = age.months > 0
    ? `${age.months} month${age.months === 1 ? '' : 's'} old`
    : `${age.weeks} week${age.weeks === 1 ? '' : 's'} old`;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Baby className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">{selectedBaby.name}</h1>
        <p className="text-sm text-muted-foreground">{ageText}</p>
      </div>
    </div>
  );
}
