import type {
  ReservationStatus,
  ReservationWithItems,
} from '../../domain/entities/reservation.entity';
import type { ReservationDiscountType } from '../../domain/entities/reservationItem.entity';

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

export interface IReservationRepository {
  findAll(): Promise<ReservationWithItems[]>;
  create(data: CreateReservationData): Promise<ReservationWithItems>;
}
