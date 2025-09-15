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
  return (
    <Card className={`bg-white/10 border-white/20 text-white ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="mr-3">{icon}</div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{value}</div>
            </div>
            <div className="text-sm text-gray-300">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
