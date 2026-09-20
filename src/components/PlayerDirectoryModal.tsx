import React, { useState } from 'react';
import { Player } from '../types';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Clock,
  Trophy,
  X,
  QrCode,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import QRCode from 'qrcode';

interface PlayerDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (player: Player) => void;
}

export const PlayerDirectoryModal: React.FC<PlayerDirectoryModalProps> = ({
  isOpen,
  onClose,
  players,
  onAddPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'member' | 'guest'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Player Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('');
  const [skillLevel, setSkillLevel] = useState<Player['skillLevel']>('intermediate');
  const [memberType, setMemberType] = useState<Player['memberType']>('member');
  const [notes, setNotes] = useState('');

  // Selected player for viewing QR Membership Card
  const [qrCardPlayer, setQrCardPlayer] = useState<Player | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  if (!isOpen) return null;

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || p.memberType === filterType;
    return matchesSearch && matchesType;
  });

  const handleShowQrCard = (player: Player) => {
    setQrCardPlayer(player);
    const payload = JSON.stringify({
      type: 'PLAYER_MEMBERSHIP',
      playerCode: player.code,
      name: player.name,
      phone: player.phone,
    });
    QRCode.toDataURL(payload, { width: 280, margin: 2 })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate player card QR', err));
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newPlayer: Player = {
      id: `pl-${Date.now().toString().slice(-4)}`,
      code: `PL-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      lineId: lineId.trim() || undefined,
      skillLevel,
      memberType,
      totalVisits: 0,
      totalHours: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    onAddPlayer(newPlayer);
    setIsAddingNew(false);
    setName('');
    setPhone('');
    setEmail('');
    setLineId('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                ทะเบียนข้อมูลผู้ใช้งานสนามแบดมินตัน
              </h3>
              <p className="text-xs text-emerald-100/80">
                ประวัติการเข้าใช้งาน บัตรสมาชิกดิจิทัล และบันทึกข้อมูลติดต่อ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อผู้เล่น เบอร์โทร หรือรหัสสมาชิก..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl shadow-xs focus:outline-emerald-600"
              />
            </div>

            <div className="flex text-xs bg-slate-200/70 p-0.5 rounded-lg">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  filterType === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterType('member')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  filterType === 'member' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                สมาชิก
              </button>
              <button
                onClick={() => setFilterType('guest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  filterType === 'guest' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ทั่วไป
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {isAddingNew ? 'ปิดฟอร์ม' : '+ เพิ่มผู้ใช้งานใหม่'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Add New Player Form */}
          {isAddingNew && (
            <form
              onSubmit={handleCreatePlayer}
              className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150"
            >
              <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" /> ลงทะเบียนผู้ใช้งานใหม่
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ชื่อ-นามสกุล / ชื่อเล่น *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น คุณกฤษฎา (แบงค์)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    LINE ID
                  </label>
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="line_id"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ระดับฝีมือ
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="beginner">มือใหม่ (Beginner)</option>
                    <option value="intermediate">ปานกลาง (Intermediate)</option>
                    <option value="advanced">แข่งขัน/มือโปร (Advanced)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ประเภทผู้ใช้งาน
                  </label>
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="member">สมาชิกประจำ (Member)</option>
                    <option value="guest">ลูกค้าทั่วไป (Guest)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    หมายเหตุ / ความต้องการพิเศษ
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น ชอบคอร์ท 4 ไม้ปาร์เก้"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  บันทึกข้อมูลผู้ใช้งาน
                </button>
              </div>
            </form>
          )}

          {/* Players Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">รหัส</th>
                  <th className="py-2.5 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-2.5 px-3">เบอร์ติดต่อ / LINE</th>
                  <th className="py-2.5 px-3 text-center">ระดับฝีมือ</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                  <th className="py-2.5 px-3 text-center">มาเล่นแล้ว</th>
                  <th className="py-2.5 px-4 text-right">ยอดสะสม</th>
                  <th className="py-2.5 px-4 text-center">QR Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลผู้ใช้งานที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.code}</td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block font-semibold">{p.name}</strong>
                        {p.notes && <span className="text-[11px] text-slate-400">{p.notes}</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" /> {p.phone}
                        </div>
                        {p.lineId && (
                          <span className="text-[10px] text-slate-500">LINE: {p.lineId}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.skillLevel === 'advanced'
                              ? 'bg-rose-100 text-rose-700'
                              : p.skillLevel === 'intermediate'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {p.skillLevel === 'advanced'
                            ? 'ขั้นสูง'
                            : p.skillLevel === 'intermediate'
                            ? 'ปานกลาง'
                            : 'มือใหม่'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            p.memberType === 'member'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.memberType === 'member' ? '★ สมาชิก' : 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700">
                        <strong>{p.totalVisits}</strong> ครั้ง ({p.totalHours} ชม.)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ฿{p.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleShowQrCard(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                          title="ดู QR บัตรสมาชิก"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>บัตร QR</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Mini QR Membership Card Preview Modal */}
      {qrCardPlayer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-emerald-800">บัตรสมาชิกสนามแบดมินตัน</span>
              <button
                onClick={() => setQrCardPlayer(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Member QR" className="w-44 h-44 rounded-lg" />
              ) : null}
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">{qrCardPlayer.name}</h4>
              <p className="text-xs font-mono text-slate-500">รหัส: {qrCardPlayer.code}</p>
              <p className="text-xs text-slate-500">โทร: {qrCardPlayer.phone}</p>
            </div>
            <p className="text-[11px] text-slate-400">
              ผู้เล่นสามารถใช้ QR Code นี้ในการสแกนเช็คอินที่สนามได้ทันที
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
