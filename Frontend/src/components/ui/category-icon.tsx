import { cn } from '@/lib/utils';
import {
  Cpu, MemoryStick, HardDrive, Monitor, Headphones,
  Keyboard, Zap, Fan, Cable, Wifi, Package,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_MAP: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  'Processors': { icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Memory': { icon: MemoryStick, color: 'text-purple-600', bg: 'bg-purple-50' },
  'Storage': { icon: HardDrive, color: 'text-teal-600', bg: 'bg-teal-50' },
  'Displays': { icon: Monitor, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'Audio': { icon: Headphones, color: 'text-pink-600', bg: 'bg-pink-50' },
  'Peripherals': { icon: Keyboard, color: 'text-orange-600', bg: 'bg-orange-50' },
  'Power Units': { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  'Cooling Systems': { icon: Fan, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  'Accessories': { icon: Cable, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Networking': { icon: Wifi, color: 'text-slate-600', bg: 'bg-slate-100' },
};

interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  sm: { container: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { container: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { container: 'h-12 w-12', icon: 'h-6 w-6' },
};

export function CategoryIcon({ category, size = 'md', className, showLabel }: CategoryIconProps) {
  const config = CATEGORY_MAP[category] || { icon: Package, color: 'text-slate-500', bg: 'bg-slate-100' };
  const Icon = config.icon;
  const dims = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-lg shrink-0',
          config.bg,
          dims.container
        )}
      >
        <Icon className={cn(dims.icon, config.color)} />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-500">{category}</span>
      )}
    </div>
  );
}

export function getCategoryConfig(category: string) {
  return CATEGORY_MAP[category] || { icon: Package, color: 'text-slate-500', bg: 'bg-slate-100' };
}
