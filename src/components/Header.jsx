import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import cartIcon from '../assets/icons/cart-icon.svg';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const { logout } = useAuth();
  const { cart, openCart } = useCart();
  const isAdminPage = location.pathname.startsWith('/admin');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="site-header">
      <div>
        <Link className="logo nav black" to="/">acryfusion laserworks</Link>
      </div>
      {!isAdminPage ? (
        <div className="header-content">
          <div className="search container">
            <form onSubmit={handleSearch}>
            <input
              type="text"
              name="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search input"
            />
            <button type="submit" className="header button black">
              Search
            </button>
            </form>
          </div>
          <nav className="header">
            <Link className="nav black" to="/explore">Explore</Link>
          </nav>
          <button className="cart button" onClick={openCart}>
            <img src={cartIcon} alt="cart" />
            {cart.length > 0 && <span className="cart-count">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>}
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleLogout} className="header button black">Logout</button>
      )}
    </header>
  );
} 