import React from 'react';
import { ChevronRight } from 'lucide-react';

interface WalletRowProps {
  name: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export function WalletRow({ name, icon, onClick }: WalletRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-[12px] group hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-100"
    >
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-center font-bold text-slate-800 text-lg group-hover:text-purple-700 transition-colors">
        {name}
      </span>
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
      </div>
    </button>
  );
}
