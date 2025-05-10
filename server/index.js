const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../config/googleapi/acryfusion-laser-works-2c18010ccf4f.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

const SPREADSHEET_ID = '10xEw55BPj4DsRmG5a25OGJ7qBwWQ2qyACEBJF_8sONo';
const DRIVE_FOLDER_ID = '1BC_c2LWurX9s7EHgBtAyNdw2rBxOUIDq';

// Helper function to convert sheet data to objects
const sheetToObjects = (values) => {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
};

// Helper function to process product data
const processProductData = async (product, images, options) => {
  // Process hero image
  const heroImageFile = images.find(img => 
    img.product_id === product.product_id && 
    !img.image_path
  );
  const heroImage = {
    src: heroImageFile ? await getFileUrl(heroImageFile.file_id) : '',
    alt: product.product_name
  };

  // Process specs images
  const specs = {
    info: product.specs_info ? product.specs_info.split(',').map(item => item.trim()) : [],
    images: []
  };

  // Process specs images
  if (product.specs_image_path) {
    const specsImages = images.filter(img => 
      img.product_id === product.product_id && 
      img.image_path === product.specs_image_path
    );
    specs.images = await Promise.all(specsImages.map(async img => ({
      image: await getFileUrl(img.file_id),
      alt: img.label,
      label: img.label
    })));
  }

  // Process howTo section
  const howTo = {
    video: {
      link: product.how_to_video_link || '',
      image: await getFileUrl(images.find(img => 
        img.product_id === product.product_id && 
        img.image_path === product.video_image_path
      )?.file_id)
    },
    schematic: {
      link: product.how_to_schematic_file || '',
      image: await getFileUrl(images.find(img => 
        img.product_id === product.product_id && 
        img.image_path === product.schematic_image_path
      )?.file_id),
      name: product.how_to_schematic_file ? path.basename(product.how_to_schematic_file) : ''
    }
  };
  
  // Process options
  const productOptions = await Promise.all(options
    .filter(opt => opt.product_id === product.product_id)
    .reduce((acc, opt) => {
      const existingOption = acc.find(o => 
        o.groupName === opt.group_name && 
        o.name === opt.name
      );

      if (existingOption) {
        existingOption.sizes.push({
          name: opt.size,
          price: parseFloat(opt.price),
          stock: parseInt(opt.stock) || 0
        });
      } else {
        acc.push({
          groupName: opt.group_name,
          name: opt.name,
          sizes: [{
            name: opt.size,
            price: parseFloat(opt.price),
            stock: parseInt(opt.stock) || 0
          }],
          inStock: opt.in_stock === 'true',
          images: images
            .filter(img => 
              img.product_id === product.product_id && 
              img.image_path === opt.image_path
            )
            .map(img => ({
              file_id: img.file_id,
              alt: img.label,
              label: img.label
            }))
        });
      }
      return acc;
    }, []));

  // Process option images
  for (const option of productOptions) {
    option.images = await Promise.all(option.images.map(async img => ({
      ...img,
      image: await getFileUrl(img.file_id)
    })));
  }

  return {
    id: product.product_id,
    name: product.product_name,
    description: product.product_description,
    title: product.product_title,
    tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
    pointers: product.pointers ? product.pointers.split(',').map(pointer => pointer.trim()) : [],
    details: product.details,
    specs,
    howTo,
    options: productOptions,
    category: product.category,
    heroImage
  };
};

// Helper function to get web content link
const getFileUrl = async (fileId) => {
  if (!fileId) return '';
  
  try {
    // Return a URL to our own endpoint that will serve the image
    return `http://localhost:3001/api/images/${fileId}`;
  } catch (error) {
    console.error('Error generating image URL for file:', fileId, error);
    return '';
  }
};

// Add new endpoint to serve images
app.get('/api/images/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get the file metadata
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType'
    });

    // Get the file content
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    // Set appropriate headers
    res.setHeader('Content-Type', fileResponse.data.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Pipe the file stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error serving image');
  }
});

// Add new endpoint to handle file uploads to Google Drive
app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const { imagePath, productId } = req.body; // Get both imagePath and productId

    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    // Upload to Google Drive
    const fileMetadata = {
      name: file.name,
      parents: [DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: file.mimetype,
      body: file.data
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name'
    });

    // Add entry to images sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'images!A:E',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          response.data.id, // file_id
          productId || '', // product_id (use provided productId or empty string)
          imagePath, // image_path
          file.name, // label
          '' // description
        ]]
      }
    });

    res.json({
      fileId: response.data.id,
      name: response.data.name,
      imagePath: imagePath,
      productId: productId
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const [productsResponse, imagesResponse, optionsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'products!A:N',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'images!A:E', // Updated to include file_id column
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'options!A:H',
      })
    ]);

    const products = sheetToObjects(productsResponse.data.values);
    const images = sheetToObjects(imagesResponse.data.values);
    const options = sheetToObjects(optionsResponse.data.values);

    const enrichedProducts = await Promise.all(products.map(product => 
      processProductData(product, images, options)
    ));

    res.json(enrichedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const [productsResponse, imagesResponse, optionsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'products!A:N',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'images!A:E', // Updated to include file_id column
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'options!A:H',
      })
    ]);

    const products = sheetToObjects(productsResponse.data.values);
    const images = sheetToObjects(imagesResponse.data.values);
    const options = sheetToObjects(optionsResponse.data.values);

    const product = products.find(p => p.product_id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const enrichedProduct = await processProductData(product, images, options);
    res.json(enrichedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Search products
app.get('/products/search', async (req, res) => {
  try {
    const query = req.query.q.toLowerCase();
    const [productsResponse, imagesResponse, optionsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'products!A:N',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'images!A:D',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'options!A:H',
      })
    ]);

    const products = sheetToObjects(productsResponse.data.values);
    const images = sheetToObjects(imagesResponse.data.values);
    const options = sheetToObjects(optionsResponse.data.values);

    const filteredProducts = products.filter(product => 
      product.product_name.toLowerCase().includes(query) ||
      product.product_description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );

    const enrichedProducts = filteredProducts.map(product => 
      processProductData(product, images, options)
    );

    res.json(enrichedProducts);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 