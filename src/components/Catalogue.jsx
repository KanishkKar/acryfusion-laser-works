import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getAllProducts, searchProducts } from '../services/productService';
import './Catalogue.css';

const Catalogue = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 8;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        let data;
        if (searchQuery) {
          data = await searchProducts(searchQuery);
        } else {
          data = await getAllProducts();
        }
        setProducts(data);
        setCurrentPage(1); // Reset to first page when search changes
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery]);

  const getLowestPrice = (product) => {
    let lowestPrice = Infinity;
    product.options?.forEach(option => {
      option.sizes?.forEach(size => {
        if (size.price && size.price < lowestPrice) {
          lowestPrice = size.price;
        }
      });
    });
    return lowestPrice === Infinity ? 0 : lowestPrice;
  };

  const sortProducts = (products) => {
    return [...products].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'price') {
        comparison = getLowestPrice(a) - getLowestPrice(b);
      } else if (sortBy === 'category') {
        comparison = String(a.category).localeCompare(String(b.category));
      } else {
        comparison = String(a[sortBy]).localeCompare(String(b[sortBy]));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const sortedProducts = sortProducts(products);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="no-results">
        {searchQuery ? 'No products found matching your search.' : 'No products available.'}
      </div>
    );
  }

  return (
    <div className="product-catalogue">
      <div className="catalogue-header">
        <div className="sort-controls">
          <select 
            value={sortBy} 
            onChange={(e) => handleSort(e.target.value)}
            className="sort-select"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="category">Category</option>
          </select>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="products-grid">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.heroImage?.src} alt={product.name} />
            <h3>{product.name}</h3>
            <p className="price">₹{getLowestPrice(product)}</p>
            <p className="description">{product.description}</p>
            <div className="product-tags">
              {product.tags?.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
            <Link to={`/product/${product.id}`} className="buy-btn">Buy Now</Link>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-text">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalogue; 