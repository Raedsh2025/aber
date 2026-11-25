import type { MyShipment } from '@/domain/entities/MyShipment';
import type { AccountRepository } from '@/domain/repositories/AccountRepository';
import { http } from '../http/httpClient';

export class ApiAccountRepository implements AccountRepository {
  async listMyShipments(): Promise<MyShipment[]> {
    const res = await http.get<{ data: MyShipment[] }>('/my/shipments');
    return res.data.data;
  }
}
