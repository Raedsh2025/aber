import type { MyShipment } from '../entities/MyShipment';

export interface AccountRepository {
  listMyShipments(): Promise<MyShipment[]>;
}
