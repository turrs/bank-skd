import midtransClient from 'midtrans-client';

// Use proper environment variable access
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || process.env.VITE_MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY || process.env.VITE_MIDTRANS_CLIENT_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { payment_id, amount, package_name, customer_name, customer_email, customer_phone } = req.body;

    // Validate required fields
    if (!payment_id || !amount || !package_name || !customer_name || !customer_email) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['payment_id', 'amount', 'package_name', 'customer_name', 'customer_email']
      });
    }

    console.log('Creating Midtrans transaction with:', {
      payment_id,
      amount,
      package_name,
      customer_name,
      customer_email,
      customer_phone
    });

    // Validate environment variables
    if (!process.env.MIDTRANS_SERVER_KEY && !process.env.VITE_MIDTRANS_SERVER_KEY) {
      console.error('Missing MIDTRANS_SERVER_KEY environment variable');
      return res.status(500).json({ 
        message: 'Midtrans server key not configured',
        error: 'Missing MIDTRANS_SERVER_KEY'
      });
    }

    const parameter = {
      transaction_details: {
        order_id: payment_id,
        gross_amount: parseInt(amount)
      },
      item_details: [{
        id: package_name,
        price: parseInt(amount),
        quantity: 1,
        name: package_name
      }],
      customer_details: {
        first_name: customer_name,
        email: customer_email,
        phone: customer_phone || ''
      },
      enabled_payments: ['qris', 'bank_transfer', 'credit_card']
    };

    console.log('Midtrans parameter:', parameter);

    const token = await snap.createTransaction(parameter);
    
    console.log('Midtrans token generated successfully:', { 
      token: token.token,
      redirect_url: token.redirect_url 
    });
    
    res.status(200).json({ 
      token: token.token,
      redirect_url: token.redirect_url,
      success: true
    });
  } catch (error) {
    console.error('Midtrans error:', error);
    
    // Handle specific Midtrans errors
    if (error.message.includes('server key')) {
      return res.status(500).json({ 
        message: 'Midtrans configuration error',
        error: 'Invalid server key or client key'
      });
    }
    
    if (error.message.includes('amount')) {
      return res.status(400).json({ 
        message: 'Invalid amount',
        error: 'Amount must be a valid number'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create payment token',
      error: error.message,
      details: error.toString()
    });
  }
}
