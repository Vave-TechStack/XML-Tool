'use client';

import ToolCard from '@/components/ToolCard';
import { useAuthStore } from '@/store/authStore';
import { 
  FileText, FileCode2, Scissors, Image as ImageIcon,
  BookOpen, Eye, SearchCode, Braces, ArrowRight, Database
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  const tools = [
    {
      title: 'PDF to XML (JATS/BITS)',
      description: 'Intelligent extraction of structural data for publishers and journals to standard XML formats.',
      href: '/pdf-to-xml',
      icon: Braces,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
    },
    {
      title: 'PDF to Word (DOCX)',
      description: 'Convert complex PDF layouts back to editable Word format with high accuracy.',
      href: '/pdf-to-word',
      icon: FileText,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
    },
    {
      title: 'Split PDF',
      description: 'Separate one page or a whole set for easy modular conversion and processing.',
      href: '/pdf-split',
      icon: Scissors,
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-100',
    },
    {
      title: 'PDF to High-Res TIFF',
      description: 'Perfect for printing protocols and archiving. Convert PDF pages to rich TIFF images.',
      href: '/pdf-to-tiff',
      icon: ImageIcon,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
    },
    {
      title: 'Advanced OCR Pipeline',
      description: 'Extract raw text, layouts, and bold/italic elements natively from scanned document pages.',
      href: '/ocr',
      icon: SearchCode,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-100',
    },
    {
      title: 'EPUB3 Generator',
      description: 'Build robust, accessible EPUB3 files perfectly structured for modern e-readers.',
      href: '/epub3',
      icon: BookOpen,
      colorClass: 'text-sky-600',
      bgClass: 'bg-sky-100',
    },
    {
      title: 'Legacy EPUB2',
      description: 'Maintain backwards compatibility with older devices. Convert directly to EPUB2 format.',
      href: '/epub2',
      icon: BookOpen,
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-200',
    },
    {
      title: 'Live XML Editor',
      description: 'Feature-rich browser-based CodeMirror editor to tweak and validate JATS/BITS XML output.',
      href: '/xml-editor',
      icon: FileCode2,
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-100',
    },
    {
      title: 'XML Ref',
      description: 'Extract and format document references into structured XML tags.',
      href: '/xml-ref',
      icon: Database,
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-100',
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      
      {/* ----------------- Hero Section ----------------- */}
      <section className="bg-slate-900 text-white pt-24 pb-32 px-6 text-center relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-6 flex justify-center">
            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
              BLACK VAVE EXCLUSIVE
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Every publisher tool <br className="hidden md:block"/> you need in one place.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            The ultimate conversion suite spanning XML compilation, layout analysis, and semantic EPUB building. Unmatched speed, absolute precision.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold py-3.5 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2">
                Sign In to Access Tools <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ----------------- Tools Grid ----------------- */}
      <section className="px-6 pb-24 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool, idx) => (
              <ToolCard key={idx} {...tool} />
            ))}
          </div>
        </div>
      </section>
      
      {/* ----------------- Footer ----------------- */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 text-center text-slate-500">
        <p className="font-medium">© {new Date().getFullYear()} Black Vave Publisher Tools. Professional Use Only.</p>
      </footer>

    </div>
  );
}
