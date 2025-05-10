import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import './Product.css';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [currentSpecsSlide, setCurrentSpecsSlide] = useState(0);
  const [product, setProduct] = useState(null);
  const [imageSets, setImageSets] = useState({});
  const [availableSizes, setAvailableSizes] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isInStock, setIsInStock] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchCurrentProduct = async () => {
        const currentProduct = await getProductById(id);
        setProduct(currentProduct);
        
        // Build imageSets from product data
        if (currentProduct?.options) {
          const sets = {};
          const sizes = new Set();
          
          currentProduct.options.forEach(option => {
            // Group by groupName
            if (!sets[option.groupName]) {
              sets[option.groupName] = {};
            }
            
            // Add images under name
            sets[option.groupName][option.name] = option.images.map(img => img.image);
            
            // Collect unique sizes from the sizes array
            if (option.sizes) {
              option.sizes.forEach(size => {
                if (size.name) sizes.add(size.name);
              });
            }
          });
          
          setImageSets(sets);
          setAvailableSizes(Array.from(sizes));
          
          // Set initial selections
          if (currentProduct.options.length > 0) {
            const firstOption = currentProduct.options[0];
            setSelectedGroup(firstOption.groupName);
            setSelectedName(firstOption.name);
            if (firstOption.sizes && firstOption.sizes.length > 0) {
              setSelectedSize(firstOption.sizes[0].name);
              setCurrentPrice(firstOption.sizes[0].price || 0);
              setIsInStock(firstOption.sizes[0].stock > 0);
            }
          }
        }
      };

      fetchCurrentProduct();
    }
  }, [id]);

  let currentImages = [];
  if (selectedGroup && imageSets[selectedGroup] && selectedName) {
    currentImages = imageSets[selectedGroup][selectedName] || [];
  }

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedGroup, selectedName, selectedSize]);

  // Update price and stock status when selections change
  useEffect(() => {
    if (product?.options) {
      const matchingOption = product.options.find(option => 
        option.groupName === selectedGroup &&
        option.name === selectedName
      );
      
      if (matchingOption?.sizes) {
        const matchingSize = matchingOption.sizes.find(size => size.name === selectedSize);
        if (matchingSize) {
          setCurrentPrice(matchingSize.price || 0);
          setIsInStock(matchingSize.stock > 0);
        }
      }
    }
  }, [selectedGroup, selectedName, selectedSize, product]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + currentImages.length) % currentImages.length);
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    if (imageSets[group]) {
      setSelectedName(Object.keys(imageSets[group])[0]);
    }
  };

  const handleNameClick = (name) => {
    setSelectedName(name);
  };

  const handleSizeClick = (size) => {
    setSelectedSize(size);
  };

  const handleHowToClick = () => {
    navigate(`/product/${id}/how-to`);
  };

  if (!product) return null;

  return (
    <div>
      <main>
        <section className="product-section">
          <div className="product-display">
            <div className="product carousel">
              <button
                type='button'
                onClick={prevImage}
                className="product arrow left"
                disabled={currentImages.length <= 1}
              >
                &#8249;
              </button>
              {currentImages.length > 0 ? (
                <img src={currentImages[currentImageIndex]} alt={`Product view ${currentImageIndex + 1}`} className="product-image" />
              ) : (
                <div className="product-image">No Image Available</div>
              )}
              <button 
                type='button'
                onClick={nextImage}
                className="product arrow right"
                disabled={currentImages.length <= 1}
              >
                &#8250;
              </button>
              {currentImages.length > 1 && (
                <div className="product dots">
                  {currentImages.map((_, index) => (
                    <span 
                      key={index} 
                      className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="product-info">
              <div className="product-options-container">
                <div className="product-options">
                  {Object.keys(imageSets).map((group) => (
                    <button 
                      type='button'
                      key={group}
                      className={`option button ${selectedGroup === group ? 'active' : ''}`}
                      onClick={() => handleGroupClick(group)}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                {selectedGroup && imageSets[selectedGroup] && 
                 product?.options?.some(option => 
                   option.groupName === selectedGroup && 
                   option.name !== selectedGroup
                 ) && (
                  <div className="product-options subcategory-options">
                    {Object.keys(imageSets[selectedGroup]).map((name) => (
                      <button 
                        type='button'
                        key={name}
                        className={`option button ${selectedName === name ? 'active' : ''}`}
                        onClick={() => handleNameClick(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {availableSizes.length > 0 && (
                <div className="sizes-container">
                  {availableSizes.map((size) => (
                    <button 
                      type='button'
                      key={size}
                      className={`size button white ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => handleSizeClick(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
              <div className="price-container">
                <p className="price">₹{currentPrice}</p>
                <button 
                  className="buy button black" 
                  disabled={!isInStock}
                >
                  {isInStock ? 'Buy Now' : 'Out of Stock'}
                </button>
                {!isInStock && (
                  <p className="out-of-stock-message">Product is currently out of stock</p>
                )}
                <p className="shipping-disclaimer">Free Shipping</p>
              </div>
              {(product.howTo?.video?.image || product.howTo?.schematic?.image) && (
                <div className="how-to-container">
                  <button className="how-to button black" onClick={handleHowToClick}>
                    How To
                  </button>
                </div>
              )}
            </div>
          </div>

          {product.specs && product.specs.info && product.specs.info.length > 0 && product.specs.images && product.specs.images.length > 0 && (
            <div className="specs-display">
              <div className="specs-list">
                <ul>
                  {product.specs.info.map((spec, index) => (
                    <li key={index}>
                      <span className="bullet">•</span>
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            
              <div className="specs carousel">
                <button 
                  type='button'
                  onClick={() => setCurrentSpecsSlide(prev => (prev - 1 + product.specs.images.length) % product.specs.images.length)}
                  className="specs arrow prev"
                >
                  &#8249;
                </button>
                <img 
                  src={product.specs.images[currentSpecsSlide].image}
                  alt={product.specs.images[currentSpecsSlide].alt}
                  className="specs-image"
                />
                <button 
                  type='button'
                  onClick={() => setCurrentSpecsSlide(prev => (prev + 1) % product.specs.images.length)}
                  className="specs arrow next"
                >
                  &#8250;
                </button>

                <p className="specs-label">{product.specs.images[currentSpecsSlide].label}</p>

                <div className="specs dots">
                  {product.specs.images.map((_, index) => (
                    <button
                      type='button'
                      key={index}
                      className={`dot ${index === currentSpecsSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSpecsSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
        
        <section className="shipping-info-section">
          <div className="info-column">
            <h3>shipping</h3>
            <p>All items are shipped with tracking. You will receive an email with tracking number after the parcel has been sent out. Below are the ETAs after despatch:</p>
            <ul>
              <li>Within Tamil Nadu: 3-9 working days</li>
              <li>Inter State: 6-14 working days</li>
            </ul>
          </div>
          <div className="info-column">
            <h3>payments</h3>
            <p>Payments are accepted via PayPal at checkout. All payments are secure under PayPal's Purchase Protection system.</p>
            <h3>safety</h3>
            <p>The kit does not include a lithium-ion battery. The customer acquires and uses the battery at their own risk. The seller recommends getting a high quality battery listed in the "how-to" part of the website, yet is not liable for damages of any kind as a result of using the recommended battery.</p>
          </div>
          <div className="info-column">
            <h3>refunds and returns</h3>
            <p>If you are not satisfied with the product for whatever reason, feel free to get in touch via email support@acryfusionlaserworks.com. I am happy to offer a refund provided that you haven't damaged/modified the product. Contact me before returning the item, so we can negotiate return shipping and refunds.</p>
          </div>
        </section>
      </main>
    </div>
  );
} 