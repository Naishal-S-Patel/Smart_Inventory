import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function hashColor(name: string): string {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
    'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500',
    'bg-rose-500', 'bg-violet-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = hashColor(name);

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white select-none shrink-0',
        bgColor,
        sizeMap[size],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
