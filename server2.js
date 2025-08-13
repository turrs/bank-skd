import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, metadata } = req.body;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata
    });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// User endpoints
app.get('/api/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Questions endpoints
app.get('/api/questions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Packages endpoints
app.get('/api/packages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('question_packages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('question_packages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Tryout endpoints
app.post('/api/tryout/start', async (req, res) => {
  try {
    const { user_id, package_id } = req.body;
    const { data, error } = await supabase
      .from('tryout_sessions')
      .insert({
        user_id,
        package_id,
        started_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/tryout/submit', async (req, res) => {
  try {
    const { session_id, answers } = req.body;
    
    // Insert answers
    const { error: answersError } = await supabase
      .from('user_answers')
      .insert(answers);
    
    if (answersError) throw answersError;
    
    // Update session status
    const { error: sessionError } = await supabase
      .from('tryout_sessions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', session_id);
    
    if (sessionError) throw sessionError;
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Payment endpoints
app.post('/api/payments/create', async (req, res) => {
  try {
    const { user_id, package_id, amount, voucher_code } = req.body;
    
    // Create payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id,
        package_id,
        amount,
        voucher_code,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Voucher endpoints
app.post('/api/vouchers/validate', async (req, res) => {
  try {
    const { code, package_id } = req.body;
    
    // Get voucher details
    const { data: voucher, error: voucherError } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();
    
    if (voucherError || !voucher) {
      return res.json({ 
        success: false, 
        valid: false, 
        message: 'Voucher tidak valid atau tidak aktif' 
      });
    }
    
    // Check if voucher is expired
    if (voucher.valid_until && new Date() > new Date(voucher.valid_until)) {
      return res.json({ 
        success: false, 
        valid: false, 
        message: 'Voucher sudah expired' 
      });
    }
    
    // Check usage limit
    if (voucher.used_count >= voucher.usage_limit) {
      return res.json({ 
        success: false, 
        valid: false, 
        message: 'Voucher sudah habis digunakan' 
      });
    }
    
    res.json({ 
      success: true, 
      valid: true, 
      data: voucher,
      message: 'Voucher valid'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Chat endpoints
app.get('/api/chat/rooms', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/chat/rooms/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/chat/messages', async (req, res) => {
  try {
    const { room_id, user_id, content } = req.body;
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id,
        user_id,
        content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something broke!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CORS enabled for localhost:5173 and localhost:3000`);
});
