import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Trophy, Calendar, Award, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PublicCompetitionList } from '@/features/public/components/PublicCompetitionList';
import { PublicResultList } from '@/features/public/components/PublicResultList';

export default function PublicHomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header Mobile Friendly */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-3 font-bold text-xl text-slate-800">
            <Trophy className="h-7 w-7 text-primary" />
            <span>Info Lomba</span>
          </div>
          <div className="flex items-center">
            <Link 
              href="/login" 
              className={buttonVariants({ variant: "ghost", size: "sm", className: "text-base font-semibold text-primary" })}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Masuk
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-10">
        {/* Hero Section */}
        <section className="w-full py-12 bg-primary/10 px-4">
          <div className="container mx-auto text-center space-y-6">
            <div className="mx-auto bg-primary/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              Portal Informasi <br className="md:hidden" /> Lomba Warga
            </h1>
            <p className="text-lg md:text-2xl text-slate-700 max-w-2xl mx-auto px-2">
              Selamat datang! Di sini Anda bisa melihat jadwal dan hasil dari setiap perlombaan yang sedang berlangsung.
            </p>
            
            <div className="flex flex-col gap-4 mt-8 px-4 sm:flex-row sm:justify-center">
              <Link 
                href="#jadwal" 
                className={buttonVariants({ size: "lg", className: "h-14 text-lg rounded-xl shadow-md w-full sm:w-auto text-white" })}
              >
                <Calendar className="mr-2 h-6 w-6" />
                Lihat Jadwal Lomba
              </Link>
              <Link 
                href="#hasil" 
                className={buttonVariants({ variant: "outline", size: "lg", className: "h-14 text-lg rounded-xl bg-white w-full sm:w-auto" })}
              >
                <Award className="mr-2 h-6 w-6" />
                Pengumuman Juara
              </Link>
            </div>
          </div>
        </section>
        
        {/* Jadwal Lomba Section */}
        <section id="jadwal" className="w-full py-12 px-4 bg-white">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                Jadwal Terdekat
              </h2>
            </div>
            
            <div className="mt-6">
              <PublicCompetitionList />
            </div>
          </div>
        </section>

        {/* Hasil Lomba Section */}
        <section id="hasil" className="w-full py-12 px-4 bg-slate-50">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                Pengumuman Juara
              </h2>
            </div>
            
            <div className="mt-6">
              <PublicResultList />
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-lg text-slate-600">
                Punya pertanyaan? Silakan hubungi ketua RT masing-masing atau panitia lomba.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-slate-800 text-slate-300 py-8 px-4 text-center">
        <p className="text-base">
          © 2026 Panitia Lomba Warga. Sistem dibangun menggunakan ECMS.
        </p>
      </footer>
    </div>
  );
}
