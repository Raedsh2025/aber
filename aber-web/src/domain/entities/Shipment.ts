export type ShipmentStatus =
  'received' | 'loaded' | 'in_transit' | 'arrived' | 'delivered' | 'returned' | 'issue';

export type GoodsType = 'normal' | 'fragile' | 'refrigerated';

export interface Shipment {
  id: string;
  trackingNumber: string;
  companyId: string;
  originBranchId: string;
  destBranchId: string;
  tripId: string | null;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  goodsType: GoodsType;
  weightKg: number;
  price: number;
  codAmount: number;
  status: ShipmentStatus;
  createdAt: string; // ISO
  deliveryOtp?: string; // Shown only once, in the create response.
}

export interface StatusHistoryItem {
  status: ShipmentStatus;
  changedAt: string;
  note: string | null;
}

/** What a customer sees on the public tracking page (no sensitive data). */
export interface PublicTracking {
  trackingNumber: string;
  status: ShipmentStatus;
  originGovernorate: string;
  destGovernorate: string;
  history: StatusHistoryItem[];
}

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  received: 'مستلمة',
  loaded: 'محمّلة',
  in_transit: 'في الطريق',
  arrived: 'وصلت الفرع',
  delivered: 'سُلّمت',
  returned: 'مرتجعة',
  issue: 'مشكلة',
};

export const GOODS_TYPE_LABEL: Record<GoodsType, string> = {
  normal: 'عادية',
  fragile: 'قابلة للكسر',
  refrigerated: 'مبرّدة',
};
