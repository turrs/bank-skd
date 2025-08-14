import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "@/App";
import { QuestionPackage, Payment, UserPackageAccess } from "@/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, QrCode, Shield, CheckCircle, Star, Clock, BookOpen, Zap, Lock, ArrowRight } from "lucide-react";
import VoucherInput from "@/components/VoucherInput";
import { VoucherValidationResult } from "@/types/voucher";

const PaymentPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { packageId } = useParams();
  
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isSnapOpen, setIsSnapOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidationResult | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (packageId) {
      loadPackageData();
    }
  }, [packageId, user, navigate]);

  const loadPackageData = async () => {
    try {
      console.log('Loading package data for ID:', packageId); // Debug
      setLoading(true);
      
      const pkgResult = await QuestionPackage.get(packageId!);
      console.log('Package data loaded:', pkgResult); // Debug
      
      const pkg = pkgResult?.data;
      
      if (!pkg) {
        toast({
          title: "Error",
          description: "Paket soal tidak ditemukan",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }
      
      // Cek apakah paket aktif
      if (!pkg.is_active) {
        toast({
          title: "Paket Tidak Tersedia",
          description: "Paket soal ini sedang tidak tersedia untuk pembelian",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }
      
      setPackageData(pkg);
      
    } catch (error: any) {
      console.error('Error loading package data:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      toast({
        title: "Error",
        description: "Gagal memuat data paket",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherApplied = (result: VoucherValidationResult) => {
    setAppliedVoucher(result);
  };

  const handleVoucherRemoved = () => {
    setAppliedVoucher(undefined);
  };

  // Helper function to handle voucher usage
  const handleVoucherUsage = async (paymentId: string, isFreePackage: boolean = false) => {
    if (!appliedVoucher || !appliedVoucher.voucher_id) return;
    
    try {
      console.log('🎫 Processing voucher usage for payment:', paymentId);
      
      // 1. Update voucher used_count
      const { data: voucherData, error: voucherError } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/vouchers?id=eq.${appliedVoucher.voucher_id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            used_count: (appliedVoucher.used_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
        }
      ).then(res => res.json());
      
      if (voucherError) {
        console.error('❌ Error updating voucher used_count:', voucherError);
      } else {
        console.log('✅ Voucher used_count updated:', voucherData);
      }
      
      // 2. Record voucher usage
      const voucherUsageData = {
        voucher_id: appliedVoucher.voucher_id,
        user_id: user.id,
        package_id: packageId,
        payment_id: paymentId,
        discount_amount: Math.round(appliedVoucher.discount_amount || 0),
        original_price: Math.round(packageData.price),
        final_price: Math.round(appliedVoucher.final_price || 0),
        used_at: new Date().toISOString()
      };
      
      const { data: usageData, error: usageError } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/voucher_usage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(voucherUsageData)
        }
      ).then(res => res.json());
      
      if (usageError) {
        console.error('❌ Error recording voucher usage:', usageError);
      } else {
        console.log('✅ Voucher usage recorded:', usageData);
      }
      
      // 3. Check if voucher is now exhausted
      const newUsedCount = (appliedVoucher.used_count || 0) + 1;
      if (newUsedCount >= (appliedVoucher.usage_limit || 1)) {
        console.log('⚠️ Voucher usage limit reached, deactivating voucher');
        
        // Deactivate voucher if usage limit reached
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/vouchers?id=eq.${appliedVoucher.voucher_id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              is_active: false,
              updated_at: new Date().toISOString()
            })
          }
        );
      }
      
    } catch (voucherError) {
      console.error('💥 Error handling voucher usage:', voucherError);
      // Don't fail the payment if voucher handling fails
    }
  };

  const handlePayment = async () => {
    if (!formData.phone || !formData.email) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi nomor telepon dan email",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      
      // Create payment record - Round all amounts to integers
      const finalPrice = appliedVoucher ? appliedVoucher.final_price : packageData.price;
      const discountAmount = appliedVoucher?.discount_amount || 0;
      const originalAmount = packageData.price;
      
      // Check if discount is 100% or final price is 0
      const isFreePackage = finalPrice <= 0 || (appliedVoucher && discountAmount >= originalAmount);
      
      console.log('💰 Payment calculation:', {
        originalPrice: originalAmount,
        finalPrice: finalPrice,
        discountAmount: discountAmount,
        isFreePackage: isFreePackage,
        voucherApplied: !!appliedVoucher
      });
      
      const paymentData = {
        user_id: user.id,
        package_id: packageId,
        amount: Math.round(finalPrice), // Round to integer
        original_amount: Math.round(originalAmount), // Round to integer
        status: 'pending',
        payment_method: paymentMethod,
        voucher_code: appliedVoucher?.voucher_id || null,
        discount_amount: Math.round(discountAmount) // Round to integer
      };

      const paymentResult = await Payment.create(paymentData);
      console.log('Payment created:', paymentResult); // Debug
      
      if (!paymentResult?.data?.[0]?.id) {
        throw new Error('Failed to create payment record');
      }
      
      const payment = paymentResult.data[0];
      
      // Handle free package (100% discount or 0 price)
      if (isFreePackage) {
        console.log('🎉 Free package detected! Granting access directly...');
        
        try {
          // Update payment status to completed
          await Payment.update(payment.id, {
            status: 'completed'
          });
          
          // Check if user already has access to this package
          const existingAccess = await UserPackageAccess.list();
          const hasAccess = existingAccess?.data?.some((access: any) => 
            access.user_id === user.id && access.package_id === packageId
          );
          
          if (!hasAccess) {
            // Grant package access to user
            const accessData = {
              user_id: user.id,
              package_id: packageId,
              payment_id: payment.id,
              is_active: true
            };
            
            const accessResult = await UserPackageAccess.create(accessData);
            console.log('Package access granted:', accessResult);
            
            // Handle voucher usage for free package
            await handleVoucherUsage(payment.id, true);
          } else {
            console.log('User already has access to this package');
          }
          
          toast({
            title: "🎉 Paket Gratis!",
            description: `Selamat! Anda mendapatkan akses gratis ke ${packageData.title}`,
          });
          
          // Navigate to dashboard or package
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          
          return; // Exit early, no need for Midtrans
        } catch (error: any) {
          console.error('Error granting free access:', error);
          
          // Log detailed error info
          if (error?.code) {
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
          }
          
          toast({
            title: "Error",
            description: `Gagal memberikan akses gratis: ${error?.message || 'Unknown error'}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Prepare Midtrans data - sesuai dengan yang diharapkan server
      const midtransData = {
        payment_id: payment.id, // ID dari payment yang baru dibuat
        amount: Math.round(finalPrice), // Amount yang sudah di-round
        package_name: packageData.title, // Nama paket
        customer_name: user.full_name || 'User', // Nama customer
        customer_email: formData.email, // Email customer
        customer_phone: formData.phone // Phone customer
      };

      console.log('Midtrans data:', midtransData); // Debug
      console.log('Environment check:', {
        hasServerKey: !!process.env.MIDTRANS_SERVER_KEY,
        hasClientKey: !!process.env.MIDTRANS_CLIENT_KEY,
        nodeEnv: process.env.NODE_ENV
      });

      // Call Midtrans API via Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(midtransData),
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create payment token`);
      }

      const result = await response.json();
      console.log('Midtrans response:', result); // Debug

      if (result.token && result.success) {
        console.log('Snap token received:', result.token);
        
        // Open Midtrans Snap
        setIsSnapOpen(true);
        
        // @ts-ignore
        window.snap.pay(result.token, {
          onSuccess: (result) => {
            console.log('Payment success:', result);
            handlePaymentSuccess(payment.id, result);
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            handlePaymentPending(payment.id, result);
          },
          onError: (result) => {
            console.log('Payment error:', result);
            handlePaymentError(payment.id, result);
          },
          onClose: () => {
            console.log('Payment closed');
            setIsSnapOpen(false);
          }
        });
      } else {
        console.error('Invalid response:', result);
        throw new Error('No payment token received');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Gagal memulai pembayaran",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: any, result: any) => {
    try {
      setIsSnapOpen(false);
      
      // Update payment status
      await Payment.update(paymentId, {
        status: 'completed',
        transaction_id: result.transaction_id,
        midtrans_data: result
      });

      // Handle voucher usage if voucher was applied
      await handleVoucherUsage(paymentId);

      // Check if user already has access to this package
      const existingAccess = await UserPackageAccess.list();
      const hasAccess = existingAccess?.data?.some((access: any) => 
        access.user_id === user.id && access.package_id === packageId
      );
      
      if (!hasAccess) {
        // Grant package access to user
        const accessData = {
          user_id: user.id,
          package_id: packageId,
          payment_id: paymentId,
          is_active: true
        };
        
        const accessResult = await UserPackageAccess.create(accessData);
        console.log('Package access granted after payment:', accessResult);
      } else {
        console.log('User already has access to this package after payment');
      }

      toast({
        title: "Pembayaran Berhasil!",
        description: "Paket soal sudah bisa diakses",
      });
      
      // Redirect ke dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  };

  const handlePaymentPending = async (paymentId: any, result: any) => {
    try {
      setIsSnapOpen(false);
      
      await Payment.update(paymentId, {
        status: 'pending',
        midtrans_data: result
      });
      
      toast({
        title: "Pembayaran Pending",
        description: "Menunggu konfirmasi pembayaran",
      });
      
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error handling payment pending:', error);
    }
  };

  const handlePaymentError = async (paymentId: any, result: any) => {
    try {
      setIsSnapOpen(false);
      
      await Payment.update(paymentId, {
        status: 'failed',
        midtrans_data: result
      });
      
      toast({
        title: "Pembayaran Gagal",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('Error handling payment error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto absolute top-0 left-0"></div>
          </div>
          <div className="space-y-2">
            <p className="text-blue-900 font-medium text-lg">Memuat Data Paket</p>
            <p className="text-blue-700 text-sm">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - package tidak ditemukan
  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <div className="space-y-2">
            <p className="text-blue-900 font-semibold text-xl">Paket Tidak Ditemukan</p>
            <p className="text-blue-700">Paket soal yang Anda cari tidak tersedia</p>
          </div>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-3 text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Kembali</span>
              </Button>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Pembayaran
              </h1>
              <p className="text-blue-600 font-medium">Lengkapi data untuk melanjutkan</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - Package Info */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Package Hero Card */}
            <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{packageData.title}</h2>
                      <p className="text-blue-100 opacity-90">{packageData.description}</p>
                    </div>
                  </div>
                  {packageData.is_featured && (
                    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span>FEATURED</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-blue-100 text-sm">Durasi</p>
                    <p className="text-2xl font-bold">{packageData.duration_minutes}m</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-8 h-8" />
                    </div>
                    <p className="text-blue-100 text-sm">Total Soal</p>
                    <p className="text-2xl font-bold">{packageData.total_questions}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <p className="text-blue-100 text-sm">Status</p>
                    <p className="text-2xl font-bold">Aktif</p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Price Display */}
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    {appliedVoucher ? (
                      <div className="space-y-2">
                        <p className="text-blue-600 text-sm font-medium">Harga Setelah Diskon</p>
                        <div className="text-sm text-gray-500 line-through">
                          Rp {packageData.price?.toLocaleString()}
                        </div>
                        {(appliedVoucher.final_price || 0) <= 0 ? (
                          <div className="space-y-2">
                            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              🎉 GRATIS!
                            </div>
                            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                              <CheckCircle className="w-4 h-4" />
                              <span>100% Diskon - Langsung Akses!</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              Rp {appliedVoucher.final_price?.toLocaleString()}
                            </div>
                            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                              <CheckCircle className="w-4 h-4" />
                              <span>Hemat Rp {appliedVoucher.discount_amount?.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-blue-600 text-sm font-medium">Harga Paket</p>
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          Rp {packageData.price?.toLocaleString()}
                        </div>
                        {packageData.original_price && packageData.discount_percentage > 0 && (
                          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                            <span>🔥 {packageData.discount_percentage}% OFF</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Voucher Input */}
                  <VoucherInput
                    packageId={packageId!}
                    originalPrice={packageData.price}
                    onVoucherApplied={handleVoucherApplied}
                    onVoucherRemoved={handleVoucherRemoved}
                    appliedVoucher={appliedVoucher}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Form */}
          <div className="space-y-6">
            
            {/* Payment Form Card */}
            <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xl">Data Pembayaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Phone Input */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-blue-900 font-medium">Nomor Telepon</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="08xxxxxxxxxx"
                      required
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg"
                    />
                  </div>
                </div>
                
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-900 font-medium">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@example.com"
                      required
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg"
                    />
                  </div>
                </div>

                {/* Security Badge */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-blue-900 font-medium text-sm">Pembayaran Aman</p>
                      <p className="text-blue-700 text-xs">Data Anda dilindungi dengan enkripsi SSL</p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={processing || isSnapOpen}
                  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 ${
                    appliedVoucher && (appliedVoucher.final_price || 0) <= 0
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  } text-white`}
                  size="lg"
                >
                  {processing ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span>
                        {appliedVoucher && (appliedVoucher.final_price || 0) <= 0 
                          ? '🎉 Dapatkan Akses Gratis!' 
                          : 'Bayar Sekarang'
                        }
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card className="bg-white/60 backdrop-blur-md border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-blue-900 font-medium">Dipercaya oleh Ribuan Pengguna</p>
                  <div className="flex items-center justify-center space-x-6 text-blue-600">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span className="text-sm font-medium">Aman</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Terpercaya</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span className="text-sm font-medium">Cepat</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;