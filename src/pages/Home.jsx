import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTopProducts } from '../services/productService';
import './Home.css';

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchTopProducts = async () => {
      const products = await getTopProducts();
      setTopProducts(products);
    };
    fetchTopProducts();
  }, []);

  const handleImageError = (productId) => {
    console.error(`Failed to load image for product ${productId}`);
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const prevCard = () => setCurrent((current - 1 + topProducts.length) % topProducts.length);
  const nextCard = () => setCurrent((current + 1) % topProducts.length);

  return (
    <div>
      <main>
        <section className="home">
          <div className="hero carousel">
            {topProducts.map((product, idx) => {
              let className = 'hero-carousel-card';
              if (idx === current) className += ' active';
              else if (idx === (current - 1 + topProducts.length) % topProducts.length) className += ' prev';
              else if (idx === (current + 1) % topProducts.length) className += ' next';
              else className += ' hidden';
              
              const imageUrl = product.heroImage?.src;
              
              return (
                <div 
                  className={className} 
                  key={idx} 
                  style={{ 
                    backgroundImage: imageErrors[product.id] 
                      ? 'none' 
                      : `url(${imageUrl})` 
                  }}
                >
                  <div className="hero-carousel-overlay">
                    <div className="hero-carousel-title">{product.title}</div>
                    {idx === current && (
                      <Link to={`/product/${product.id}`} className="hero-carousel-buy button white">Buy Now</Link>
                    )}
                  </div>
                  {imageUrl && !imageErrors[product.id] && (
                    <img 
                      src={imageUrl} 
                      alt={product.heroImage?.alt || product.title}
                      style={{ display: 'none' }}
                      onError={() => handleImageError(product.id)}
                    />
                  )}
                </div>
              );
            })}
            <button type="button" className="hero arrow left" onClick={prevCard}>&#8249;</button>
            <button type="button" className="hero arrow right" onClick={nextCard}>&#8250;</button>
          </div>
        </section>
      </main>
    </div>
  );
}