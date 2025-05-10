import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import './HowTo.css';

export default function HowTo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  const handleVideoClick = () => {
    window.open(product.howTo.video.link, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = product.howTo.schematic.link;
    link.download = product.howTo.schematic.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (id) {
      const fetchCurrentProduct = async () => {
        const currentProduct = await getProductById(id);
        if (!currentProduct) {
          navigate('/');
          return;
        }

        setProduct(currentProduct);
      };
      
      fetchCurrentProduct();
    }
  }, [id, navigate]);

  if (!product || !product.howTo) {
    return (
      <div>
        <main>
          <div>
            <h1>No How To information available</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <main>
        <div>
          {product.howTo.video?.image && (
            <section className="video-section">
              <img src={product.howTo.video.image} alt="Video thumbnail" className="video-image" />
              <button className='video button' onClick={handleVideoClick}>video</button>
            </section>
          )}

          {product.howTo.schematic?.image && (
            <section className="schematic-section">
              <img src={product.howTo.schematic.image} alt="Soldering schematic" className="schematic-image" />
              <button className="download button" onClick={handleDownload}>download</button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}