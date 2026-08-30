'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, CheckCircle2, Play, Square, MapPin,
  History, Award, AlertCircle, FileText
} from 'lucide-react';
import type { SRAttendance, Route, SR } from '../types';
import type { Language } from '../translations';
import { getLocalDateString } from './dashboard/dashboardUtils';

interface SRAttendanceModuleProps {
  srName: string;
  srs: SR[];
  routes: Route[];
  attendance: SRAttendance[];
  setAttendance: (att: SRAttendance[] | ((prev: SRAttendance[]) => SRAttendance[])) => void;
  language: Language;
}

export default function SRAttendanceModule({
  srName,
  srs,
  routes,
  attendance,
  setAttendance,
  language,
}: SRAttendanceModuleProps) {
  const isBn = language === 'bn';
  const todayStr = getLocalDateString(new Date());

  // Find Current SR
  const currentSR = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return srs.find(s => s.name.trim().toLowerCase() === norm);
  }, [srs, srName]);

  const assignedRoute = useMemo(() => {
    if (!currentSR) return null;
    return routes.find(r => r.assignedSRId === currentSR.id) || null;
  }, [currentSR, routes]);

  // Today's attendance
  const todayRecord = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return attendance.find(a => (a.srName || '').trim().toLowerCase() === norm && a.date === todayStr);
  }, [attendance, srName, todayStr]);

  // Form states
  const [selectedRoute, setSelectedRoute] = useState<string>(assignedRoute?.name || '');
  const [notes, setNotes] = useState<string>('');

  // Start Day
  function handleStartDay() {
    const newRecord: SRAttendance = {
      id: `att-${Date.now()}`,
      srId: currentSR?.id || 'sr-default',
      srName: srName || 'SR',
      date: todayStr,
      dayStart: new Date().toISOString(),
      routeName: selectedRoute || assignedRoute?.name || 'General Route',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setAttendance(prev => [...prev.filter(a => !(a.date === todayStr && (a.srName || '').toLowerCase() === (srName || '').toLowerCase())), newRecord]);
    setNotes('');
  }

  // End Day
  function handleEndDay() {
    if (!todayRecord) return;
    const updated: SRAttendance = {
      ...todayRecord,
      dayEnd: new Date().toISOString(),
      notes: notes.trim() ? `${todayRecord.notes ? todayRecord.notes + ' | ' : ''}${notes.trim()}` : todayRecord.notes,
    };

    setAttendance(prev => prev.map(a => a.id === todayRecord.id ? updated : a));
    setNotes('');
  }

  // History for this SR
  const srHistory = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return attendance
      .filter(a => (a.srName || '').trim().toLowerCase() === norm)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, srName]);

  // Stats
  const thisMonthKey = todayStr.substring(0, 7);
  const monthDaysCount = useMemo(() => {
    return srHistory.filter(a => a.date.startsWith(thisMonthKey) && a.dayStart).length;
  }, [srHistory, thisMonthKey]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            {isBn ? 'দৈনিক ফিল্ড উপস্থিতি ও রুট' : 'Daily Field Attendance & Route'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBn
              ? 'প্রতিদিন সকালে ফিল্ডে যাওয়ার সময় কাজ শুরু (Day Start) এবং কাজ শেষে সম্পন্ন (Day End) করুন।'
              : 'Log your daily field work start and end times along with assigned market route.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2">
            <Award className="w-4 h-4" />
            {isBn ? `চলতি মাসে উপস্থিতি: ${monthDaysCount} দিন` : `This Month: ${monthDaysCount} Days`}
          </div>
        </div>
      </div>

      {/* ── Today's Attendance Card ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
              {isBn ? 'আজকের অবস্থা' : "Today's Status"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* Status states */}
          {!todayRecord?.dayStart ? (
            /* State 1: Day Not Started */
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {isBn ? 'আজকের ফিল্ড ডিউটি শুরু করুন' : 'Start Your Field Duty'}
              </h2>
              <p className="text-xs text-slate-300">
                {isBn
                  ? 'আপনার আজকের টার্গেট রুট নিশ্চিত করে কাজ শুরু করুন।'
                  : 'Confirm your route territory and record your duty start time.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {isBn ? 'টার্গেট রুট' : 'Assigned Route'}
                  </label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">{isBn ? '-- রুট নির্বাচন করুন --' : '-- Select Route --'}</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.name}>{r.name} ({r.area})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {isBn ? 'নোট / মন্তব্য (ঐচ্ছিক)' : 'Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isBn ? 'যেমন: সকালের বাজার ভিজিট...' : 'e.g. Morning market visit...'}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartDay}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {isBn ? 'ফিল্ডে কাজ শুরু করুন (Day Start)' : 'Start Field Duty (Day Start)'}
                </button>
              </div>
            </div>
          ) : !todayRecord?.dayEnd ? (
            /* State 2: Day In Progress */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg sm:text-xl">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                {isBn ? 'ফিল্ডে কাজ চলমান রয়েছে' : 'Field Duty In Progress'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block">{isBn ? 'শুরুর সময়' : 'Start Time'}</span>
                  <span className="font-bold text-white text-base">
                    {new Date(todayRecord.dayStart).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isBn ? 'রুট' : 'Active Route'}</span>
                  <span className="font-bold text-indigo-300 text-base">{todayRecord.routeName || 'General'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold text-slate-300 block">
                  {isBn ? 'দিনের সমাপনী নোট' : 'End Day Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isBn ? 'যেমন: সব দোকানে অর্ডার সংগ্রহ সম্পন্ন...' : 'e.g. All shops visited...'}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleEndDay}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  {isBn ? 'দিনের কাজ শেষ করুন (Day End)' : 'End Field Duty (Day End)'}
                </button>
              </div>
            </div>
          ) : (
            /* State 3: Day Completed */
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <CheckCircle2 className="w-5 h-5" />
                {isBn ? 'আজকের ফিল্ড ডিউটি সম্পন্ন হয়েছে' : 'Today’s Duty Completed'}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block">{isBn ? 'শুরু' : 'Start'}</span>
                  <span className="font-bold text-white">
                    {new Date(todayRecord.dayStart).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isBn ? 'শেষ' : 'End'}</span>
                  <span className="font-bold text-white">
                    {new Date(todayRecord.dayEnd).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isBn ? 'রুট' : 'Route'}</span>
                  <span className="font-bold text-indigo-300">{todayRecord.routeName || 'General'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance Log History Table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'উপস্থিতি ইতিহাস (বিগত দিনসমূহ)' : 'Attendance Log History'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {srHistory.length} {isBn ? 'টি রেকর্ড' : 'Records'}
          </span>
        </div>

        {srHistory.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {isBn ? 'কোনো উপস্থিতি রেকর্ড পাওয়া যায়নি।' : 'No attendance logs found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-3 px-3">{isBn ? 'রুট' : 'Route'}</th>
                  <th className="py-3 px-3">{isBn ? 'শুরুর সময়' : 'Start Time'}</th>
                  <th className="py-3 px-3">{isBn ? 'শেষ সময়' : 'End Time'}</th>
                  <th className="py-3 px-3">{isBn ? 'মন্তব্য' : 'Notes'}</th>
                  <th className="py-3 px-3">{isBn ? 'অবস্থা' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {srHistory.map((a) => {
                  const startStr = a.dayStart
                    ? new Date(a.dayStart).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                    : '-';
                  const endStr = a.dayEnd
                    ? new Date(a.dayEnd).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                    : '-';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{a.date}</td>
                      <td className="py-3 px-3 text-slate-700">{a.routeName || '-'}</td>
                      <td className="py-3 px-3 font-mono font-medium text-emerald-700">{startStr}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">{endStr}</td>
                      <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{a.notes || '-'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                          a.dayEnd
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.dayStart
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {a.dayEnd ? (isBn ? 'সম্পন্ন' : 'Completed') : a.dayStart ? (isBn ? 'চলমান' : 'In Duty') : (isBn ? 'অনুপস্থিত' : 'Off')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
