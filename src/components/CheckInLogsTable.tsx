import React, { useState } from 'react';
import { Booking, CheckInLog } from '../types';
import {
  CheckCircle,
  Clock,
  QrCode,
  Search,
  User,
  Phone,
  PlayCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface CheckInLogsTableProps {
  checkIns: CheckInLog[];
  bookings: Booking[];
  onCheckOut: (bookingId: string) => void;
  onViewTicket: (booking: Booking) => void;
}

export const CheckInLogsTable: React.FC<CheckInLogsTableProps> = ({
  checkIns,
  bookings,
  onCheckOut,
  onViewTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredLogs = checkIns.filter((log) => {
    const matchesSearch =
      log.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.playerPhone.includes(searchTerm) ||
      log.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.courtName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            ประวัติการสแกนเช็คอินเข้าสนาม
            <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">
              {checkIns.length} รายการ
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกประวัติการสแกน QR Code แบบเรียลไทม์ พร้อมเวลาเริ่ม-สิ้นสุด
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัส, สนาม..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-emerald-600 shadow-xs"
            />
          </div>

          <div className="flex text-xs bg-slate-200/70 p-0.5 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === 'active' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              กำลังเล่น ({checkIns.filter((c) => c.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">เวลาสแกน</th>
              <th className="py-3 px-4">ผู้ใช้งาน / เบอร์โทร</th>
              <th className="py-3 px-3">สนามที่ใช้</th>
              <th className="py-3 px-3">รอบการจอง</th>
              <th className="py-3 px-3">วิธีการเช็คอิน</th>
              <th className="py-3 px-3 text-center">สถานะ</th>
              <th className="py-3 px-4 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  ไม่พบรายการเช็คอินที่ตรงกับเงื่อนไข
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const linkedBooking = bookings.find((b) => b.id === log.bookingId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{log.checkInTime}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.date}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        {log.playerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {log.playerPhone}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {log.courtName}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-800 font-medium">
                        {log.sessionStartTime} - {log.sessionEndTime}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {log.bookingCode}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-100">
                        <QrCode className="w-3 h-3" />
                        {log.method === 'qr_scan' ? 'สแกน QR Code' : 'ลงชื่อหน้าสนาม'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {log.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          กำลังใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          เสร็จสิ้น ({log.checkOutTime || 'จบเวลา'})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {log.status === 'active' && (
                          <button
                            onClick={() => onCheckOut(log.bookingId)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-medium shadow-xs transition-colors"
                          >
                            เช็คเอาท์
                          </button>
                        )}
                        {linkedBooking && (
                          <button
                            onClick={() => onViewTicket(linkedBooking)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors"
                            title="ดูบัตร QR Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
