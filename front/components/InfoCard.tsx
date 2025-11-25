'use client';
import React from 'react';

interface InfoCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ label, value, icon }) => (
  <div className="bg-card/60 backdrop-blur-md rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
    <div className="flex items-center mb-1">
      {icon && <span className="text-muted-foreground mr-2">{icon}</span>}
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
    <p className="text-base text-foreground">{value || '—'}</p>
  </div>
);
