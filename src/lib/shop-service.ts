"use client";

import { supabase } from '@/lib/supabase';
import { JKC_ORG_ID } from './org-resolver';

export function getCurrencySymbol(org_id?: string, country?: string) {
    // Organizations in Japan get Yen
    if (org_id === JKC_ORG_ID) return "¥";
    if (country === "Japan") return "¥";
    return "$";
}

import { PostgrestError } from '@supabase/supabase-js';

export type MerchandiseStatus = 'draft' | 'published' | 'archived';

export interface Merchandise {
  id: string;
  org_id: string;
  category_id: string | null;
  name: string;
  subtitle?: string;
  description: string | null;
  long_description?: string;
  price: number;
  discount_price?: number;
  stock_quantity: number;
  images: string[];
  slug: string;
  status: MerchandiseStatus;
  metadata: Record<string, any>;
  specifications?: Record<string, string>;
  variants?: any[];
  features?: string[];
  delivery_options?: any[];
  average_rating?: number;
  review_count?: number;
  reviews?: any[];
  faqs?: { question: string; answer: string }[];
  currency?: string;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    slug: string;
  };
}

export interface MerchandiseCategory {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface MerchandiseOrder {
  id: string;
  org_id: string;
  user_id: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  payment_intent_id: string | null;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  shipping_address: Record<string, any>;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  items?: (OrderItem & { product: Merchandise })[];
}

export class ShopService {
  /**
   * Fetch all published products for an organization
   */
  static async getProducts(orgId: string) {
    const { data, error } = await supabase
      .from('merchandise')
      .select('*, category:merchandise_categories(name, slug)')
      .eq('org_id', orgId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Spread metadata into the main object for convenience
    return (data || []).map(p => ({
        ...p,
        images: p.images?.map((img: string) => img.replace(/^\/(jkc|jkc-devotion-app)\/images\//, '/images/')) || [],
        ...(p.metadata || {}),
        metadata: p.metadata // Keep original
    })) as Merchandise[];
  }

  /**
   * Fetch a single product by slug
   */
  static async getProductBySlug(orgId: string, slug: string) {
    const { data, error } = await supabase
      .from('merchandise')
      .select('*, category:merchandise_categories(name, slug)')
      .eq('org_id', orgId)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Spread metadata into the main object
    return {
        ...data,
        images: data.images?.map((img: string) => img.replace(/^\/(jkc|jkc-devotion-app)\/images\//, '/images/')) || [],
        ...(data.metadata || {}),
        metadata: data.metadata
    } as Merchandise;
  }

  /**
   * Fetch categories for an organization
   */
  static async getCategories(orgId: string) {
    const { data, error } = await supabase
      .from('merchandise_categories')
      .select('*')
      .eq('org_id', orgId)
      .order('name');

    if (error) throw error;
    return data as MerchandiseCategory[];
  }

  static async createOrder(orderData: Partial<MerchandiseOrder>, items: OrderItem[]) {
    const { data, error } = await supabase.rpc('place_merchandise_order', {
      p_order_data: orderData,
      p_items: items
    });

    if (error) throw error;
    return { id: data };
  }

  /**
   * Fetch user orders
   */
  static async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('merchandise_orders')
      .select('*, items:merchandise_order_items(*, product:merchandise(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(order => {
        if (order.items) {
            order.items = order.items.map((item: any) => {
                if (item.product && item.product.images) {
                    item.product.images = item.product.images.map((img: string) => img.replace(/^\/jkc\/images\//, '/images/'));
                }
                return item;
            });
        }
        return order;
    }) as MerchandiseOrder[];
  }

  /**
   * Admin: Get all orders for an organization
   */
  static async getOrgOrders(orgId: string) {
    const { data, error } = await supabase
      .from('merchandise_orders')
      .select('*, items:merchandise_order_items(*, product:merchandise(*))')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(order => {
        if (order.items) {
            order.items = order.items.map((item: any) => {
                if (item.product && item.product.images) {
                    item.product.images = item.product.images.map((img: string) => img.replace(/^\/jkc\/images\//, '/images/'));
                }
                return item;
            });
        }
        return order;
    }) as MerchandiseOrder[];
  }

  /**
   * Admin: Add/Update Product
   */
  static async upsertProduct(product: Partial<Merchandise>) {
    // Known rich fields that might be missing as columns
    const richFields = [
      'subtitle', 'long_description', 'features', 
      'specifications', 'faqs', 'delivery_options', 
      'average_rating', 'review_count', 'variants',
      'currency', 'discount_price'
    ];

    const cleanProduct: any = { ...product };
    const metadata = { ...(cleanProduct.metadata || {}) };

    richFields.forEach(field => {
      if (field in cleanProduct) {
        // If it's in metadata but also a top-level field, we keep both for compatibility
        // but Supabase will use the top-level column if it exists.
        metadata[field] = (cleanProduct as any)[field];
      }
    });

    cleanProduct.metadata = metadata;

    const { data, error } = await supabase
      .from('merchandise')
      .upsert([cleanProduct])
      .select()
      .single();

    if (error) throw error;
    return data as Merchandise;
  }

  static async logInventoryChange(productId: string, amount: number, reason: string) {
    const { error } = await supabase.rpc('log_inventory_adjustment', {
      p_product_id: productId,
      p_amount: amount,
      p_reason: reason
    });

    if (error) throw error;
  }

  /**
   * Admin: Add/Update Category
   */
  static async upsertCategory(category: Partial<MerchandiseCategory>) {
    const { data, error } = await supabase
      .from('merchandise_categories')
      .upsert([category])
      .select()
      .single();

    if (error) throw error;
    return data as MerchandiseCategory;
  }

  /**
   * Admin: Delete Product
   */
  static async deleteProduct(productId: string) {
    const { error } = await supabase
      .from('merchandise')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  }

  /**
   * Admin: Delete Category
   */
  static async deleteCategory(categoryId: string) {
    const { error } = await supabase
      .from('merchandise_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  }

  /**
   * Admin: Update Order Status
   */
  static async updateOrderStatus(orderId: string, status: MerchandiseOrder['status']) {
    const { data, error } = await supabase
      .from('merchandise_orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data as MerchandiseOrder;
  }

  /**
   * Cart and Wishlist Persistence
   */
  static async getCart(userId: string) {
    const { data, error } = await supabase
      .from('merchandise_cart_items')
      .select('*, product:merchandise(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(item => {
        if (item.product && item.product.images) {
            item.product.images = item.product.images.map((img: string) => img.replace(/^\/(jkc|jkc-devotion-app)\/images\//, '/images/'));
        }
        return item;
    });
  }

  static async syncCart(userId: string, localItems: any[]) {
    // 1. Get existing cart items
    const { data: existingItems } = await supabase
      .from('merchandise_cart_items')
      .select('*')
      .eq('user_id', userId);

    const updates = localItems.map(local => {
      const existing = (existingItems || []).find(i => i.product_id === local.id);
      return {
        user_id: userId,
        product_id: local.id,
        quantity: existing ? existing.quantity + local.quantity : local.quantity,
        metadata: local.metadata || {}
      };
    });

    if (updates.length > 0) {
      const { error } = await supabase
        .from('merchandise_cart_items')
        .upsert(updates, { onConflict: 'user_id, product_id' });
      if (error) throw error;
    }
    
    // Clear local storage after sync
    localStorage.removeItem('merchandise_cart');
  }

  static async updateCartQuantity(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      const { error } = await supabase
        .from('merchandise_cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('merchandise_cart_items')
        .upsert({ 
          user_id: userId, 
          product_id: productId, 
          quantity,
          is_saved: false // When updating quantity, it should be in the active cart
        }, { onConflict: 'user_id, product_id' });
      if (error) throw error;
    }
  }

  static async toggleSaveForLater(userId: string, productId: string, isSaved: boolean) {
    const { error } = await supabase
      .from('merchandise_cart_items')
      .update({ is_saved: isSaved })
      .eq('user_id', userId)
      .eq('product_id', productId);
    
    if (error) throw error;
  }

  static async getWishlist(userId: string) {
    const { data, error } = await supabase
      .from('merchandise_wishlist')
      .select('product_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []).map(i => i.product_id);
  }

  static async toggleWishlist(userId: string, productId: string) {
    const { data: existing } = await supabase
      .from('merchandise_wishlist')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('merchandise_wishlist')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
      return false; // Not liked anymore
    } else {
      const { error } = await supabase
        .from('merchandise_wishlist')
        .insert({ user_id: userId, product_id: productId });
      if (error) throw error;
      return true; // Liked
    }
  }
}
