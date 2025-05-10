import React, { useState, useEffect } from 'react';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingFiles, setPendingFiles] = useState({
    heroImage: null,
    howToVideo: null,
    howToSchematic: null,
    specsImages: [],
    optionImages: {}
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (filterQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = filterQuery.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [filterQuery, products]);

  const generateNewId = () => {
    const maxId = Math.max(...products.map(p => parseInt(p.id)), 0);
    return (maxId + 1).toString().padStart(6, '0');
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
      setFilteredProducts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsEditing(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
      } catch (error) {
        setError('Failed to delete product. Please try again later.');
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleFileUpload = async (file, imagePath, productId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('imagePath', imagePath);
    formData.append('productId', productId);

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Upload all pending files first
      const uploadedFiles = {};
      
      // Upload hero image if pending
      if (pendingFiles.heroImage && selectedProduct.heroImagePath) {
        const data = await handleFileUpload(pendingFiles.heroImage, selectedProduct.heroImagePath, selectedProduct.id);
        uploadedFiles.heroImage = data;
      }

      // Upload how to video image if pending
      if (pendingFiles.howToVideo && selectedProduct.videoImagePath) {
        const data = await handleFileUpload(pendingFiles.howToVideo, selectedProduct.videoImagePath, selectedProduct.id);
        uploadedFiles.howToVideo = data;
      }

      // Upload how to schematic image if pending
      if (pendingFiles.howToSchematic && selectedProduct.schematicImagePath) {
        const data = await handleFileUpload(pendingFiles.howToSchematic, selectedProduct.schematicImagePath, selectedProduct.id);
        uploadedFiles.howToSchematic = data;
      }

      // Upload specs images if pending
      if (pendingFiles.specsImages.length > 0 && selectedProduct.specsImagePath) {
        const uploadPromises = pendingFiles.specsImages.map(file => 
          handleFileUpload(file, selectedProduct.specsImagePath, selectedProduct.id)
        );
        uploadedFiles.specsImages = await Promise.all(uploadPromises);
      }

      // Upload option images if pending
      for (const [optionIndex, files] of Object.entries(pendingFiles.optionImages)) {
        if (files.length > 0) {
          const uploadPromises = files.map(file => 
            handleFileUpload(file, `option_${optionIndex}`, selectedProduct.id)
          );
          uploadedFiles[`optionImages_${optionIndex}`] = await Promise.all(uploadPromises);
        }
      }

      // Prepare product data for Google Sheets
      const productData = {
        ...selectedProduct,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_title: selectedProduct.title,
        product_description: selectedProduct.description,
        specs_info: selectedProduct.specs?.info?.join(','),
        specs_image_path: uploadedFiles.specsImages?.[0]?.imagePath || selectedProduct.specs?.images?.[0]?.label || '',
        video_image_path: uploadedFiles.howToVideo?.imagePath || selectedProduct.howTo?.video?.label || '',
        schematic_image_path: uploadedFiles.howToSchematic?.imagePath || selectedProduct.howTo?.schematic?.label || '',
        how_to_video_link: selectedProduct.howTo?.video?.link || '',
        how_to_schematic_file: selectedProduct.howTo?.schematic?.link || '',
        tags: selectedProduct.tags?.join(','),
        pointers: selectedProduct.pointers?.join(','),
        category: selectedProduct.category
      };

      if (isEditing) {
        const savedProduct = await updateProduct(productData.id, productData);
        const updatedProducts = products.map(p => 
          p.id === productData.id ? savedProduct : p
        );
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
      } else {
        const newProduct = { ...productData, id: generateNewId() };
        const createdProduct = await createProduct(newProduct);
        setProducts([...products, createdProduct]);
        setFilteredProducts([...products, createdProduct]);
      }

      // Clear pending files
      setPendingFiles({
        heroImage: null,
        howToVideo: null,
        howToSchematic: null,
        specsImages: [],
        optionImages: {}
      });

      setIsEditing(false);
      setSelectedProduct(null);
    } catch (error) {
      setError('Failed to save product. Please try again later.');
      console.error('Error saving product:', error);
    }
  };

  const closeForm = () => {
    setSelectedProduct(null);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <div className="products-list-pane">
        <div className="products-header">
          <div className="search-admin-container">
            <input
              type="text"
              placeholder="Filter products..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="search input"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedProduct({ 
                id: generateNewId(),
                name: '',
                title: '',
                description: '',
                details: '',
                pointers: [],
                tags: [],
                category: '',
                specs: {
                  info: [],
                  images: []
                },
                howTo: {
                  video: { link: '', label: '' },
                  schematic: { link: '', label: '', name: '' }
                }
              });
              setIsEditing(false);
            }}
            className="add button black"
          >
            Add New Product
          </button>
        </div>
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Tags</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.tags.join(', ')}</td>
                <td>{product.category}</td>
                <td>
                  <button onClick={() => handleEdit(product)} className="edit button">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="delete button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProduct && (
        <div className="form-container-pane">
          <div className="product modal-content">
            <div className="product modal-header">
              <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeForm} className="close-button">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="id">ID</label>
                <input
                  type="text"
                  id="id"
                  value={selectedProduct.id}
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={selectedProduct.name || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={selectedProduct.title || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={selectedProduct.description || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="details">Details</label>
                <textarea
                  id="details"
                  value={selectedProduct.details || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, details: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pointers">Pointers (comma-separated)</label>
                <input
                  type="text"
                  id="pointers"
                  value={Array.isArray(selectedProduct.pointers) ? selectedProduct.pointers.join(', ') : ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, pointers: e.target.value.split(',').map(pointer => pointer.trim())})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags (comma-separated)</label>
                <input
                  type="text"
                  id="tags"
                  value={Array.isArray(selectedProduct.tags) ? selectedProduct.tags.join(', ') : ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, tags: e.target.value.split(',').map(tag => tag.trim())})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  value={selectedProduct.category || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, category: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hero Image</label>
                <div>
                  <div className="form-group-section">
                    <input
                      type="text"
                      placeholder="Image Path (e.g., hero/main)"
                      value={selectedProduct.heroImagePath || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        heroImagePath: e.target.value
                      })}
                    />
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPendingFiles(prev => ({
                            ...prev,
                            heroImage: file
                          }));
                        }
                      }}
                    />
                    <div className="image-preview">
                      {(pendingFiles.heroImage || selectedProduct?.heroImage?.src) && (
                        <img
                          src={pendingFiles.heroImage ? URL.createObjectURL(pendingFiles.heroImage) : selectedProduct.heroImage.src}
                          alt="Hero preview"
                          style={{ maxHeight: '100px' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>How To</label>
                <div>
                  <div className='form-group-section'>
                    <h4>Video</h4>
                    <input
                      type="text"
                      placeholder="Image Path (e.g., howto/video)"
                      value={selectedProduct.videoImagePath || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        videoImagePath: e.target.value
                      })}
                    />
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPendingFiles(prev => ({
                            ...prev,
                            howToVideo: file
                          }));
                        }
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Video Link"
                      value={selectedProduct.howTo?.video?.link || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        howTo: {
                          ...selectedProduct.howTo,
                          video: {
                            ...selectedProduct.howTo?.video,
                            link: e.target.value
                          }
                        }
                      })}
                    />
                    <div className="image-preview">
                      {(pendingFiles.howToVideo || selectedProduct?.howTo?.video?.image) && (
                        <img
                          src={pendingFiles.howToVideo ? URL.createObjectURL(pendingFiles.howToVideo) : selectedProduct.howTo.video.image}
                          alt="Video preview"
                          style={{ maxHeight: '100px' }}
                        />
                      )}
                    </div>
                  </div>
                  <div className='form-group-section'>
                    <h4>Schematic</h4>
                    <input
                      type="text"
                      placeholder="Image Path (e.g., howto/schematic)"
                      value={selectedProduct.schematicImagePath || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        schematicImagePath: e.target.value
                      })}
                    />
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPendingFiles(prev => ({
                            ...prev,
                            howToSchematic: file
                          }));
                        }
                      }}
                    />
                    <div className="image-preview">
                      {(pendingFiles.howToSchematic || selectedProduct?.howTo?.schematic?.image) && (
                        <img
                          src={pendingFiles.howToSchematic ? URL.createObjectURL(pendingFiles.howToSchematic) : selectedProduct.howTo.schematic.image}
                          alt="Schematic preview"
                          style={{ maxHeight: '100px' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Specs</label>
                <div>
                  <div className='form-group-section'>
                    <h4>Info (comma-separated)</h4>
                    <input
                      type="text"
                      value={Array.isArray(selectedProduct.specs?.info) ? selectedProduct.specs.info.join(', ') : ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        specs: {
                          ...selectedProduct.specs,
                          info: e.target.value.split(',').map(item => item.trim())
                        }
                      })}
                    />
                  </div>
                  <div className='form-group-section'>
                    <h4>Images</h4>
                    <input
                      type="text"
                      placeholder="Image Path (e.g., specs/main)"
                      value={selectedProduct.specsImagePath || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        specsImagePath: e.target.value
                      })}
                    />
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                          setPendingFiles(prev => ({
                            ...prev,
                            specsImages: [...prev.specsImages, ...files]
                          }));
                        }
                      }}
                    />
                    <div className="image-preview">
                      {[...(pendingFiles.specsImages || []), ...(selectedProduct?.specs?.images || [])].map((file, index) => (
                        <img
                          key={index}
                          src={file instanceof File ? URL.createObjectURL(file) : file.image}
                          alt={`Spec preview ${index + 1}`}
                          style={{ maxHeight: '100px', marginRight: '8px' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save button black">
                  {isEditing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeForm} className="cancel button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 