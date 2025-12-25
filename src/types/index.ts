export type UserRole = 'admin' | 'seller' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  image: string;
  rating: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  tenantId: string;
  tenantName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
}

export interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalTenants: number;
  totalUsers: number;
  todayOrders: number;
  todayRevenue: number;
}
