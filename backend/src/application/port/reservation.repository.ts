import type {
  Reservation,
  ReservationStatus,
  ReservationWithItems,
  ReservationWithPaymentTotal,
} from '../../domain/entities/reservation.entity';
import type { ReservationDiscountType } from '../../domain/entities/reservationItem.entity';
import type {
  ReservationPayment,
  ReservationPaymentBalance,
  ReservationPaymentMethod,
} from '../../domain/entities/reservationPayment.entity';

export interface CreateReservationItemData {
  productId: string;
  quantity: number;
  unitPrice: string;
  discountType: ReservationDiscountType | null;
  discountValue: string | null;
  lineTotal: string;
}

export interface CreateReservationData {
  clientId: string;
  dueDate: string;
  status: ReservationStatus;
  totalAmount: string;
  items: CreateReservationItemData[];
}

export interface CreateReservationPaymentData {
  reservationId: string;
  amount: string;
  paymentMethod: ReservationPaymentMethod;
}

export interface CancelReservationData {
  id: string;
  reason: string;
  confirmWithPayments: boolean;
}

export interface IReservationRepository {
  findAll(): Promise<ReservationWithPaymentTotal[]>;
  create(data: CreateReservationData): Promise<ReservationWithItems>;
  getPaymentBalance(id: string): Promise<ReservationPaymentBalance | null>;
  findPayments(
    id: string,
  ): Promise<{ totalAmount: string; payments: ReservationPayment[] } | null>;
  createPayment(data: CreateReservationPaymentData): Promise<{
    payment: ReservationPayment;
    totalAmount: string;
    totalPaidBefore: string;
  }>;
  cancel(data: CancelReservationData): Promise<Reservation>;
}
