import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconBg = 'bg-emerald-50',
  iconColor = 'text-emerald-600',
  change,
  changeType = 'neutral',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white p-5 shadow-enterprise transition-all duration-200 hover:shadow-card-hover hover:border-emerald-200/60',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'positive' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {changeType === 'negative' && <TrendingDown className="h-3 w-3 text-red-500" />}
              {changeType === 'neutral' && <Minus className="h-3 w-3 text-slate-400" />}
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  changeType === 'positive' && 'text-emerald-600',
                  changeType === 'negative' && 'text-red-500',
                  changeType === 'neutral' && 'text-slate-400'
                )}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={cn('flex items-center justify-center rounded-xl p-2.5', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}
