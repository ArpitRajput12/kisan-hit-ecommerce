import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CartSummary, Product, ProductVariant } from '../types';
import { cartApi } from '../api/cart.api';
import { useAuth } from './AuthContext';

export interface CartContextType {
  items: CartItem[];
  cartItems: CartItem[];
  summary: CartSummary;
  cartSummary: CartSummary;
  itemCount: number;
  loading: boolean;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productOrId: string | Product, quantity?: number, selectedVariant?: ProductVariant) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isItemInCart: (productId: string) => boolean;
}

const defaultSummary: CartSummary = {
  totalItemsCount: 0,
  subtotalAmount: 0,
  taxAmount: 0,
  shippingFee: 0,
  totalAmount: 0,
  freeShippingThreshold: 49900,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('local_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [summary, setSummary] = useState<CartSummary>(() => {
    return calculateSummary(items);
  });
  const [loading, setLoading] = useState<boolean>(false);

  function calculateSummary(cartList: CartItem[]): CartSummary {
    const subtotal = cartList.reduce((sum, item) => sum + item.itemTotal, 0);
    const totalCount = cartList.reduce((sum, item) => sum + item.quantity, 0);
    // GST is inclusive in catalog pricing (सभी कर सहित)
    // Formula: GST Included = Subtotal - (Subtotal / (1 + (gstRate / 100)))
    const tax = Math.round(subtotal - subtotal / 1.05); // 5% GST backwards extracted
    const hasHeavy = cartList.some((item) => item.isHeavyCargo);
    // Shipping: Free delivery over ₹499 (49900 paise) unless heavy cargo which has ₹150 (15000 paise) base freight
    let shipping = 0;
    if (subtotal > 0) {
      if (hasHeavy) {
        shipping = 15000;
      } else if (subtotal < 49900) {
        shipping = 5000; // ₹50
      }
    }
    return {
      totalItemsCount: totalCount,
      subtotalAmount: subtotal,
      taxAmount: tax,
      shippingFee: shipping,
      totalAmount: subtotal + shipping, // Tax is inclusive, NOT added on top!
      freeShippingThreshold: 49900,
    };
  }

  // Update summary whenever items change
  useEffect(() => {
    const sum = calculateSummary(items);
    setSummary(sum);
    localStorage.setItem('local_cart', JSON.stringify(items));
  }, [items]);

  const refreshCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const res = await cartApi.getCart();
      if (res.success && res.data) {
        setItems(res.data.items || []);
      }
    } catch {
      // Keep local cart
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated]);

  const addToCart = async (
    productOrId: string | Product,
    quantity: number = 1,
    selectedVariant?: ProductVariant
  ) => {
    setLoading(true);
    try {
      if (typeof productOrId === 'object') {
        const prod = productOrId as Product;
        const effectivePrice = selectedVariant ? selectedVariant.pricePaise : prod.basePrice;
        const effectiveUnit = selectedVariant ? selectedVariant.packSize : prod.unit;
        const itemKey = selectedVariant ? `${prod.id}_${selectedVariant.packSize}` : prod.id;

        setItems((prev) => {
          const existing = prev.find((it) => it.productId === itemKey);
          if (existing) {
            return prev.map((it) =>
              it.productId === itemKey
                ? {
                    ...it,
                    quantity: it.quantity + quantity,
                    itemTotal: (it.quantity + quantity) * it.unitPrice,
                    variantId: it.variantId || selectedVariant?.id,
                    packSize: it.packSize || effectiveUnit,
                  }
                : it
            );
          }
          const newItem: CartItem = {
            id: `local_${Date.now()}_${itemKey}`,
            productId: itemKey,
            name: selectedVariant ? `${prod.name} (${selectedVariant.packSize})` : prod.name,
            slug: prod.slug,
            sku: selectedVariant?.sku || prod.sku,
            unit: effectiveUnit,
            unitPrice: effectivePrice,
            images: prod.images || [],
            quantity: quantity,
            itemTotal: effectivePrice * quantity,
            availableStock: selectedVariant?.stock ?? prod.availableStock,
            isAvailable: prod.isInStock,
            isHeavyCargo: prod.isHeavyCargo,
            weightKg: prod.weightKg || undefined,
            variantId: selectedVariant?.id,
            packSize: effectiveUnit,
          };
          return [...prev, newItem];
        });

        if (isAuthenticated) {
          try {
            await cartApi.addToCart(prod.id, quantity);
          } catch {
            // local state retained
          }
        }
      } else {
        const productId = productOrId as string;
        if (isAuthenticated) {
          const res = await cartApi.addToCart(productId, quantity);
          if (res.success && res.data) {
            setItems(res.data.items);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(productId);
    }
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId
          ? {
              ...it,
              quantity,
              itemTotal: quantity * it.unitPrice,
            }
          : it
      )
    );

    if (isAuthenticated) {
      try {
        await cartApi.updateCartItem(productId, quantity);
      } catch {
        // local state retained
      }
    }
  };

  const removeItem = async (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
    if (isAuthenticated) {
      try {
        await cartApi.removeCartItem(productId);
      } catch {
        // local state retained
      }
    }
  };

  const clearCart = async () => {
    setItems([]);
    setSummary(defaultSummary);
    localStorage.removeItem('local_cart');
    if (isAuthenticated) {
      try {
        await cartApi.clearCart();
      } catch {
        // local state retained
      }
    }
  };

  const isItemInCart = (productId: string): boolean => {
    return items.some((it) => it.productId === productId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartItems: items,
        summary,
        cartSummary: summary,
        itemCount: summary.totalItemsCount,
        loading,
        isLoading: loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        removeFromCart: removeItem,
        clearCart,
        isItemInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
