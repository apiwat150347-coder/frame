export type CourtType = 'standard_rubber' | 'parquet_wood' | 'vip_aircon';

export type CourtStatus = 'available' | 'booked' | 'in_play' | 'cleaning';

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  pricePerHour: number;
  status: CourtStatus;
  currentBookingId?: string;
  lightingStatus?: 'on' | 'off';
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type MemberType = 'member' | 'guest';

export interface Player {
  id: string;
  code: string; // e.g. PL-8821
  name: string;
  phone: string;
  email?: string;
  lineId?: string;
  skillLevel: SkillLevel;
  memberType: MemberType;
  totalVisits: number;
  totalHours: number;
  totalSpent: number;
  createdAt: string;
  notes?: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'cancelled';
export type CheckInStatus = 'not_checked_in' | 'checked_in' | 'completed';

export interface Booking {
  id: string;
  bookingCode: string; // e.g. BDM-240920-001
  courtId: string;
  courtName: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hours: number;
  courtFee: number;
  racketRentalQty: number;
  shuttlecockQty: number;
  equipmentFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  checkInStatus: CheckInStatus;
  checkedInAt?: string; // ISO or HH:mm
  checkedOutAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CheckInLog {
  id: string;
  bookingId: string;
  bookingCode: string;
  courtId: string;
  courtName: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string;
  sessionStartTime: string;
  sessionEndTime: string;
  status: 'active' | 'completed' | 'cancelled';
  method: 'qr_scan' | 'manual';
  notes?: string;
}

export interface DailySummaryStats {
  date: string;
  totalCheckIns: number;
  uniquePlayers: number;
  totalBookings: number;
  totalHours: number;
  totalRevenue: number;
  courtRevenue: number;
  equipmentRevenue: number;
  utilizationRate: number; // percentage 0-100
  peakHour: string;
  activeCourtsNow: number;
  courtPerformance: {
    courtId: string;
    courtName: string;
    type: CourtType;
    hours: number;
    revenue: number;
    bookingsCount: number;
  }[];
}
