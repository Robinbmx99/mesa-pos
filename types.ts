export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'burgers' | 'drinks' | 'sides' | 'desserts';
  image: string;
  stock: number;
  isPopular?: boolean;
}

export interface OrderItem extends MenuItem {
  uniqueId: string; // To distinguish multiple of same item
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  isNewAppend?: boolean; // For KDS to highlight new additions
  isReward?: boolean; // If it was won in the game
}

export interface Order {
  id: string;
  tableId: number;
  items: OrderItem[];
  status: 'received' | 'preparing' | 'ready' | 'delivered' | 'paid';
  timestamp: Date;
  customerName?: string;
  billRequested?: boolean;
  paymentMethod?: 'card' | 'cash' | 'digital';
  billingType?: 'final' | 'invoice';
  billingData?: string;
  note?: string; // Kitchen note
}

export interface Table {
  id: number;
  status: 'free' | 'occupied' | 'bill-requested' | 'dirty';
  guests: number;
}