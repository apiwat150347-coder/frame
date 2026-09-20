import React, { useState } from 'react';
import { Booking, Court, Player } from '../types';
import { getTodayDateString } from '../utils/sampleData';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  DollarSign,
  Plus,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  players: Player[];
  preSelectedCourtId?: string;
  onSaveBooking: (newBooking: Booking, newPlayer?: Player, checkInImmediately?: boolean) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  courts,
  players,
  preSelectedCourtId,
  onSaveBooking,
}) => {
  const today = getTodayDateString();
  const [courtId, setCourtId] = useState<string>(preSelectedCourtId || courts[0]?.id || 'court-1');
  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>('18:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [selectedPlayerMode, setSelectedPlayerMode] = useState<'existing' | 'new'>('existing');

  // Existing player
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');

  // New player fields
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerLine, setNewPlayerLine] = useState('');
  const [newPlayerSkill, setNewPlayerSkill] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [newPlayerType, setNewPlayerType] = useState<'member' | 'guest'>('guest');

  // Add-ons & equipment
  const [racketQty, setRacketQty] = useState<number>(0);
  const [shuttlecockQty, setShuttlecockQty] = useState<number>(1);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [checkInImmediately, setCheckInImmediately] = useState<boolean>(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Calculate hours
  const startHour = parseInt(startTime.split(':')[0] || '0', 10);
  const startMin = parseInt(startTime.split(':')[1] || '0', 10);
  const endHour = parseInt(endTime.split(':')[0] || '0', 10);
  const endMin = parseInt(endTime.split(':')[1] || '0', 10);
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  const hours = Math.max(0.5, totalMinutes > 0 ? totalMinutes / 60 : 1);

  const selectedCourt = courts.find((c) => c.id === courtId) || courts[0];
  const courtFee = Math.round(hours * (selectedCourt?.pricePerHour || 200));
  const equipmentFee = racketQty * 50 + shuttlecockQty * 85;
  const totalAmount = courtFee + equipmentFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPlayerId = selectedPlayerId;
    let finalPlayerName = '';
    let finalPlayerPhone = '';
    let createdPlayer: Player | undefined;

    if (selectedPlayerMode === 'new') {
      if (!newPlayerName.trim() || !newPlayerPhone.trim()) {
        alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ของผู้ใช้งาน');
        return;
      }
      finalPlayerId = `pl-${Date.now().toString().slice(-4)}`;
      finalPlayerName = newPlayerName.trim();
      finalPlayerPhone = newPlayerPhone.trim();

      createdPlayer = {
        id: finalPlayerId,
        code: `PL-${Math.floor(1000 + Math.random() * 9000)}`,
        name: finalPlayerName,
        phone: finalPlayerPhone,
        lineId: newPlayerLine.trim() || undefined,
        skillLevel: newPlayerSkill,
        memberType: newPlayerType,
        totalVisits: 1,
        totalHours: hours,
        totalSpent: totalAmount,
        createdAt: today,
        notes: notes || undefined,
      };
    } else {
      const existing = players.find((p) => p.id === selectedPlayerId);
      if (existing) {
        finalPlayerName = existing.name;
        finalPlayerPhone = existing.phone;
      } else {
        finalPlayerName = 'ลูกค้าทั่วไป';
        finalPlayerPhone = '080-000-0000';
      }
    }

    const bookingId = `bk-${Date.now().toString().slice(-4)}`;
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const dateFormatted = date.replace(/-/g, '').slice(2);
    const bookingCode = `BDM-${dateFormatted}-${randomSeq}`;

    const newBooking: Booking = {
      id: bookingId,
      bookingCode,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      playerId: finalPlayerId,
      playerName: finalPlayerName,
      playerPhone: finalPlayerPhone,
      date,
      startTime,
      endTime,
      hours,
      courtFee,
      racketRentalQty: racketQty,
      shuttlecockQty,
      equipmentFee,
      totalAmount,
      paymentStatus,
      checkInStatus: checkInImmediately ? 'checked_in' : 'not_checked_in',
      checkedInAt: checkInImmediately ? new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : undefined,
      notes,
      createdAt: `${today} ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
    };

    onSaveBooking(newBooking, createdPlayer, checkInImmediately);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">สร้างการจองสนาม & เช็คอิน</h3>
              <p className="text-xs text-emerald-100/80">ระบบบันทึกเวลา รายได้ และสร้าง QR Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Court & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> เลือกสนาม
              </label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
              >
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (฿{c.pricePerHour}/ชม. - {c.type === 'vip_aircon' ? 'VIP แอร์' : c.type === 'parquet_wood' ? 'ปาร์เก้' : 'ยางเขียว'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> วันที่เข้าใช้งาน
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                required
              />
            </div>
          </div>

          {/* Time Slot */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> เวลาเริ่ม
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> เวลาสิ้นสุด
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                required
              />
            </div>
            <div className="col-span-2 text-right text-xs text-slate-500 font-medium">
              ระยะเวลา: <strong className="text-emerald-700 font-bold">{hours} ชั่วโมง</strong> (ค่าสนาม ฿{courtFee})
            </div>
          </div>

          {/* Player Selection */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> ข้อมูลผู้ใช้งาน / สมาชิก
              </span>
              <div className="flex text-xs bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectedPlayerMode('existing')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    selectedPlayerMode === 'existing'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  เลือกจากรายชื่อ
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerMode('new')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    selectedPlayerMode === 'new'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  + ลงทะเบียนใหม่
                </button>
              </div>
            </div>

            {selectedPlayerMode === 'existing' ? (
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  เลือกผู้เล่นที่เคยบันทึกไว้ในระบบ ({players.length} คน)
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone}) - {p.memberType === 'member' ? 'สมาชิก' : 'ทั่วไป'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      ชื่อ-นามสกุล / ชื่อเล่น *
                    </label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="เช่น คุณกฤษฎา (แบงค์)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      required={selectedPlayerMode === 'new'}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      เบอร์โทรศัพท์ *
                    </label>
                    <input
                      type="tel"
                      value={newPlayerPhone}
                      onChange={(e) => setNewPlayerPhone(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      required={selectedPlayerMode === 'new'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">LINE ID</label>
                    <input
                      type="text"
                      value={newPlayerLine}
                      onChange={(e) => setNewPlayerLine(e.target.value)}
                      placeholder="line id"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">ระดับฝีมือ</label>
                    <select
                      value={newPlayerSkill}
                      onChange={(e) => setNewPlayerSkill(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="beginner">มือใหม่</option>
                      <option value="intermediate">ปานกลาง</option>
                      <option value="advanced">ขั้นสูง</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">ประเภท</label>
                    <select
                      value={newPlayerType}
                      onChange={(e) => setNewPlayerType(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="member">สมาชิก</option>
                      <option value="guest">ทั่วไป</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Equipment & Add-ons */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> อุปกรณ์เสริมและบริการ
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-xs">
                  <span className="font-medium text-slate-800">เช่าไม้แบด</span>
                  <p className="text-[10px] text-slate-400">฿50/ไม้</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRacketQty(Math.max(0, racketQty - 1))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{racketQty}</span>
                  <button
                    type="button"
                    onClick={() => setRacketQty(racketQty + 1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-xs">
                  <span className="font-medium text-slate-800">ซื้อลูกแบด</span>
                  <p className="text-[10px] text-slate-400">฿85/หลอด</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShuttlecockQty(Math.max(0, shuttlecockQty - 1))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{shuttlecockQty}</span>
                  <button
                    type="button"
                    onClick={() => setShuttlecockQty(shuttlecockQty + 1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status & Immediate Check-in */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">การชำระเงิน:</span>
              <button
                type="button"
                onClick={() => setPaymentStatus(paymentStatus === 'paid' ? 'pending' : 'paid')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {paymentStatus === 'paid' ? '✓ ชำระแล้ว' : '○ รอชำระเงิน'}
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={checkInImmediately}
                onChange={(e) => setCheckInImmediately(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>เช็คอินเข้าสนามทันที (Walk-in)</span>
            </label>
          </div>

          {/* Pricing Summary Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div className="text-xs text-emerald-900 space-y-0.5">
              <p>
                ค่าสนาม {hours} ชม. (฿{courtFee}) + ค่าอุปกรณ์ (฿{equipmentFee})
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                รวมสุทธิที่ต้องจัดเก็บ:
              </p>
            </div>
            <div className="text-xl font-extrabold text-emerald-700">
              ฿{totalAmount.toLocaleString()}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {checkInImmediately ? 'ยืนยันจองและเริ่มเล่นทันที' : 'บันทึกการจองและออก QR Code'}
          </button>
        </div>
      </div>
    </div>
  );
};
