import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import midtransClient from 'midtrans-client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Midtrans client
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YourServerKeyHere',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YourClientKeyHere'
});

// Midtrans token creation endpoint
app.post('/api/midtrans/create-token', async (req, res) => {
  try {
    const { payment_id, amount, package_name, customer_name, customer_email, customer_phone } = req.body;

    console.log('Creating Midtrans transaction with:', {
      payment_id,
      amount,
      package_name,
      customer_name,
      customer_email,
      customer_phone
    });

    // Validate required fields
    if (!payment_id || !amount || !package_name || !customer_name || !customer_email) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['payment_id', 'amount', 'package_name', 'customer_name', 'customer_email']
      });
    }

    // Create Midtrans transaction
    const parameter = {
      transaction_details: {
        order_id: payment_id,
        gross_amount: amount
      },
      item_details: [{
        id: payment_id,
        price: amount,
        quantity: 1,
        name: package_name
      }],
      customer_details: {
        first_name: customer_name,
        email: customer_email,
        phone: customer_phone
      }
    };

    console.log('Creating Midtrans transaction with:', parameter);

    const transaction = await snap.createTransaction(parameter);
    console.log('Midtrans transaction created:', transaction);

    res.status(200).json({ 
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      success: true
    });
  } catch (error) {
    console.error('Midtrans error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment token',
      error: error.message,
      details: error.toString()
    });
  }
});

// Payment status check endpoint
app.post('/api/midtrans/check-status', async (req, res) => {
  try {
    const { payment_id } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({ message: 'Payment ID required' });
    }

    // Mock payment status for testing
    const mockStatus = Math.random() > 0.5 ? 'completed' : 'pending';
    
    res.status(200).json({ 
      status: mockStatus,
      payment_id,
      success: true
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ 
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Midtrans API available at http://localhost:${PORT}/api/midtrans`);
});
