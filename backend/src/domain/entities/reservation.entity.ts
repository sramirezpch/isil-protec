import type { ReservationItem } from './reservationItem.entity';

export type ReservationStatus = 'VIGENTE';
export type ReservationType = 'RESERVA' | 'PREVENTA';

export interface Reservation {
  id: string;
  clientId: string;
  dueDate: string;
  status: ReservationStatus;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ReservationWithItems extends Reservation {
  type: ReservationType;
  client?: {
    id: string;
    name: string | null;
    lastName: string | null;
    phone: string;
  };
  items: ReservationItemWithProduct[];
}

export interface ReservationWithPaymentTotal extends ReservationWithItems {
  totalPaid: string;
}

export interface ReservationWithPaymentSummary
  extends ReservationWithPaymentTotal {
  pendingBalance: string;
}

export interface ReservationItemWithProduct extends ReservationItem {
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}
