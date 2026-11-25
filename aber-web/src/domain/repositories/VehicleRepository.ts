import type { Vehicle } from '../entities/Vehicle';

export interface CreateVehicleInput {
  plateNumber: string;
  capacityKg: number;
}

export interface VehicleRepository {
  list(): Promise<Vehicle[]>;
  create(input: CreateVehicleInput): Promise<Vehicle>;
}
