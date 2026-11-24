import { create } from 'zustand';
import { shipmentRepository } from '@/app/container';
import type { Shipment } from '@/domain/entities/Shipment';
import type { ShipmentFilters } from '@/domain/repositories/ShipmentRepository';

interface ShipmentState {
  items: Shipment[];
  loading: boolean;
  error: string | null;
  fetch: (filters?: ShipmentFilters) => Promise<void>;
  upsert: (shipment: Shipment) => void;
}

export const useShipmentStore = create<ShipmentState>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (filters) => {
    set({ loading: true, error: null });
    try {
      const items = await shipmentRepository.list(filters);
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'تعذّر تحميل الشحنات' });
    }
  },

  // Replace one item after its status changed, without reloading the whole list.
  upsert: (shipment) =>
    set((state) => ({
      items: state.items.some((s) => s.id === shipment.id)
        ? state.items.map((s) => (s.id === shipment.id ? shipment : s))
        : [shipment, ...state.items],
    })),
}));
