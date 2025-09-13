import type * as React from 'react';

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  iconUrl: string;
  parentId?: string | null;
  subCategories?: Category[];
}

export interface VariantOptionValue {
  name: string;
  colorCode?: string;
}

export interface VariantOption {
  id: string;
  name: string; // e.g., "Color", "Size"
  values: VariantOptionValue[]; // e.g., [{ name: "Red", colorCode: "#ff0000" }], [{ name: "Small" }]
}

export interface Variant {
  id: string; // SKU or unique ID for the variant
  name: string; // e.g., "Red / Small" - generated for display
  options: { [key: string]: string }; // e.g., { "Color": "Red", "Size": "Small" }
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl?: string; // Optional specific image for this variant
}

export interface Product {
  id: string;
  name: string;
  // FIX: Changed categoryId to category to match its usage as a string name throughout the application.
  category: string;
  brandId?: string;
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
  displayName?: string;
}

export type NotificationType = 'success' | 'error' | 'info' | 'new-order' | 'new-user' | 'low-stock';


export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface UserNotification {
  id: string;
  userId: string;
  message: string;
  linkTo?: string;
  isRead: boolean;
  createdAt: string; // ISO string
}

export interface CheckoutConfig {
    shippingChargeInsideDhaka: number;
    shippingChargeOutsideDhaka: number;
    taxAmount: number;
}