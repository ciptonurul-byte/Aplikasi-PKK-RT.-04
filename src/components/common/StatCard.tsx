import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'slate';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  trend,
  onClick,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      badge: 'text-emerald-700 dark:text-emerald-300',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    blue: {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400',
      badge: 'text-sky-700 dark:text-sky-300',
      border: 'hover:border-sky-300 dark:hover:border-sky-700',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      badge: 'text-amber-700 dark:text-amber-300',
      border: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
      badge: 'text-rose-700 dark:text-rose-300',
      border: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
      badge: 'text-purple-700 dark:text-purple-300',
      border: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    slate: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400',
      badge: 'text-slate-700 dark:text-slate-300',
      border: 'hover:border-slate-300 dark:hover:border-slate-700',
    },
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md ' + colorMap[color].border : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h4 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </h4>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color].bg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs">
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          )}
          <span
            className={`font-semibold ${
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-400">vs target periode</span>
        </div>
      )}
    </div>
  );
};
