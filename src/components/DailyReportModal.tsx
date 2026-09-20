import React, { useMemo, useState } from 'react';
import { Booking, CheckInLog, DailySummaryStats, Player } from '../types';
import { exportDailyReportToExcel } from '../utils/excelExport';
import { getTodayDateString } from '../utils/sampleData';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  X,
  Sparkles,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  checkIns: CheckInLog[];
  players: Player[];
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  bookings,
  checkIns,
  players,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Compute daily summary stats for the selected date
  const stats: DailySummaryStats = useMemo(() => {
    const dayBookings = bookings.filter(
      (b) => b.date === selectedDate && b.paymentStatus !== 'cancelled'
    );
    const dayCheckIns = checkIns.filter((c) => c.date === selectedDate && c.status !== 'cancelled');

    const totalCheckIns = dayCheckIns.length;
    const uniquePlayers = new Set(dayCheckIns.map((c) => c.playerId)).size;
    const totalBookings = dayBookings.length;

    let totalHours = 0;
    let courtRevenue = 0;
    let equipmentRevenue = 0;

    dayBookings.forEach((b) => {
      totalHours += b.hours;
      courtRevenue += b.courtFee;
      equipmentRevenue += b.equipmentFee;
    });

    const totalRevenue = courtRevenue + equipmentRevenue;

    // 6 courts, open 14 hours per day (08:00 - 22:00 = 84 available court-hours)
    const MAX_COURT_HOURS_PER_DAY = 6 * 14;
    const utilizationRate = Math.min(100, (totalHours / MAX_COURT_HOURS_PER_DAY) * 100);

    // Court breakdown
    const courtMap: Record<
      string,
      { courtId: string; courtName: string; type: any; hours: number; revenue: number; bookingsCount: number }
    > = {
      'court-1': { courtId: 'court-1', courtName: 'คอร์ท 1 (Court 1)', type: 'standard_rubber', hours: 0, revenue: 0, bookingsCount: 0 },
      'court-2': { courtId: 'court-2', courtName: 'คอร์ท 2 (Court 2)', type: 'standard_rubber', hours: 0, revenue: 0, bookingsCount: 0 },
      'court-3': { courtId: 'court-3', courtName: 'คอร์ท 3 (Court 3)', type: 'standard_rubber', hours: 0, revenue: 0, bookingsCount: 0 },
      'court-4': { courtId: 'court-4', courtName: 'คอร์ท 4 (Court 4)', type: 'parquet_wood', hours: 0, revenue: 0, bookingsCount: 0 },
      'court-5': { courtId: 'court-5', courtName: 'คอร์ท 5 (Court 5)', type: 'parquet_wood', hours: 0, revenue: 0, bookingsCount: 0 },
      'court-6': { courtId: 'court-6', courtName: 'คอร์ท 6 (VIP Air-Con)', type: 'vip_aircon', hours: 0, revenue: 0, bookingsCount: 0 },
    };

    dayBookings.forEach((b) => {
      if (courtMap[b.courtId]) {
        courtMap[b.courtId].hours += b.hours;
        courtMap[b.courtId].revenue += b.courtFee + b.equipmentFee;
        courtMap[b.courtId].bookingsCount += 1;
      }
    });

    const courtPerformance = Object.values(courtMap);

    return {
      date: selectedDate,
      totalCheckIns,
      uniquePlayers,
      totalBookings,
      totalHours,
      totalRevenue,
      courtRevenue,
      equipmentRevenue,
      utilizationRate,
      peakHour: '18:00 - 20:00',
      activeCourtsNow: dayCheckIns.filter((c) => c.status === 'active').length,
      courtPerformance,
    };
  }, [bookings, checkIns, selectedDate]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    const dayBookings = bookings.filter((b) => b.date === selectedDate);
    const dayCheckIns = checkIns.filter((c) => c.date === selectedDate);
    exportDailyReportToExcel(stats, dayCheckIns, dayBookings, players);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                รายงานสรุปยอดการใช้งานรายวัน
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-md">
                  Excel Export Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                วิเคราะห์สถิติผู้เข้าเล่น ยอดรายได้ และอัตราการใช้งานสนาม
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> เลือกวันที่สรุปยอด:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 shadow-xs focus:outline-emerald-600"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>ส่งออกไฟล์ Excel สำเร็จ!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>ส่งออกเป็นไฟล์ Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Key Metrics 4-Box Bento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-xs font-semibold">รายได้สุทธิประจำวัน</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-900">
                ฿{stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 flex justify-between">
                <span>ค่าสนาม: ฿{stats.courtRevenue}</span>
                <span>อุปกรณ์: ฿{stats.equipmentRevenue}</span>
              </div>
            </div>

            {/* Total Check-ins */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-xs font-semibold">สแกนเช็คอิน (ครั้ง)</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-blue-900">{stats.totalCheckIns}</div>
              <p className="text-[11px] text-blue-700 mt-1">
                ผู้เล่นไม่ซ้ำ: <strong>{stats.uniquePlayers}</strong> คน
              </p>
            </div>

            {/* Total Court Hours */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-xs font-semibold">ชั่วโมงสนามรวม</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-amber-900">{stats.totalHours} ชม.</div>
              <p className="text-[11px] text-amber-700 mt-1">
                จากทั้งหมด {stats.totalBookings} การจอง
              </p>
            </div>

            {/* Utilization Rate */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-purple-700 mb-1">
                <span className="text-xs font-semibold">อัตราการใช้งานสนาม</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-purple-900">
                {stats.utilizationRate.toFixed(1)}%
              </div>
              <p className="text-[11px] text-purple-700 mt-1">
                ช่วงเวลาพีค: {stats.peakHour}
              </p>
            </div>
          </div>

          {/* Court Performance Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                สถิติสรุปแยกตามรายสนาม (Court Utilization & Revenue)
              </h4>
              <span className="text-[11px] text-slate-500">ทั้งหมด 6 สนาม</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">สนาม</th>
                    <th className="py-2.5 px-3">ประเภท</th>
                    <th className="py-2.5 px-3 text-center">จำนวนรอบจอง</th>
                    <th className="py-2.5 px-3 text-center">ชั่วโมงใช้งาน</th>
                    <th className="py-2.5 px-4 text-right">รายได้รวม</th>
                    <th className="py-2.5 px-4 text-center">สัดส่วนการใช้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.courtPerformance.map((c) => {
                    const courtHoursRatio = Math.min(100, Math.round((c.hours / 14) * 100));
                    return (
                      <tr key={c.courtId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">{c.courtName}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {c.type === 'standard_rubber'
                            ? 'พื้นยางเขียว BWF'
                            : c.type === 'parquet_wood'
                            ? 'ไม้ปาร์เก้'
                            : 'VIP แอร์'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{c.bookingsCount} ครั้ง</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {c.hours} ชม.
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                          ฿{c.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-28 mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all"
                              style={{ width: `${courtHoursRatio}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-center text-slate-400 mt-0.5 font-mono">
                            {courtHoursRatio}% (จาก 14 ชม.)
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Excel File Sheet Structure Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h5 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              โครงสร้างข้อมูลที่จะส่งออกในไฟล์ Excel (.xlsx):
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-800 block mb-0.5">1. สรุปภาพรวมรายวัน</strong>
                <p className="text-[11px] text-slate-500">KPIs, ยอดรายได้, สถิติแยกตามสนาม</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-800 block mb-0.5">2. ประวัติการเช็คอิน</strong>
                <p className="text-[11px] text-slate-500">เวลาสแกน QR, ผู้ใช้งาน, สถานะลงสนาม</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-800 block mb-0.5">3. รายการจองสนาม</strong>
                <p className="text-[11px] text-slate-500">รอบเวลา, ค่าสนาม, ค่าอุปกรณ์, การชำระเงิน</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-800 block mb-0.5">4. ฐานข้อมูลผู้ใช้สนาม</strong>
                <p className="text-[11px] text-slate-500">รหัสสมาชิก, เบอร์โทร, สถิติสะสม</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            สร้างรายงานวันที่ {selectedDate} | ข้อมูลพร้อมส่งออกเพื่อทำบัญชีและสรุปยอด
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleExportExcel}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลดไฟล์ Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
