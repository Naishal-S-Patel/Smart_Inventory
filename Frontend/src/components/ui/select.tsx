import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
