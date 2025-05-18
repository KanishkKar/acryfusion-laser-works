import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { useCart } from '../contexts/CartContext';
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
  const [availableSizes, setAvailableSizes] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isInStock, setIsInStock] = useState(true);
  const { cart, addToCart, updateQuantity, openCart } = useCart();

  // Helper to get all unique sizes for the current group/name
  const getSizesForCurrent = (options, group, name) => {
    const option = options?.find(
      (o) => o.groupName === group && o.name === name
    );
    return option?.sizes?.map((s) => s.name) || [];
  };

  useEffect(() => {
    if (id) {
      const fetchCurrentProduct = async () => {
        const currentProduct = await getProductById(id);
        setProduct(currentProduct);
        if (currentProduct?.options?.length > 0) {
          const firstOption = currentProduct.options[0];
          setSelectedGroup(firstOption.groupName);
          setSelectedName(firstOption.name);
          if (firstOption.sizes && firstOption.sizes.length > 0) {
            setSelectedSize(firstOption.sizes[0].name);
            setCurrentPrice(firstOption.sizes[0].price || 0);
            setIsInStock(firstOption.sizes[0].stock > 0);
            setAvailableSizes(firstOption.sizes.map((s) => s.name));
          }
        }
      };
      fetchCurrentProduct();
    }
  }, [id]);

  // Find the current option and size object
  const currentOption = product?.options?.find(
    (o) => o.groupName === selectedGroup && o.name === selectedName
  );
  const currentSizeObj = currentOption?.sizes?.find((s) => s.name === selectedSize);
  const currentImages = currentSizeObj?.images?.map((img) => img.image) || [];

  useEffect(() => {
    setCurrentImageIndex(0);
    // Update available sizes for the selected group/name
    if (product && selectedGroup && selectedName) {
      setAvailableSizes(getSizesForCurrent(product.options, selectedGroup, selectedName));
    }
  }, [selectedGroup, selectedName, product]);

  // Update price and stock status when selections change
  useEffect(() => {
    if (currentSizeObj) {
      setCurrentPrice(currentSizeObj.price || 0);
      setIsInStock(currentSizeObj.stock > 0);
    }
  }, [currentSizeObj]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + currentImages.length) % currentImages.length);
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    const firstName = product.options.find((o) => o.groupName === group)?.name;
    setSelectedName(firstName);
    const firstOption = product.options.find((o) => o.groupName === group && o.name === firstName);
    if (firstOption?.sizes?.length > 0) {
      setSelectedSize(firstOption.sizes[0].name);
    }
  };

  const handleNameClick = (name) => {
    setSelectedName(name);
    const option = product.options.find((o) => o.groupName === selectedGroup && o.name === name);
    if (option?.sizes?.length > 0) {
      setSelectedSize(option.sizes[0].name);
    }
  };

  const handleSizeClick = (size) => {
    setSelectedSize(size);
  };

  const handleHowToClick = () => {
    navigate(`/product/${id}/how-to`);
  };

  // Find if this product/option/size is in cart
  const cartItem = cart.find(
    (i) => i.id === product?.id && i.size === selectedSize && i.optionName === selectedName
  );

  if (!product) return null;

  const imageSets = product.options.reduce((acc, option) => {
    if (!acc[option.groupName]) {
      acc[option.groupName] = {};
    }
    if (!acc[option.groupName][option.name]) {
      acc[option.groupName][option.name] = true;  // Using a placeholder value since we only need the keys for mapping
    }
    return acc;
  }, {});

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
              <div className='product-name'><h2>{product.name}</h2></div>

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
                <p className="price">₹{currentPrice}
                  {cartItem && (<span style={{ minWidth: 24, textAlign: 'center' }}>x {cartItem?.quantity}</span>)}
                </p>
                {isInStock && !cartItem && (
                  <button
                    className="buy button black"
                    onClick={() => {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        heroImage: product.heroImage?.src || (currentImages[0] || ''),
                        price: currentPrice,
                        size: selectedSize,
                        optionName: selectedName, 
                        quantity: 1,
                      });
                    }}
                  >
                    Add to Cart
                  </button>
                )}
                {isInStock && cartItem && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(product.id, selectedSize, selectedName, Math.max(1, cartItem.quantity - 1))}
                    >
                      -
                    </button>
                    <button
                      className="buy button black"
                      onClick={openCart}
                    >
                      Checkout
                    </button>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(product.id, selectedSize, selectedName, cartItem.quantity + 1)}
                    >
                      +
                    </button>
                    
                  </div>
                )}
                {!isInStock && (
                  <button className="buy button black" disabled>
                    Out of Stock
                  </button>
                )}
                {!isInStock && (
                  <p className="out-of-stock-message">Product is currently out of stock</p>
                )}
                <p className="shipping-disclaimer">Free Shipping</p>
              </div>
              {product.pointers && product.pointers.length > 0 && (
                <div className="product-details">
                  {product.pointers.map((pointer, index) => (
                    <span key={index}>{pointer}. </span>
                  ))}
                </div>
              )}
              {(product.howTo?.video?.link || product.howTo?.schematic?.link) && (
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