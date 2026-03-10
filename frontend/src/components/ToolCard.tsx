'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

export default function ToolCard({ title, description, href, icon: Icon, colorClass, bgClass }: ToolCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <div className="bg-white rounded-2xl p-6 h-full border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col">
        
        {/* Subtle background glow on hover */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${bgClass} -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${bgClass}`}>
          <Icon className={`w-7 h-7 ${colorClass}`} />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">
          {title}
        </h3>
        
        <p className="text-slate-500 text-sm leading-relaxed flex-grow">
          {description}
        </p>
      </div>
    </Link>
  );
}
