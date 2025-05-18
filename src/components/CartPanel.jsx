import React from 'react';
import { useCart } from '../contexts/CartContext';
import './CartPanel.css';

export default function CartPanel() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    isCartOpen,
    closeCart,
    subtotal,
    clearCart
  } = useCart();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const details = cart
      .map(
        (item) =>
          `*${item.name}*\nSize: ${item.size}\nQty: ${item.quantity}\nPrice: ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}`
      )
      .join('\n\n');
    const message = `Order Details:%0A%0A${details}%0A%0ASubtotal: ₹${subtotal}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (window.confirm('Proceed to WhatsApp to complete your order?')) {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className={`cart-panel${isCartOpen ? ' open' : ''}`}> 
      <div className="cart-header">
        <span>Cart</span>
        <button className="close-btn" onClick={closeCart}>&times;</button>
      </div>
      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="cart-empty">Your cart is empty.</div>
        ) : (
          cart.map((item) => (
            <div className="cart-item-card" key={item.id + item.size}>
              <img
                src={item.heroImage}
                alt={item.name}
                className="cart-item-image"
                style={{ maxHeight: 100, width: 100, objectFit: 'cover' }}
              />
              <div className="cart-item-info">
                <div className="cart-item-title">{item.name}</div>
                <div className='cart-item-option'>{item.optionName}</div>
                <div className='cart-item-price-container'>
                  <div className="cart-item-price">₹{item.price}</div>
                  <div className='cart-item-size'>Size: {item.size}</div>
                </div>
                <div className="cart-item-qty-controls">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.size, item.optionName, Math.max(1, item.quantity - 1))
                    }
                    className="qty-btn"
                  >
                    -
                  </button>
                  <span className="cart-item-qty">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.size, item.optionName, item.quantity + 1)
                    }
                    className="qty-btn"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id, item.size, item.optionName)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="cart-footer">
        <div className="cart-subtotal">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <button className="checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
          Checkout
        </button>
      </div>
    </div>
  );
} 