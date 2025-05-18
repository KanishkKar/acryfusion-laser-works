import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // item: { id, name, heroImage, optionName, price, size, quantity }
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.size === item.size && i.optionName === item.optionName
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size && i.optionName === item.optionName
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (id, size, optionName) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size && i.optionName === optionName)));
  };

  const updateQuantity = (id, size, optionName, quantity) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id && i.size === size && i.optionName === optionName ? { ...i, quantity } : i
      )
    );
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, isCartOpen, openCart, closeCart, clearCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
} 