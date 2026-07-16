import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type UserRole = 'customer' | 'admin' | 'designer' | 'photographer' | 'delivery';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'delivered' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentType = 'order' | 'booking';
export type BusinessPlanStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  avatar_url: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessPlan {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  category_id: string | null;
  status: BusinessPlanStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  service_id: string | null;
  title: string;
  description: string;
  status: OrderStatus;
  assigned_designer: string | null;
  assigned_delivery: string | null;
  total_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderFile {
  id: string;
  order_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string | null;
  service_name: string;
  booking_date: string;
  booking_time: string;
  location: string;
  status: BookingStatus;
  assigned_photographer: string | null;
  notes: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  reference_type: PaymentType;
  reference_id: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  transaction_id: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  meta: Record<string, unknown>;
  created_at: string;
}
