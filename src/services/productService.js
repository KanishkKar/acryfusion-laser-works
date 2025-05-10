const apiUrl = import.meta.env.VITE_API_URL;

// Helper function to get file URL from Google Drive
const getFileUrl = (path) => {
  if (!path) {
    console.error('Empty path provided to getFileUrl');
    return '';
  }
  const url = `${apiUrl}/api/files/${path}`;

  return url;
};

// Helper function to process product data
const processProductData = (product) => {
  if (!product) return null;
  return product; // No need to process URLs since they're already web content links
};

export const getTopProducts = async () => {
  console.log(apiUrl);
  try {
    const response = await fetch(`${apiUrl}/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const products = await response.json();
    return products
      .filter(product => product.tags?.includes("EDITOR'S CHOICE"))
      .map(processProductData);
  } catch (error) {
    console.error('Error fetching top products:', error);
    return [];
  }
};

export const getProductById = async (id) => {
  try {
    const response = await fetch(`${apiUrl}/products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    const product = await response.json();
    return processProductData(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const getAllProducts = async () => {
  try {
    const response = await fetch(`${apiUrl}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const products = await response.json();
    return products.map(processProductData);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const searchProducts = async (searchString) => {
  try {
    const response = await fetch(`${apiUrl}/products/search?q=${encodeURIComponent(searchString)}`);
    if (!response.ok) {
      throw new Error('Failed to search products');
    }
    const products = await response.json();
    return products.map(processProductData);
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Create a new product
export const createProduct = async (product) => {
  try {
    const response = await fetch(`${apiUrl}/products`, {
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
    const response = await fetch(`${apiUrl}/products/${id}`, {
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
    const response = await fetch(`${apiUrl}/products/${id}`, {
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

    const response = await fetch(`${apiUrl}/api/upload`, {
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