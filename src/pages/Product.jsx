import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import './Product.css';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [currentSpecsSlide, setCurrentSpecsSlide] = useState(0);
  const [product, setProduct] = useState(null);
  const [imageSets, setImageSets] = useState({});

  useEffect(() => {
    if (id) {
      const currentProduct = getProductById(id);
      setProduct(currentProduct);
      
      // Build imageSets from product data
      if (currentProduct?.images) {
        const sets = {};
        currentProduct.images.forEach(category => {
          if (category.subCategory) {
            // Handle categories with subcategories
            sets[category.category] = {};
            category.subCategory.forEach(subCat => {
              sets[category.category][subCat.category] = subCat.images.map(img => img.image);
            });
          } else {
            // Handle simple categories
            sets[category.category] = category.images.map(img => img.image);
          }
        });
        setImageSets(sets);
        
        // Set initial selected category
        if (currentProduct.images.length > 0) {
          setSelectedCategory(currentProduct.images[0].category);
          if (currentProduct.images[0].subCategory) {
            setSelectedSubCategory(currentProduct.images[0].subCategory[0].category);
          }
        }
      }
    }
  }, [id]);

  let currentImages = [];
  if (selectedCategory && imageSets[selectedCategory]) {
    if (typeof imageSets[selectedCategory] === 'object' && !Array.isArray(imageSets[selectedCategory])) {
      // Handle subcategories
      currentImages = imageSets[selectedCategory][selectedSubCategory] || [];
    } else {
      // Handle simple categories
      currentImages = imageSets[selectedCategory] || [];
    }
  }

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedCategory, selectedSubCategory]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + currentImages.length) % currentImages.length);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    if (imageSets[category] && typeof imageSets[category] === 'object' && !Array.isArray(imageSets[category])) {
      // If the category has subcategories, select the first one
      setSelectedSubCategory(Object.keys(imageSets[category])[0]);
    } else {
      setSelectedSubCategory('');
    }
  };

  const handleSubCategoryClick = (subCategory) => {
    setSelectedSubCategory(subCategory);
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
                  {product.images.map((category) => (
                    <button 
                      type='button'
                      key={category.category}
                      className={`option button ${selectedCategory === category.category ? 'active' : ''}`}
                      onClick={() => handleCategoryClick(category.category)}
                    >
                      {category.category}
                    </button>
                  ))}
                </div>

                {selectedCategory && imageSets[selectedCategory] && 
                 typeof imageSets[selectedCategory] === 'object' && 
                 !Array.isArray(imageSets[selectedCategory]) && (
                  <div className="product-options subcategory-options">
                    {Object.keys(imageSets[selectedCategory]).map((subCategory) => (
                      <button 
                        type='button'
                        key={subCategory}
                        className={`option button ${selectedSubCategory === subCategory ? 'active' : ''}`}
                        onClick={() => handleSubCategoryClick(subCategory)}
                      >
                        {subCategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="price-container">
                <p className="price">₹{product.price}</p>
                <button className="buy button black">buy</button>
                <p className="shipping-disclaimer">Free Shipping</p>
              </div>
              {product.howTo && (
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