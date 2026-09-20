import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { Booking } from '../types';
import { playErrorBeep, playSuccessBeep } from '../utils/sound';
import {
  Camera,
  CameraOff,
  CheckCircle,
  FileImage,
  Keyboard,
  RefreshCw,
  ScanLine,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onCheckInSuccess: (bookingId: string, method: 'qr_scan' | 'manual') => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onCheckInSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    details?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Start live camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setStatusMessage(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // prefer back camera on phones
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        scanFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเปิดกล้องได้ โปรดอนุญาตสิทธิ์กล้องในเบราว์เซอร์';
      setCameraError(errMsg);
      setIsScanning(false);
    }
  };

  // Scan frame from video feed using jsQR
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleProcessQrCode(code.data);
        return; // stop scanning while processing
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Process scanned or uploaded code
  const handleProcessQrCode = (rawContent: string) => {
    let cleanCode = rawContent.trim();

    // Try parsing if it's JSON payload
    try {
      if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
        const parsed = JSON.parse(cleanCode);
        if (parsed.bookingCode) {
          cleanCode = parsed.bookingCode;
        }
      }
    } catch {
      // not json, use raw string
    }

    // Match against bookings
    const matched = bookings.find(
      (b) =>
        b.bookingCode.toLowerCase() === cleanCode.toLowerCase() ||
        b.id.toLowerCase() === cleanCode.toLowerCase() ||
        b.playerId.toLowerCase() === cleanCode.toLowerCase() ||
        b.playerPhone.replace(/[^0-9]/g, '') === cleanCode.replace(/[^0-9]/g, '')
    );

    if (matched) {
      if (matched.checkInStatus === 'checked_in') {
        playErrorBeep();
        setStatusMessage({
          type: 'info',
          text: 'เช็คอินอยู่แล้ว!',
          details: `${matched.playerName} ได้เช็คอินที่ ${matched.courtName} เรียบร้อยแล้วตั้งแต่ ${matched.checkedInAt || 'ก่อนหน้านี้'}`,
        });
        return;
      }

      if (matched.checkInStatus === 'completed') {
        playErrorBeep();
        setStatusMessage({
          type: 'info',
          text: 'รอบการเล่นนี้เสร็จสิ้นแล้ว',
          details: `รหัส ${matched.bookingCode} เล่นเสร็จสิ้นแล้วเมื่อ ${matched.checkedOutAt || '-'}`,
        });
        return;
      }

      // Valid check-in!
      playSuccessBeep();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setStatusMessage({
        type: 'success',
        text: 'เช็คอินสำเร็จ! ✓',
        details: `คุณ ${matched.playerName} เข้าใช้งาน ${matched.courtName} (${matched.startTime} - ${matched.endTime})`,
      });

      onCheckInSuccess(matched.id, activeTab === 'manual' ? 'manual' : 'qr_scan');
    } else {
      playErrorBeep();
      setStatusMessage({
        type: 'error',
        text: 'ไม่พบข้อมูลการจอง',
        details: `รหัส "${cleanCode}" ไม่ตรงกับรายการจองที่มีในระบบ โปรดตรวจสอบอีกครั้ง`,
      });
    }
  };

  // Upload image QR scanner
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleProcessQrCode(code.data);
          } else {
            playErrorBeep();
            setStatusMessage({
              type: 'error',
              text: 'ไม่พบ QR Code ในรูปภาพ',
              details: 'โปรดอัปโหลดภาพ QR Code ที่คมชัดและไม่มีสิ่งบดบัง',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Manual Code Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessQrCode(manualCode);
    setManualCode('');
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const pendingBookings = bookings.filter((b) => b.checkInStatus === 'not_checked_in');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ScanLine className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight flex items-center gap-1.5">
                สแกนเช็คอิน QR Code
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
                  Realtime
                </span>
              </h3>
              <p className="text-xs text-slate-400">ลงทะเบียนผู้ใช้งาน & เปิดระบบใช้งานสนาม</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('camera');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'camera'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-xs'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            สแกนผ่านกล้อง
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-xs'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <FileImage className="w-4 h-4" />
            อัปโหลดรูป QR
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('manual');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'manual'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-xs'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            กรอกรหัสจอง / เบอร์โทร
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-800">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                  <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative">
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                    {/* Animated Scanning Laser */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                  <p className="text-white/90 text-xs mt-4 font-medium tracking-wide bg-slate-900/70 px-3 py-1 rounded-full">
                    จัดตำแหน่ง QR Code ให้อยู่ในกรอบ
                  </p>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
                    <CameraOff className="w-10 h-10 text-rose-400 mb-2" />
                    <p className="font-medium text-sm text-rose-200 mb-1">ไม่สามารถเข้าถึงกล้องได้</p>
                    <p className="text-xs text-slate-400 mb-4 max-w-xs">{cameraError}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่
                      </button>
                      <button
                        onClick={() => setActiveTab('manual')}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                      >
                        กรอกรหัสแทน
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between w-full max-w-sm text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  กล้องกำลังทำงาน
                </span>
                <button
                  onClick={startCamera}
                  className="hover:text-slate-800 text-emerald-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> รีเฟรชกล้อง
                </button>
              </div>
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <FileImage className="w-7 h-7" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">คลิกเพื่อเลือกไฟล์รูปภาพ QR Code</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  รองรับไฟล์ PNG, JPG, WEBP หรือภาพแคปเจอร์หน้าจอจากมือถือ
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  เลือกไฟล์รูปภาพ
                </button>
              </div>
            </div>
          )}

          {/* MANUAL CODE TAB */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  กรอกรหัสการจอง หรือ เบอร์โทรศัพท์ลูกค้า
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="เช่น BDM-260920-004 หรือ 081-456-7890"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-500 text-sm font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs whitespace-nowrap"
                  >
                    ยืนยันเช็คอิน
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Tip: สามารถใช้ค้นหาได้ทั้งรหัสการจอง (Booking Code), รหัสสมาชิก (Player Code) หรือเบอร์โทร
              </p>
            </form>
          )}

          {/* STATUS NOTIFICATION */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'info'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'info' ? (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className="font-semibold text-sm">{statusMessage.text}</h5>
                {statusMessage.details && (
                  <p className="text-xs mt-0.5 opacity-90">{statusMessage.details}</p>
                )}
              </div>
            </div>
          )}

          {/* QUICK TEST CHECK-IN SHORTCUTS (Real testing convenience) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                รายการจองที่รอเช็คอินวันนี้ ({pendingBookings.length} รายการ)
              </span>
              <span className="text-[11px] text-slate-400">คลิกเพื่อทดสอบจำลองสแกน</span>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                ผู้ใช้งานทั้งหมดได้เช็คอินเรียบร้อยแล้ว
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pendingBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleProcessQrCode(b.bookingCode)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                          {b.courtName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {b.startTime} - {b.endTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{b.playerName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                        {b.bookingCode}
                      </span>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        กดเช็คอิน &rarr;
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
