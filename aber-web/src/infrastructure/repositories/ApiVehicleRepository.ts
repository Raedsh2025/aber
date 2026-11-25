import type { Vehicle } from '@/domain/entities/Vehicle';
import type {
  CreateVehicleInput,
  VehicleRepository,
} from '@/domain/repositories/VehicleRepository';
import { http } from '../http/httpClient';

export class ApiVehicleRepository implements VehicleRepository {
  async list(): Promise<Vehicle[]> {
    const res = await http.get<{ data: Vehicle[] }>('/vehicles');
    return res.data.data;
  }

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const res = await http.post<{ data: Vehicle }>('/vehicles', input);
    return res.data.data;
  }
}
