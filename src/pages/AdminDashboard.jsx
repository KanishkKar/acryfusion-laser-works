import React, { useState, useEffect } from 'react';
import { getAllProducts, createProduct, updateProduct, deleteProduct, uploadFile, getFileData } from '../services/productService';
import { PRODUCT_IMAGES_PATH } from '../config';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Upload all pending files first
      const uploadedFiles = {};
      
      // Upload hero image if pending
      if (pendingFiles.heroImage) {
        const data = await uploadFile(pendingFiles.heroImage);
        uploadedFiles.heroImage = data.filename;
      }

      // Upload how to video image if pending
      if (pendingFiles.howToVideo) {
        const data = await uploadFile(pendingFiles.howToVideo);
        uploadedFiles.howToVideo = data.filename;
      }

      // Upload how to schematic image if pending
      if (pendingFiles.howToSchematic) {
        const data = await uploadFile(pendingFiles.howToSchematic);
        uploadedFiles.howToSchematic = data.filename;
      }

      // Upload specs images if pending
      if (pendingFiles.specsImages.length > 0) {
        const uploadPromises = pendingFiles.specsImages.map(file => uploadFile(file));
        uploadedFiles.specsImages = await Promise.all(uploadPromises);
      }

      // Upload option images if pending
      for (const [optionIndex, files] of Object.entries(pendingFiles.optionImages)) {
        if (files.length > 0) {
          const uploadPromises = files.map(file => uploadFile(file));
          uploadedFiles[`optionImages_${optionIndex}`] = await Promise.all(uploadPromises);
        }
      }

      // Update the product with uploaded file paths
      const updatedProduct = { ...selectedProduct };

      if (uploadedFiles.heroImage) {
        updatedProduct.heroImage = {
          ...updatedProduct.heroImage,
          src: `${PRODUCT_IMAGES_PATH}/${uploadedFiles.heroImage}`,
          alt: pendingFiles.heroImage.name
        };
      }

      if (uploadedFiles.howToVideo) {
        updatedProduct.howTo = {
          ...updatedProduct.howTo,
          video: {
            ...updatedProduct.howTo?.video,
            src: `${PRODUCT_IMAGES_PATH}/${uploadedFiles.howToVideo}`
          }
        };
      }

      if (uploadedFiles.howToSchematic) {
        updatedProduct.howTo = {
          ...updatedProduct.howTo,
          schematic: {
            ...updatedProduct.howTo?.schematic,
            src: `${PRODUCT_IMAGES_PATH}/${uploadedFiles.howToSchematic}`,
            name: pendingFiles.howToSchematic.name
          }
        };
      }

      if (uploadedFiles.specsImages.length > 0) {
        const newImages = uploadedFiles.specsImages.map((filename, index) => ({
          src: `${PRODUCT_IMAGES_PATH}/${filename}`,
          alt: pendingFiles.specsImages[index].name,
          label: pendingFiles.specsImages[index].name
        }));
        updatedProduct.specs = {
          ...updatedProduct.specs,
          images: [...(updatedProduct.specs?.images || []), ...newImages]
        };
      }

      for (const [key, filenames] of Object.entries(uploadedFiles)) {
        if (key.startsWith('optionImages_')) {
          const optionIndex = parseInt(key.split('_')[1]);
          const newImages = filenames.map((filename, index) => ({
            src: `${PRODUCT_IMAGES_PATH}/${filename}`,
            alt: pendingFiles.optionImages[optionIndex][index].name,
            label: pendingFiles.optionImages[optionIndex][index].name
          }));
          updatedProduct.options[optionIndex].images = [
            ...(updatedProduct.options[optionIndex].images || []),
            ...newImages
          ];
        }
      }

      // Save the product
      if (isEditing) {
        const savedProduct = await updateProduct(updatedProduct.id, updatedProduct);
        const updatedProducts = products.map(p => 
          p.id === updatedProduct.id ? savedProduct : p
        );
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
      } else {
        const newProduct = { ...updatedProduct, id: generateNewId() };
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

  const handleFileUpload = async (file) => {
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send the file to the server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.filename; // Return just the filename
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
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
                heroImage: { src: '', alt: '' },
                howTo: {
                  video: { image: '', link: '' },
                  schematic: { image: '', link: '', name: '' }
                },
                specs: {
                  info: [],
                  images: []
                },
                options: [{ 
                  name: '', 
                  groupName: '', 
                  sizes: [{ name: '', price: '', stock: '' }], 
                  inStock: true,
                  images: [] 
                }] 
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
              <th>Stock</th>
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
                <td>{product.options ? product.options.reduce((total, option) => total + option.sizes.reduce((sum, size) => sum + (parseInt(size.stock) || 0), 0), 0) : 0}</td>
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
                  id="text"
                  value={selectedProduct.category || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, category: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hero Image</label>
                <div>
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

              <div className="form-group">
                <label>How To</label>
                <div>
                  <div className='form-group-section'>
                    <h4>Video</h4>
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
                      {(pendingFiles.howToVideo || selectedProduct?.howTo?.video?.src) && (
                        <img
                          src={pendingFiles.howToVideo ? URL.createObjectURL(pendingFiles.howToVideo) : selectedProduct.howTo.video.src}
                          alt="Video preview"
                          style={{ maxHeight: '100px' }}
                        />
                      )}
                    </div>
                  </div>
                  <div className='form-group-section'>
                    <h4>Schematic</h4>
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
                      {(pendingFiles.howToSchematic || selectedProduct?.howTo?.schematic?.src) && (
                        <img
                          src={pendingFiles.howToSchematic ? URL.createObjectURL(pendingFiles.howToSchematic) : selectedProduct.howTo.schematic.src}
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
                    <h4>Info (one per line)</h4>
                    <textarea
                      value={Array.isArray(selectedProduct.specs?.info) ? selectedProduct.specs.info.join('\n') : ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        specs: {
                          ...selectedProduct.specs,
                          info: e.target.value.split('\n').filter(line => line.trim())
                        }
                      })}
                    />
                  </div>
                  <div className='form-group-section'>
                    <h4>Images</h4>
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
                          src={file instanceof File ? URL.createObjectURL(file) : file.src}
                          alt={`Spec preview ${index + 1}`}
                          style={{ maxHeight: '100px', marginRight: '8px' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Options</label>
                {Array.isArray(selectedProduct.options) ? selectedProduct.options.map((option, optionIndex) => (
                  <div key={optionIndex}>
                    <div className="form-group-section">
                      <label htmlFor={`option-name-${optionIndex}`}>Name</label>
                      <input
                        type="text"
                        id={`option-name-${optionIndex}`}
                        value={option.name || ''}
                        onChange={(e) => {
                          const updatedOptions = [...selectedProduct.options];
                          updatedOptions[optionIndex].name = e.target.value;
                          setSelectedProduct({...selectedProduct, options: updatedOptions});
                        }}
                        required
                      />
                    </div>
                    <div className="form-group-section">
                      <label htmlFor={`option-groupName-${optionIndex}`}>Group Name</label>
                      <input
                        type="text"
                        id={`option-groupName-${optionIndex}`}
                        value={option.groupName || ''}
                        onChange={(e) => {
                          const updatedOptions = [...selectedProduct.options];
                          updatedOptions[optionIndex].groupName = e.target.value;
                          setSelectedProduct({...selectedProduct, options: updatedOptions});
                        }}
                        required
                      />
                    </div>
                    <div className="form-group-section">
                      <h4>Size</h4>
                      {Array.isArray(option.sizes) ? option.sizes.map((size, sizeIndex) => (
                        <div key={sizeIndex} className="size-inputs-container">
                          <input
                            type="text"
                            placeholder="Name"
                            value={size.name || ''}
                            onChange={(e) => {
                              const updatedOptions = [...selectedProduct.options];
                              updatedOptions[optionIndex].sizes[sizeIndex].name = e.target.value;
                              setSelectedProduct({...selectedProduct, options: updatedOptions});
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={size.price || ''}
                            onChange={(e) => {
                              const updatedOptions = [...selectedProduct.options];
                              updatedOptions[optionIndex].sizes[sizeIndex].price = parseFloat(e.target.value) || '';
                              setSelectedProduct({...selectedProduct, options: updatedOptions});
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={size.stock || ''}
                            onChange={(e) => {
                              const updatedOptions = [...selectedProduct.options];
                              updatedOptions[optionIndex].sizes[sizeIndex].stock = parseInt(e.target.value, 10) || '';
                              setSelectedProduct({...selectedProduct, options: updatedOptions});
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedOptions = [...selectedProduct.options];
                              updatedOptions[optionIndex].sizes = [...(updatedOptions[optionIndex].sizes || []), { name: '', price: '', stock: '' }];
                              setSelectedProduct({...selectedProduct, options: updatedOptions});
                            }}
                            className="add-size button white"
                          >
                            +
                          </button>
                        </div>
                      )) : null}
                    </div>
                    <div className="form-group-section">
                      <div className="in-stock-container">
                        <h4>In Stock</h4>
                        <input
                          type="checkbox"
                          id={`option-inStock-${optionIndex}`}
                          checked={option.inStock || false}
                          onChange={(e) => {
                            const updatedOptions = [...selectedProduct.options];
                            updatedOptions[optionIndex].inStock = e.target.checked;
                            setSelectedProduct({...selectedProduct, options: updatedOptions});
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-group-section">
                      <label>Images</label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (files.length > 0) {
                            setPendingFiles(prev => ({
                              ...prev,
                              optionImages: {
                                ...prev.optionImages,
                                [optionIndex]: [...(prev.optionImages[optionIndex] || []), ...files]
                              }
                            }));
                          }
                        }}
                      />
                      <div className="image-preview">
                        {[...(pendingFiles.optionImages[optionIndex] || []), ...(option.images || [])].map((file, index) => (
                          <img
                            key={index}
                            src={file instanceof File ? URL.createObjectURL(file) : file.src}
                            alt={`Option preview ${index + 1}`}
                            style={{ maxHeight: '100px', marginRight: '8px' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )) : null}
                <div className='add-option-container'>
                  <h4>Add Option</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct({
                        ...selectedProduct,
                        options: [...(selectedProduct.options || []), { 
                          name: '', 
                          groupName: selectedProduct.options?.[0]?.groupName || '', 
                          sizes: [{ name: '', price: '', stock: '' }], 
                          inStock: true,
                          images: [] 
                        }]
                      });
                    }}
                    className="add-option button white"
                  >
                    +
                  </button>
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