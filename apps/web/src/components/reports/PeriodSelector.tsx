import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface PeriodSelectorProps {
  period: 'weekly' | 'monthly';
  year: number;
  month: number;
  week: number;
  onChange: (updates: { period?: 'weekly' | 'monthly'; year?: number; month?: number; week?: number }) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getISOWeeksInYear(year: number): number {
  const dec28 = new Date(year, 11, 28);
  const dayOfYear = Math.floor(
    (dec28.getTime() - new Date(year, 0, 1).getTime()) / 86400000
  ) + 1;
  return Math.ceil((dayOfYear - ((dec28.getDay() + 6) % 7) + 3) / 7);
}

export function PeriodSelector({ period, year, month, week, onChange }: PeriodSelectorProps) {
  const label =
    period === 'weekly'
      ? `Semana ${week} – ${MONTH_NAMES[month - 1]} ${year}`
      : `${MONTH_NAMES[month - 1]} ${year}`;

  const handlePrev = () => {
    if (period === 'monthly') {
      if (month === 1) {
        onChange({ year: year - 1, month: 12 });
      } else {
        onChange({ month: month - 1 });
      }
    } else {
      if (week === 1) {
        const prevYear = year - 1;
        onChange({ year: prevYear, week: getISOWeeksInYear(prevYear) });
      } else {
        onChange({ week: week - 1 });
      }
    }
  };

  const handleNext = () => {
    if (period === 'monthly') {
      if (month === 12) {
        onChange({ year: year + 1, month: 1 });
      } else {
        onChange({ month: month + 1 });
      }
    } else {
      const maxWeeks = getISOWeeksInYear(year);
      if (week >= maxWeeks) {
        onChange({ year: year + 1, week: 1 });
      } else {
        onChange({ week: week + 1 });
      }
    }
  };

  const handlePeriodToggle = (newPeriod: 'weekly' | 'monthly') => {
    onChange({ period: newPeriod });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 rounded-lg border p-1">
        <button
          onClick={() => handlePeriodToggle('weekly')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            period === 'weekly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Semanal
        </button>
        <button
          onClick={() => handlePeriodToggle('monthly')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            period === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Mensual
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[200px] text-center text-sm font-medium">{label}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
