import React from 'react';
import { Booking, Court, CourtStatus } from '../types';
import {
  Clock,
  User,
  Zap,
  CheckCircle,
  QrCode,
  CalendarPlus,
  PlayCircle,
  Sparkles,
  Power,
  RotateCcw,
} from 'lucide-react';

interface CourtGridProps {
  courts: Court[];
  bookings: Booking[];
  onOpenBookingModal: (courtId?: string) => void;
  onOpenQrScanner: () => void;
  onOpenTicketModal: (booking: Booking) => void;
  onCheckOutSession: (bookingId: string) => void;
  onUpdateCourtStatus: (courtId: string, status: CourtStatus) => void;
  onToggleLighting: (courtId: string) => void;
}

export const CourtGrid: React.FC<CourtGridProps> = ({
  courts,
  bookings,
  onOpenBookingModal,
  onOpenQrScanner,
  onOpenTicketModal,
  onCheckOutSession,
  onUpdateCourtStatus,
  onToggleLighting,
}) => {
  const getBookingForCourt = (court: Court): Booking | undefined => {
    if (court.currentBookingId) {
      return bookings.find((b) => b.id === court.currentBookingId);
    }
    // Alternatively look for checked_in or upcoming booked
    return bookings.find(
      (b) =>
        b.courtId === court.id &&
        (b.checkInStatus === 'checked_in' ||
          (b.checkInStatus === 'not_checked_in' && b.paymentStatus !== 'cancelled'))
    );
  };

  const getStatusBadge = (status: CourtStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            สนามว่าง (Available)
          </span>
        );
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            จองแล้ว รอเช็คอิน (Booked)
          </span>
        );
      case 'in_play':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            กำลังใช้งาน (In Play)
          </span>
        );
      case 'cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">
            <RotateCcw className="w-3 h-3 text-slate-500 animate-spin" />
            ทำความสะอาด (Cleaning)
          </span>
        );
    }
  };

  const getCourtTypeBadge = (type: Court['type']) => {
    switch (type) {
      case 'standard_rubber':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            พื้นยาง BWF เขียว
          </span>
        );
      case 'parquet_wood':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            ไม้ปาร์เก้แข่งขัน
          </span>
        );
      case 'vip_aircon':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> VIP ปรับอากาศ
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            ผังจัดการสนามแบดมินตันเรียลไทม์
            <span className="text-xs font-normal text-slate-500 font-mono">
              (6 สนามมาตรฐาน)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            สแกน QR Code ตรวจสอบสถานะการเข้าใช้งาน เปิด-ปิดไฟสนาม และจัดการรอบเล่น
          </p>
        </div>

        {/* Legend status indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ว่าง ({courts.filter(c => c.status === 'available').length})
          </span>
          <span className="flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> จองแล้ว ({courts.filter(c => c.status === 'booked').length})
          </span>
          <span className="flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> ใช้งานอยู่ ({courts.filter(c => c.status === 'in_play').length})
          </span>
          <span className="flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> ปิดปรับปรุง ({courts.filter(c => c.status === 'cleaning').length})
          </span>
        </div>
      </div>

      {/* Grid of 6 Courts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courts.map((court) => {
          const currentBooking = getBookingForCourt(court);
          const isLightOn = court.lightingStatus === 'on' || court.status === 'in_play';

          return (
            <div
              key={court.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col ${
                court.status === 'in_play'
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : court.status === 'booked'
                  ? 'border-amber-300'
                  : court.status === 'cleaning'
                  ? 'border-slate-300 opacity-80'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              {/* Visual Badminton Court Canvas Graphic Header */}
              <div
                className={`relative h-28 px-4 py-3 flex flex-col justify-between overflow-hidden ${
                  court.type === 'standard_rubber'
                    ? 'bg-emerald-800'
                    : court.type === 'parquet_wood'
                    ? 'bg-amber-900'
                    : 'bg-slate-900'
                }`}
              >
                {/* Badminton Court Boundary Lines (Architectural Styling) */}
                <div className="absolute inset-2 border border-white/40 rounded-sm pointer-events-none">
                  {/* Center net line */}
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 shadow-[0_0_4px_white]" />
                  {/* Short service lines */}
                  <div className="absolute inset-y-0 left-[36%] w-px bg-white/30" />
                  <div className="absolute inset-y-0 right-[36%] w-px bg-white/30" />
                  {/* Center service line */}
                  <div className="absolute inset-x-[36%] top-1/2 h-px bg-white/30" />
                </div>

                {/* Lighting glow effect if on */}
                {isLightOn && (
                  <div className="absolute -top-12 inset-x-0 h-24 bg-yellow-200/20 blur-xl pointer-events-none" />
                )}

                {/* Top Row inside Graphic */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-base tracking-wide drop-shadow-sm">
                      {court.name}
                    </span>
                    <button
                      onClick={() => onToggleLighting(court.id)}
                      title={`สวิตช์ไฟสนาม: ${isLightOn ? 'เปิดอยู่' : 'ปิดอยู่'}`}
                      className={`p-1 rounded-full transition-colors ${
                        isLightOn
                          ? 'bg-yellow-400 text-slate-900 shadow-[0_0_8px_#facc15]'
                          : 'bg-white/20 text-white/70 hover:bg-white/30'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="bg-black/30 backdrop-blur-xs text-white/90 text-xs px-2.5 py-0.5 rounded-full font-mono">
                    ฿{court.pricePerHour}/ชม.
                  </div>
                </div>

                {/* Bottom Row inside Graphic */}
                <div className="relative z-10 flex items-center justify-between">
                  {getCourtTypeBadge(court.type)}
                  <div className="bg-white rounded-full shadow-xs">
                    {getStatusBadge(court.status)}
                  </div>
                </div>
              </div>

              {/* Court Details Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                {/* Active or Booked session info */}
                {currentBooking ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                        <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {currentBooking.playerName}
                      </span>
                      <button
                        onClick={() => onOpenTicketModal(currentBooking)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 font-medium underline"
                      >
                        <QrCode className="w-3 h-3" /> ดู QR Pass
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {currentBooking.startTime} - {currentBooking.endTime} ({currentBooking.hours} ชม.)
                      </span>
                      <span className="text-[10px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-700">
                        {currentBooking.bookingCode}
                      </span>
                    </div>

                    {court.status === 'in_play' && (
                      <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-rose-600 font-medium flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5 animate-spin" />
                          เช็คอินเมื่อ {currentBooking.checkedInAt || '14:00'} น.
                        </span>
                        <span className="text-slate-500 font-mono">
                          เหลือเวลา ~{Math.max(15, 60)} นาที
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    {court.status === 'cleaning'
                      ? 'เจ้าหน้าที่กำลังทำความสะอาดและเช็ดถูพื้นสนาม'
                      : 'ยังไม่มีรอบการเล่นในขณะนี้ สามารถจองหรือสแกนเข้าเล่นได้ทันที'}
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="space-y-2 pt-1">
                  {court.status === 'in_play' && currentBooking && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onCheckOutSession(currentBooking.id)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        เสร็จสิ้น / เช็คเอาท์
                      </button>
                      <button
                        onClick={() => onOpenTicketModal(currentBooking)}
                        className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                        ตั๋ว QR ของผู้เล่น
                      </button>
                    </div>
                  )}

                  {court.status === 'booked' && currentBooking && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={onOpenQrScanner}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        สแกนเช็คอินทันที
                      </button>
                      <button
                        onClick={() => onOpenTicketModal(currentBooking)}
                        className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        ดูบัตรเช็คอิน
                      </button>
                    </div>
                  )}

                  {court.status === 'available' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenBookingModal(court.id)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        จองสนามนี้
                      </button>
                      <button
                        onClick={onOpenQrScanner}
                        className="py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        สแกนเพื่อเริ่มเล่น
                      </button>
                    </div>
                  )}

                  {court.status === 'cleaning' && (
                    <button
                      onClick={() => onUpdateCourtStatus(court.id, 'available')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      เสร็จสิ้นการทำความสะอาด (เปิดใช้งาน)
                    </button>
                  )}

                  {/* Secondary Quick Court Status Changer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>เปลี่ยนสถานะสนาม:</span>
                    <select
                      value={court.status}
                      onChange={(e) => onUpdateCourtStatus(court.id, e.target.value as CourtStatus)}
                      className="bg-transparent border-0 text-[11px] text-slate-600 font-medium focus:ring-0 cursor-pointer hover:text-slate-900"
                    >
                      <option value="available">🟢 สนามว่าง (Available)</option>
                      <option value="booked">🟡 จองแล้ว (Booked)</option>
                      <option value="in_play">🔴 กำลังใช้งาน (In Play)</option>
                      <option value="cleaning">🧹 ทำความสะอาด (Cleaning)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
