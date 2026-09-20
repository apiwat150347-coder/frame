import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Booking } from '../types';
import { X, Download, Copy, Check, QrCode, Calendar, Clock, MapPin, User, Phone, CheckCircle2 } from 'lucide-react';

interface QrTicketModalProps {
  booking: Booking | null;
  onClose: () => void;
  onSimulateScan?: (code: string) => void;
}

export const QrTicketModal: React.FC<QrTicketModalProps> = ({
  booking,
  onClose,
  onSimulateScan,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!booking) return;
    const qrPayload = JSON.stringify({
      type: 'BADMINTON_CHECKIN',
      bookingCode: booking.bookingCode,
      courtId: booking.courtId,
      playerId: booking.playerId,
      name: booking.playerName,
      date: booking.date,
    });

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [booking]);

  if (!booking) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_Checkin_${booking.bookingCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">บัตรคิวอาร์โค้ดเช็คอินสนาม</h3>
              <p className="text-xs text-emerald-100/90">Digital Badminton Court Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/20 transition-colors"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Content */}
        <div className="p-6">
          {/* Status Chip */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-500">
              รหัสจอง: <strong className="text-slate-800 font-mono">{booking.bookingCode}</strong>
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                booking.checkInStatus === 'checked_in'
                  ? 'bg-emerald-100 text-emerald-700'
                  : booking.checkInStatus === 'completed'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {booking.checkInStatus === 'checked_in'
                ? '● กำลังใช้งาน'
                : booking.checkInStatus === 'completed'
                ? '✓ เช็คเอาท์แล้ว'
                : '○ รอสแกนเช็คอิน'}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR Code สำหรับเช็คอิน"
                className="w-52 h-52 object-contain bg-white p-2 rounded-lg shadow-xs"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                กำลังสร้าง QR Code...
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2 text-center">
              นำ QR Code นี้มาสแกนที่กล้องหน้าสนาม หรือที่เคาน์เตอร์เพื่อเปิดไฟสนามอัตโนมัติ
            </p>
          </div>

          {/* Booking Summary Details */}
          <div className="mt-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center text-slate-500 text-xs">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> สนามที่จอง:
              </span>
              <span className="font-semibold text-slate-900">{booking.courtName}</span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center text-slate-500 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" /> วันที่:
              </span>
              <span className="font-medium text-slate-800">{booking.date}</span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center text-slate-500 text-xs">
                <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" /> เวลา:
              </span>
              <span className="font-bold text-emerald-700">
                {booking.startTime} - {booking.endTime} ({booking.hours} ชม.)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center text-slate-500 text-xs">
                <User className="w-3.5 h-3.5 mr-1 text-emerald-600" /> ผู้จอง:
              </span>
              <span className="font-medium text-slate-800">{booking.playerName}</span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center text-slate-500 text-xs">
                <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" /> เบอร์โทร:
              </span>
              <span className="font-mono text-slate-700 text-xs">{booking.playerPhone}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกรหัส</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadQr}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>บันทึกรูป QR</span>
            </button>
          </div>

          {/* Quick simulation test button */}
          {booking.checkInStatus !== 'completed' && onSimulateScan && (
            <button
              onClick={() => {
                onSimulateScan(booking.bookingCode);
                onClose();
              }}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-emerald-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ทดสอบจำลองสแกนเช็คอินใบนี้ทันที</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
