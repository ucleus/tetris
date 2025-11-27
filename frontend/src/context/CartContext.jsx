import React, { createContext, useContext, useMemo, useState } from 'react';
import { sampleProducts } from '../data/sampleProducts';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (productId, quantity = 1) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.productId === productId);
      if (exists) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { productId, quantity }];
    });
  };

  const updateQty = (productId, quantity) => {
    setCartItems(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
  };

  const removeFromCart = (productId) => setCartItems(prev => prev.filter(item => item.productId !== productId));

  const clearCart = () => setCartItems([]);

  const itemsWithData = useMemo(() => cartItems.map(item => {
    const product = sampleProducts.find(p => p.id === item.productId) || {};
    return { ...item, product, lineTotal: (product.price || 0) * item.quantity };
  }), [cartItems]);

  const subtotal = itemsWithData.reduce((sum, item) => sum + item.lineTotal, 0);
  const estimatedShipping = Math.max(39, subtotal * 0.015);
  const total = subtotal + estimatedShipping;

  return (
    <CartContext.Provider value={{ cartItems, itemsWithData, subtotal, estimatedShipping, total, addToCart, updateQty, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
