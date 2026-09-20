import React, { useEffect, useState } from 'react';
import {
  ScanLine,
  CalendarPlus,
  FileSpreadsheet,
  Users,
  Clock,
  Zap,
  TrendingUp,
  Flame,
} from 'lucide-react';

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenBooking: () => void;
  onOpenReport: () => void;
  onOpenDirectory: () => void;
  activeCourtsCount: number;
  totalCheckInsCount: number;
  todayRevenue: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  onOpenBooking,
  onOpenReport,
  onOpenDirectory,
  activeCourtsCount,
  totalCheckInsCount,
  todayRevenue,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('th-TH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Arena Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
              <span className="text-2xl" role="img" aria-label="Badminton">🏸</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight leading-none">
                  ระบบจัดการสนามแบดมินตัน
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Arena
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>สแกน QR Code เช็คอิน</span>
                <span>•</span>
                <span>จองสนามเรียลไทม์</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">ส่งออก Excel รายวัน</span>
              </p>
            </div>
          </div>

          {/* Center Quick Stats / Real-time Clock */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Real-time Clock */}
            <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-mono font-bold text-slate-900 leading-none">
                  {currentTime || '00:00:00'} น.
                </div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  {currentDate || 'กำลังโหลดวันที่...'}
                </div>
              </div>
            </div>

            {/* Live active courts counter */}
            <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span className="text-xs font-semibold text-rose-900">
                เปิดเล่นอยู่: <strong className="font-bold text-rose-700">{activeCourtsCount}/6 สนาม</strong>
              </span>
            </div>

            {/* Check-ins & Revenue badge */}
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-xs font-semibold text-emerald-900">
                เช็คอิน: <strong className="font-bold">{totalCheckInsCount}</strong> | ยอดวันนี้: <strong className="font-bold font-mono">฿{todayRevenue.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scan QR Button - Main CTA */}
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all"
            >
              <ScanLine className="w-4 h-4" />
              <span>สแกน QR เช็คอิน</span>
            </button>

            {/* New Booking Button */}
            <button
              onClick={onOpenBooking}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>+ จองสนาม</span>
            </button>

            {/* Daily Excel Report Button */}
            <button
              onClick={onOpenReport}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>สรุปยอด Excel</span>
            </button>

            {/* Player Directory Button */}
            <button
              onClick={onOpenDirectory}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium shadow-xs transition-colors"
              title="ทะเบียนข้อมูลผู้ใช้งาน"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
