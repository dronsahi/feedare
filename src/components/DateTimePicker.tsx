import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const hours = value.getHours().toString().padStart(2, '0');
  const minutes = value.getMinutes().toString().padStart(2, '0');
  const timeValue = `${hours}:${minutes}`;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      onChange(newDate);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const newDate = new Date(value);
      newDate.setHours(h);
      newDate.setMinutes(m);
      onChange(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-auto py-3",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP 'at' p") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          initialFocus
          disabled={(date) => date > new Date()}
        />
        <div className="p-3 border-t flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="flex-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
