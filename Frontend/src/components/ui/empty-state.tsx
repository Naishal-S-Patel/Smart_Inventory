import { cn } from '@/lib/utils';
import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6', className)}>
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 font-medium text-center max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
