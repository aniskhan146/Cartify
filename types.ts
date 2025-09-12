import type * as React from 'react';

export interface Category {
  id: string;
  name: string;
  iconUrl: string;
}

export interface Variant {
  id: string; // SKU or unique ID for the variant
  name: string; // e.g., "Color: Red, Size: M"
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl?: string; // Optional specific image for this variant
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrls: string[]; // General product images
  rating: number;
  reviews: number;
  variants: Variant[];
  deliveryTimescale?: string;
}

export interface OrderItem {
  // Store a snapshot of the product and variant at the time of purchase for historical accuracy
  productId: string;
  productName: string;
  productImage: string;
  variantName: string;
  variantPrice: number;
  quantity: number;
}

export interface Order {
  id:string;
  customerName: string;
  date: string;
  total: number;
  status: 'Pending' | 'Processed' | 'Shipped' | 'Delivered' | 'Canceled';
  items: OrderItem[];
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string; // Use the variant image if available, otherwise the first product image
  variant: Variant;
  quantity: number;
}


export type UserRole = 'admin' | 'user';

export interface UserRoleInfo {
  uid: string;
  email: string;
  role: UserRole;
  isBanned?: boolean;
}

export interface Notification {
  id: string;
  type: 'new-order' | 'new-user' | 'low-stock';
  message: string;
  timestamp: number;
  read: boolean;
}

export interface CheckoutConfig {
    shippingCharge: number;
    taxAmount: number;
}