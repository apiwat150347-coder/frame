import React, { useEffect, useState } from 'react';
import { Booking, CheckInLog, Court, CourtStatus, Player } from './types';
import {
  generateInitialBookings,
  generateInitialCheckIns,
  getTodayDateString,
  INITIAL_COURTS,
  INITIAL_PLAYERS,
} from './utils/sampleData';
import { Header } from './components/Header';
import { CourtGrid } from './components/CourtGrid';
import { CheckInLogsTable } from './components/CheckInLogsTable';
import { QrScannerModal } from './components/QrScannerModal';
import { QrTicketModal } from './components/QrTicketModal';
import { BookingModal } from './components/BookingModal';
import { DailyReportModal } from './components/DailyReportModal';
import { PlayerDirectoryModal } from './components/PlayerDirectoryModal';
import { playCheckOutBeep, playSuccessBeep } from './utils/sound';
import {
  Calendar,
  FileSpreadsheet,
  QrCode,
  RotateCcw,
  Sparkles,
  Users,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

const STORAGE_KEYS = {
  COURTS: 'badminton_courts_v1',
  PLAYERS: 'badminton_players_v1',
  BOOKINGS: 'badminton_bookings_v1',
  CHECK_INS: 'badminton_checkins_v1',
};

export default function App() {
  const today = getTodayDateString();

  // Load from LocalStorage or initialize with sample data
  const [courts, setCourts] = useState<Court[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURTS);
      return saved ? JSON.parse(saved) : INITIAL_COURTS;
    } catch {
      return INITIAL_COURTS;
    }
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return saved ? JSON.parse(saved) : generateInitialBookings(today);
    } catch {
      return generateInitialBookings(today);
    }
  });

  const [checkIns, setCheckIns] = useState<CheckInLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
      return saved ? JSON.parse(saved) : generateInitialCheckIns(today);
    } catch {
      return generateInitialCheckIns(today);
    }
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(courts));
  }, [courts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns));
  }, [checkIns]);

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [ticketModalBooking, setTicketModalBooking] = useState<Booking | null>(null);
  const [preSelectedCourtId, setPreSelectedCourtId] = useState<string | undefined>(undefined);

  // Success Notification banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Handle Successful Check-in via QR or Manual code
  const handleCheckInSuccess = (bookingId: string, method: 'qr_scan' | 'manual' = 'qr_scan') => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    const checkInTimeStr = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Update booking status
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              checkInStatus: 'checked_in',
              checkedInAt: checkInTimeStr,
            }
          : b
      )
    );

    // Update court status & lights
    setCourts((prev) =>
      prev.map((c) =>
        c.id === targetBooking.courtId
          ? {
              ...c,
              status: 'in_play',
              currentBookingId: targetBooking.id,
              lightingStatus: 'on',
            }
          : c
      )
    );

    // Create Check-in record
    const newCheckIn: CheckInLog = {
      id: `chk-${Date.now().toString().slice(-4)}`,
      bookingId: targetBooking.id,
      bookingCode: targetBooking.bookingCode,
      courtId: targetBooking.courtId,
      courtName: targetBooking.courtName,
      playerId: targetBooking.playerId,
      playerName: targetBooking.playerName,
      playerPhone: targetBooking.playerPhone,
      date: targetBooking.date,
      checkInTime: checkInTimeStr,
      sessionStartTime: targetBooking.startTime,
      sessionEndTime: targetBooking.endTime,
      status: 'active',
      method,
      notes: 'เช็คอินสำเร็จ เปิดไฟสนามอัตโนมัติ',
    };

    setCheckIns((prev) => [newCheckIn, ...prev]);

    // Update player visit counts
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === targetBooking.playerId
          ? {
              ...p,
              totalVisits: p.totalVisits + 1,
              totalHours: p.totalHours + targetBooking.hours,
              totalSpent: p.totalSpent + targetBooking.totalAmount,
            }
          : p
      )
    );

    showNotification(
      `✓ เช็คอินสำเร็จ: คุณ ${targetBooking.playerName} เข้าใช้งาน ${targetBooking.courtName} (เปิดไฟสนามเรียบร้อย)`
    );
  };

  // 2. Handle Checkout / End Session
  const handleCheckOut = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    playCheckOutBeep();
    const checkOutTimeStr = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Update booking
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              checkInStatus: 'completed',
              checkedOutAt: checkOutTimeStr,
            }
          : b
      )
    );

    // Update court back to available (or cleaning)
    setCourts((prev) =>
      prev.map((c) =>
        c.id === targetBooking.courtId
          ? {
              ...c,
              status: 'available',
              currentBookingId: undefined,
              lightingStatus: 'off',
            }
          : c
      )
    );

    // Update checkIn logs
    setCheckIns((prev) =>
      prev.map((chk) =>
        chk.bookingId === bookingId && chk.status === 'active'
          ? {
              ...chk,
              status: 'completed',
              checkOutTime: checkOutTimeStr,
            }
          : chk
      )
    );

    showNotification(
      `✓ เสร็จสิ้นรอบการเล่น: ${targetBooking.courtName} เช็คเอาท์และปิดไฟสนามเรียบร้อย`
    );
  };

  // 3. Handle Save New Booking
  const handleSaveBooking = (
    newBooking: Booking,
    newPlayer?: Player,
    checkInImmediately?: boolean
  ) => {
    if (newPlayer) {
      setPlayers((prev) => [newPlayer, ...prev]);
    }

    setBookings((prev) => [newBooking, ...prev]);

    if (checkInImmediately) {
      handleCheckInSuccess(newBooking.id, 'manual');
    } else {
      // If booked for today, set court to 'booked' if currently available
      setCourts((prev) =>
        prev.map((c) =>
          c.id === newBooking.courtId && c.status === 'available'
            ? {
                ...c,
                status: 'booked',
                currentBookingId: newBooking.id,
              }
            : c
        )
      );

      playSuccessBeep();
      showNotification(`✓ บันทึกการจอง ${newBooking.bookingCode} สำหรับ ${newBooking.playerName} สำเร็จ`);
    }

    // Open ticket QR modal so user/staff can immediately view/share QR Pass
    setTicketModalBooking(newBooking);
  };

  // 4. Update Court Status
  const handleUpdateCourtStatus = (courtId: string, status: CourtStatus) => {
    setCourts((prev) =>
      prev.map((c) =>
        c.id === courtId
          ? {
              ...c,
              status,
              lightingStatus: status === 'in_play' ? 'on' : 'off',
              currentBookingId: status === 'available' ? undefined : c.currentBookingId,
            }
          : c
      )
    );
  };

  // 5. Toggle Court Lighting
  const handleToggleLighting = (courtId: string) => {
    setCourts((prev) =>
      prev.map((c) =>
        c.id === courtId
          ? {
              ...c,
              lightingStatus: c.lightingStatus === 'on' ? 'off' : 'on',
            }
          : c
      )
    );
  };

  // 6. Reset to Sample Data
  const handleResetSampleData = () => {
    if (confirm('ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างของวันนี้หรือไม่?')) {
      localStorage.removeItem(STORAGE_KEYS.COURTS);
      localStorage.removeItem(STORAGE_KEYS.PLAYERS);
      localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
      localStorage.removeItem(STORAGE_KEYS.CHECK_INS);
      setCourts(INITIAL_COURTS);
      setPlayers(INITIAL_PLAYERS);
      setBookings(generateInitialBookings(today));
      setCheckIns(generateInitialCheckIns(today));
      showNotification('รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว');
    }
  };

  // Compute live KPI aggregates for today
  const todayBookings = bookings.filter((b) => b.date === today && b.paymentStatus !== 'cancelled');
  const todayRevenue = todayBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const activeCourtsCount = courts.filter((c) => c.status === 'in_play').length;
  const todayCheckInsCount = checkIns.filter((c) => c.date === today).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Kanit','Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Header */}
      <Header
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenBooking={() => {
          setPreSelectedCourtId(undefined);
          setIsBookingOpen(true);
        }}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        activeCourtsCount={activeCourtsCount}
        totalCheckInsCount={todayCheckInsCount}
        todayRevenue={todayRevenue}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Quick Action Banner with QR & Excel Shortcuts */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-600/30">
          <div className="space-y-1.5 z-10 max-w-xl">
            <span className="text-[11px] font-bold tracking-widest text-emerald-300 uppercase bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> ระบบเช็คอินอัตโนมัติ Real-Time
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight pt-1">
              สแกน QR Code เช็คอินสนาม & สรุปรายงานรายวันเป็น Excel
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              รองรับทั้งการสแกนผ่านกล้องโทรศัพท์/แท็บเล็ตหน้าเคาน์เตอร์, บันทึกการใช้สนามแบบเรียลไทม์ และดาวน์โหลดไฟล์สเปรดชีต Excel (.xlsx) เพื่อทำรายงานสรุปยอดผู้ใช้งานและรายได้ประจำวัน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>เปิดกล้องสแกน QR</span>
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center gap-2 backdrop-blur-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>สรุปยอด Excel (.xlsx)</span>
            </button>
          </div>

          {/* Decorative Badminton Background Glow */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        </div>

        {/* Section 1: Badminton Courts Grid */}
        <section>
          <CourtGrid
            courts={courts}
            bookings={bookings}
            onOpenBookingModal={(courtId) => {
              setPreSelectedCourtId(courtId);
              setIsBookingOpen(true);
            }}
            onOpenQrScanner={() => setIsScannerOpen(true)}
            onOpenTicketModal={(booking) => setTicketModalBooking(booking)}
            onCheckOutSession={handleCheckOut}
            onUpdateCourtStatus={handleUpdateCourtStatus}
            onToggleLighting={handleToggleLighting}
          />
        </section>

        {/* Section 2: Real-time Check-in Logs Table */}
        <section>
          <CheckInLogsTable
            checkIns={checkIns}
            bookings={bookings}
            onCheckOut={handleCheckOut}
            onViewTicket={(booking) => setTicketModalBooking(booking)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Badminton Court Manager</span>
            <span>•</span>
            <span>ระบบเช็คอิน QR Code & ออกรายงาน Excel รายวัน</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetSampleData}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              title="รีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้น"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูลตัวอย่าง</span>
            </button>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">Status: All Systems Online</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        bookings={bookings}
        onCheckInSuccess={(bookingId, method) => {
          handleCheckInSuccess(bookingId, method);
        }}
      />

      {/* 2. New Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        courts={courts}
        players={players}
        preSelectedCourtId={preSelectedCourtId}
        onSaveBooking={handleSaveBooking}
      />

      {/* 3. Daily Executive Report & Excel Export Modal */}
      <DailyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        bookings={bookings}
        checkIns={checkIns}
        players={players}
      />

      {/* 4. Player Directory Modal */}
      <PlayerDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        players={players}
        onAddPlayer={(newPlayer) => {
          setPlayers((prev) => [newPlayer, ...prev]);
          showNotification(`✓ บันทึกข้อมูลผู้ใช้งาน ${newPlayer.name} เรียบร้อยแล้ว`);
        }}
      />

      {/* 5. QR Ticket Modal */}
      <QrTicketModal
        booking={ticketModalBooking}
        onClose={() => setTicketModalBooking(null)}
        onSimulateScan={(code) => {
          const matched = bookings.find((b) => b.bookingCode === code);
          if (matched) {
            handleCheckInSuccess(matched.id, 'qr_scan');
          }
        }}
      />
    </div>
  );
}
