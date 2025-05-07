import productsData from '../data/products.json';

const API_URL = 'http://localhost:3001';

export const getTopProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch top products');
    }
    const products = await response.json();
    return products.filter(product => product.tags.includes("EDITOR'S CHOICE")).slice(0, 3);
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const getAllProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const searchProducts = async (searchString) => {
  try {
    const response = await fetch(`${API_URL}/products?q=${encodeURIComponent(searchString)}`);
    if (!response.ok) {
      throw new Error('Failed to search products');
    }
    const products = await response.json();
    const searchLower = searchString.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Create a new product
export const createProduct = async (product) => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update an existing product
export const updateProduct = async (id, product) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Upload a file
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get file data
export const getFileData = (filename) => {
  const fileData = localStorage.getItem(`file_${filename}`);
  return fileData ? JSON.parse(fileData).data : null;
}; 