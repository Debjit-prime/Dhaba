export type UserRole = 'CUSTOMER' | 'KITCHEN_STAFF' | 'VALET_STAFF' | 'ADMIN';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type OrderSource = 'DINE_IN' | 'SWIGGY' | 'ZOMATO';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type ValetStatus = 'PARKED' | 'REQUESTED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
export type ValetPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

export interface MenuItemDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  prepTimeMinutes: number;
  categoryId: string;
  category?: CategoryDTO;
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem: MenuItemDTO;
  quantity: number;
  unitPrice: number;
  customInstructions: string | null;
  isPrepared: boolean;
  createdAt: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  tableId: string | null;
  table?: {
    id: string;
    number: string;
    name: string | null;
  } | null;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  items: OrderItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ValetRequestDTO {
  id: string;
  ticketNumber: string;
  vehicleModel: string;
  vehicleNumber: string;
  parkingSpot: string | null;
  guestName: string | null;
  tableId: string | null;
  table?: {
    id: string;
    number: string;
  } | null;
  orderId: string | null;
  status: ValetStatus;
  priority: ValetPriority;
  estimatedMins: number;
  requestedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockBatchDTO {
  id: string;
  ingredientId: string;
  batchNumber: string;
  quantity: number;
  supplier: string | null;
  receivedAt: string;
  expiresAt: string;
  notes: string | null;
}

export interface IngredientDTO {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  maxCapacity: number;
  reorderLevel: number;
  costPerUnit: number;
  batches?: StockBatchDTO[];
  stockPercentage: number;
  isLowStock: boolean;
  isUrgent: boolean;
  depletionMinsEstimate?: number;
  updatedAt: string;
}

export interface FootfallRecordDTO {
  id: string;
  date: string;
  dayOfWeek: string;
  actualFootfall: number;
  predictedFootfall: number;
  revenue: number;
  weather: string | null;
  notes: string | null;
}

export interface ForecastDataDTO {
  records: FootfallRecordDTO[];
  todayPrediction: {
    predicted: number;
    predictedUpper: number;
    predictedLower: number;
    trendPercentage: number;
    comparisonText: string;
  };
  metrics: {
    activeOrdersCount: number;
    avgPrepTimeMinutes: number;
    lowStockCount: number;
    urgentStockCount: number;
    todayRevenue: number;
    revenueFormatted: string;
  };
}

export type RealtimeEventType =
  | 'order:created'
  | 'order:updated'
  | 'order:status_changed'
  | 'order:item_toggled'
  | 'valet:requested'
  | 'valet:updated'
  | 'valet:status_changed'
  | 'inventory:updated'
  | 'inventory:alert';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  data: any;
  timestamp: number;
}
