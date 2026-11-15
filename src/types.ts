export type Language = 'en' | 'gu';

export type ProductCategory = 'pottery' | 'textiles' | 'brassware' | 'woodcraft' | 'decor';

export type OrderStatus =
  | 'Order Received'
  | 'Order Confirmed'
  | 'Processing'
  | 'Ready for Dispatch'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Order Received',
  'Order Confirmed',
  'Processing',
  'Ready for Dispatch',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export interface Product {
  id: string;
  nameEn: string;
  nameGu: string;
  descriptionEn: string;
  descriptionGu: string;
  category: ProductCategory;
  price: number;
  discountPrice: number;
  stock: number;
  images: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  specialOffer: boolean;
  ratingAvg: number;
  reviewCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  language: Language;
  role: 'customer' | 'admin';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderItem {
  productId: string;
  nameEn: string;
  nameGu: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  status: OrderStatus;
  statusHistory: OrderStatusEntry[];
  adminRemarks: string;
  estimatedDelivery: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StoreSettings {
  whatsappNumber: string;
  storeName: string;
  bannerTextEn: string;
  bannerTextGu: string;
  bannerActive: boolean;
  freeShippingThreshold: number;
  updatedAt?: unknown;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
