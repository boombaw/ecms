'use client';

import { useEffect } from 'react';
import { CalendarDays, Trophy, Users, Megaphone, UserPlus } from 'lucide-react';
import { ParticipantDialog } from '@/features/participants/components/ParticipantDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [eventsRes, compsRes, partsRes] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('competitions').select('*', { count: 'exact', head: true }),
        supabase.from('participants').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        events: eventsRes.count || 0,
        competitions: compsRes.count || 0,
        participants: partsRes.count || 0,
      };
    }
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' }, // Listen to all tables
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <>
      <section className="mb-gutter mt-12 md:mt-0">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-1">Dashboard Overview</h2>
        <p className="text-body-md text-secondary/70">Welcome back, Administrator</p>
      </section>
      
      <div className="flex flex-col gap-gutter">
        {/* Total Event (Primary Accent Card) */}
        <div className="bg-primary-container text-on-primary-container rounded-xl p-card-padding card-shadow relative overflow-hidden active:scale-[0.98] transition-transform duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md uppercase tracking-wider opacity-90">Total Event</span>
            <CalendarDays className="w-6 h-6 opacity-80" strokeWidth={1.5} />
          </div>
          <div className="font-stat-value text-stat-value mb-2">
            {isLoading ? '...' : stats?.events}
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
        </div>

        {/* Total Peserta (Dark Professional Card) */}
        <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-card-padding card-shadow relative overflow-hidden active:scale-[0.98] transition-transform duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md uppercase tracking-wider opacity-70">Total Peserta</span>
            <Users className="w-6 h-6 opacity-70" strokeWidth={1.5} />
          </div>
          <div className="font-stat-value text-stat-value mb-2">
            {isLoading ? '...' : stats?.participants}
          </div>
        </div>

        {/* Total Lomba (Clean Surface Card) */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-card-padding card-shadow relative active:scale-[0.98] transition-transform duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-secondary/70 uppercase tracking-wider">Total Lomba</span>
            <div className="w-10 h-10 bg-error-container/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-error" strokeWidth={2} />
            </div>
          </div>
          <div className="font-stat-value text-stat-value text-on-surface mb-2">
            {isLoading ? '...' : stats?.competitions}
          </div>
          <p className="text-body-md text-secondary/60">Tergabung dalam berbagai event</p>
        </div>
      </div>

      {/* Quick Insights Section */}
      <section className="mt-stack-lg">
        <div className="flex items-center justify-between mb-stack-md">
          <h3 className="font-headline-sm text-headline-sm">Activity Feed</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/20">
            <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-bold text-body-md">Sistem Siap Digunakan</p>
              <p className="text-secondary/60 text-label-md">Pantau pendaftar secara langsung</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAB (Contextual for Dashboard: Create Participant) */}
      <div className="fixed right-6 bottom-24 z-40">
        <ParticipantDialog trigger={
          <button className="w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-transform duration-150">
            <UserPlus className="w-8 h-8" strokeWidth={2} />
          </button>
        } />
      </div>
    </>
  );
}
