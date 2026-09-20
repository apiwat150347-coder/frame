import * as XLSX from 'xlsx';
import { Booking, CheckInLog, DailySummaryStats, Player } from '../types';

export function exportDailyReportToExcel(
  stats: DailySummaryStats,
  checkIns: CheckInLog[],
  bookings: Booking[],
  players: Player[]
) {
  const wb = XLSX.utils.book_new();

  // 1. SHEET 1: สรุปภาพรวมรายวัน (Executive Summary)
  const summaryData = [
    ['รายงานสรุปยอดการใช้งานสนามแบดมินตันประจำวัน (Daily Badminton Court Summary Report)'],
    ['วันที่จัดทำรายงาน (Report Date):', stats.date],
    ['พิมพ์เมื่อ (Generated At):', new Date().toLocaleString('th-TH')],
    [],
    ['--- ข้อมูลตัวชี้วัดหลักประจำวัน (Key Performance Indicators) ---'],
    ['ตัวชี้วัด (Metric)', 'ค่าสถิติ (Value)', 'หน่วย (Unit)'],
    ['ยอดผู้เล่นที่สแกนเช็คอิน (Total Check-ins)', stats.totalCheckIns, 'ครั้ง'],
    ['จำนวนผู้เล่นที่มาใช้งาน (Unique Players)', stats.uniquePlayers, 'คน'],
    ['จำนวนการจองสนามทั้งหมด (Total Bookings)', stats.totalBookings, 'รายการ'],
    ['ชั่วโมงการใช้งานสนามรวม (Total Court Hours)', stats.totalHours, 'ชั่วโมง'],
    ['อัตราการใช้งานพื้นที่สนาม (Court Utilization Rate)', `${stats.utilizationRate.toFixed(1)}%`, 'เปอร์เซ็นต์'],
    ['ช่วงเวลาที่มีผู้ใช้งานสูงสุด (Peak Hours)', stats.peakHour || '-', 'น.'],
    ['รายได้ค่าเช่าสนาม (Court Rental Revenue)', stats.courtRevenue, 'บาท (THB)'],
    ['รายได้ค่าอุปกรณ์/ลูกแบด (Equipment & Shuttlecock)', stats.equipmentRevenue, 'บาท (THB)'],
    ['รายได้สุทธิรวมประจำวัน (Total Daily Revenue)', stats.totalRevenue, 'บาท (THB)'],
    [],
    ['--- สรุปสถิติแยกตามรายสนาม (Court Performance Breakdown) ---'],
    ['รหัสสนาม', 'ชื่อสนาม', 'ประเภทสนาม', 'จำนวนการจอง (ครั้ง)', 'ชั่วโมงใช้งาน (ชม.)', 'รายได้ (บาท)'],
    ...stats.courtPerformance.map((c) => {
      let typeName = 'ยางมาตรฐาน (Standard Rubber)';
      if (c.type === 'parquet_wood') typeName = 'ไม้ปาร์เก้ (Wood Parquet)';
      if (c.type === 'vip_aircon') typeName = 'VIP แอร์ (VIP Air-Con)';
      return [c.courtId, c.courtName, typeName, c.bookingsCount, c.hours, c.revenue];
    }),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 45 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปภาพรวมรายวัน');

  // 2. SHEET 2: ประวัติการเช็คอินด้วย QR Code (Check-in Logs)
  const checkInRows = checkIns.map((item, index) => ({
    'ลำดับ (No)': index + 1,
    'รหัสการจอง (Booking Code)': item.bookingCode,
    'วันที่ (Date)': item.date,
    'เวลาสแกนเช็คอิน (Check-in Time)': item.checkInTime,
    'เวลาเช็คเอาท์ (Check-out Time)': item.checkOutTime || 'กำลังเล่นอยู่ / ยังไม่เช็คเอาท์',
    'ช่วงเวลาตามที่จอง (Booked Slot)': `${item.sessionStartTime} - ${item.sessionEndTime}`,
    'ชื่อผู้ใช้งาน (Player Name)': item.playerName,
    'เบอร์โทรศัพท์ (Phone)': item.playerPhone,
    'สนามที่ใช้งาน (Court)': item.courtName,
    'วิธีการเช็คอิน (Method)': item.method === 'qr_scan' ? 'สแกน QR Code' : 'เจ้าหน้าที่ลงชื่อ',
    'สถานะ (Status)':
      item.status === 'active'
        ? 'กำลังใช้งานในสนาม'
        : item.status === 'completed'
        ? 'เสร็จสิ้นการใช้งาน'
        : 'ยกเลิก',
    'หมายเหตุ (Notes)': item.notes || '-',
  }));

  const wsCheckIns = XLSX.utils.json_to_sheet(
    checkInRows.length > 0
      ? checkInRows
      : [
          {
            'ข้อความ': 'ไม่มีข้อมูลการเช็คอินในวันนี้',
          },
        ]
  );
  wsCheckIns['!cols'] = [
    { wch: 10 },
    { wch: 20 },
    { wch: 14 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCheckIns, 'ประวัติการสแกนเช็คอิน');

  // 3. SHEET 3: รายการจองสนาม (Bookings)
  const bookingRows = bookings.map((b, index) => ({
    'ลำดับ (No)': index + 1,
    'รหัสการจอง (Booking Code)': b.bookingCode,
    'วันที่ (Date)': b.date,
    'สนาม (Court)': b.courtName,
    'เวลาเริ่ม (Start)': b.startTime,
    'เวลาสิ้นสุด (End)': b.endTime,
    'จำนวนชั่วโมง (Hours)': b.hours,
    'ชื่อผู้จอง (Customer)': b.playerName,
    'เบอร์โทร (Phone)': b.playerPhone,
    'ค่าเช่าสนาม (Court Fee)': b.courtFee,
    'เช่าไม้แบด (Racket Qty)': b.racketRentalQty,
    'ซื้อลูกแบด (Shuttlecock Qty)': b.shuttlecockQty,
    'ค่าอุปกรณ์เสริม (Equip Fee)': b.equipmentFee,
    'ยอดรวมทั้งหมด (Total THB)': b.totalAmount,
    'สถานะการชำระ (Payment)': b.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอชำระ',
    'สถานะการเช็คอิน (Check-in)':
      b.checkInStatus === 'checked_in'
        ? 'เช็คอินแล้ว'
        : b.checkInStatus === 'completed'
        ? 'เล่นเสร็จแล้ว'
        : 'ยังไม่เช็คอิน',
  }));

  const wsBookings = XLSX.utils.json_to_sheet(
    bookingRows.length > 0 ? bookingRows : [{ ข้อความ: 'ไม่มีรายการจองในวันนี้' }]
  );
  wsBookings['!cols'] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBookings, 'รายการจองสนาม');

  // 4. SHEET 4: ทะเบียนข้อมูลผู้ใช้งาน (Player Directory)
  const playerRows = players.map((p, index) => ({
    'ลำดับ (No)': index + 1,
    'รหัสผู้เล่น (Player Code)': p.code,
    'ชื่อ-นามสกุล (Full Name)': p.name,
    'เบอร์โทรศัพท์ (Phone)': p.phone,
    'อีเมล/LINE (Contact)': p.lineId ? `LINE: ${p.lineId}` : p.email || '-',
    'ประเภทผู้ใช้งาน (Type)': p.memberType === 'member' ? 'สมาชิกประจำ' : 'ลูกค้าทั่วไป',
    'ระดับฝีมือ (Skill)':
      p.skillLevel === 'beginner'
        ? 'มือใหม่ (Beginner)'
        : p.skillLevel === 'intermediate'
        ? 'ปานกลาง (Intermediate)'
        : 'ขั้นสูง (Advanced)',
    'จำนวนครั้งที่เข้าใช้ (Visits)': p.totalVisits,
    'ชั่วโมงสะสม (Total Hours)': p.totalHours,
    'ยอดใช้จ่ายสะสม (Total Spent THB)': p.totalSpent,
    'วันที่ลงทะเบียน (Registered)': p.createdAt,
  }));

  const wsPlayers = XLSX.utils.json_to_sheet(playerRows);
  wsPlayers['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPlayers, 'ฐานข้อมูลผู้ใช้สนาม');

  // Generate binary and trigger download
  const filename = `รายงานการใช้งานสนามแบดมินตัน_${stats.date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
