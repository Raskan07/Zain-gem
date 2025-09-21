import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

type SummaryCardProps = {
  icon: ReactNode;
  value: ReactNode;
  title: string;
  className?: string;
  subtitle?: ReactNode;
};

export default function SummaryCard({ icon, value, title, className = '', subtitle }: SummaryCardProps) {
  const clickable = false; // keep non-clickable default for now

  return (
    <Card className={`bg-gradient-to-br from-white/6 to-white/3 border-white/10 text-white ${className}`} style={{ minWidth: 220, borderRadius: 12 }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="mr-2 flex items-center justify-center w-12 h-12 rounded-md bg-white/6">{icon}</div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl font-semibold tracking-tight">{value}</div>
            </div>
            <div className="text-sm text-gray-300 mt-1">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-2">{subtitle}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
