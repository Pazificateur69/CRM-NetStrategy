'use client';
import React from 'react';

interface InfoCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ label, value, icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center mb-1">
      {icon && <span className="text-gray-500 mr-2">{icon}</span>}
      <p className="text-sm font-semibold text-gray-700">{label}</p>
    </div>
    <p className="text-base text-gray-900">{value || '—'}</p>
  </div>
);
