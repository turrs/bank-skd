import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuestionPackage } from "@/entities";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";

const PackageForm = ({ packageData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: packageData?.title || '',
    description: packageData?.description || '',
    duration_minutes: packageData?.duration_minutes || 60,
    total_questions: packageData?.total_questions || 100,
    price: packageData?.price || 0,
    original_price: packageData?.original_price || 0,
    discount_percentage: packageData?.discount_percentage || 0,
    discount_end_date: packageData?.discount_end_date ? new Date(packageData.discount_end_date) : null,
    is_featured: packageData?.is_featured || false,
    requires_payment: packageData?.requires_payment !== undefined ? packageData.requires_payment : true,
    is_active: packageData?.is_active !== undefined ? packageData.is_active : true,
    threshold_twk: packageData?.threshold_twk || 0,
    threshold_tiu: packageData?.threshold_tiu || 0,
    threshold_tkp: packageData?.threshold_tkp || 0,
    threshold_non_tag: packageData?.threshold_non_tag || 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (packageData) {
      setFormData({
        title: packageData.title || "",
        description: packageData.description || "",
        duration_minutes: packageData.duration_minutes || 110,
        price: packageData.price || 0,
        requires_payment: packageData.requires_payment ?? true,
        is_active: packageData.is_active ?? true,
        threshold_twk: packageData.threshold_twk ?? 0,
        threshold_tiu: packageData.threshold_tiu ?? 0,
        threshold_tkp: packageData.threshold_tkp ?? 0,
        threshold_non_tag: packageData.threshold_non_tag ?? 0,
        original_price: packageData.original_price || 0,
        discount_percentage: packageData.discount_percentage || 0,
        discount_end_date: packageData.discount_end_date ? new Date(packageData.discount_end_date) : null,
        is_featured: packageData.is_featured || false,
      });
    }
  }, [packageData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.title || !formData.description || formData.duration_minutes <= 0 || formData.total_questions <= 0) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    // Jika ada discount, validasi harga
    if (formData.discount_percentage > 0) {
      if (formData.original_price <= 0) {
        toast({
          title: "Harga asli diperlukan",
          description: "Masukkan harga asli jika ada discount",
          variant: "destructive",
        });
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">
          {packageData ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
        </h2>
      </div>
      
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informasi Dasar</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Judul Paket</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Masukkan judul paket"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="duration_minutes">Durasi (menit)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                  placeholder="60"
                  min="1"
                  className="w-full"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Masukkan deskripsi paket"
                rows={3}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="total_questions">Jumlah Soal</Label>
                <Input
                  id="total_questions"
                  type="number"
                  value={formData.total_questions}
                  onChange={(e) => setFormData({...formData, total_questions: parseInt(e.target.value) || 0})}
                  placeholder="100"
                  min="1"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="price">Harga (Rupiah)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  placeholder="50000"
                  min="0"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Threshold Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pengaturan Ambang Batas</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="threshold_twk">TWK</Label>
                <Input
                  id="threshold_twk"
                  type="number"
                  value={formData.threshold_twk || 0}
                  onChange={(e) => setFormData({...formData, threshold_twk: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="0"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="threshold_tiu">TIU</Label>
                <Input
                  id="threshold_tiu"
                  type="number"
                  value={formData.threshold_tiu || 0}
                  onChange={(e) => setFormData({...formData, threshold_tiu: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="0"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="threshold_tkp">TKP</Label>
                <Input
                  id="threshold_tkp"
                  type="number"
                  value={formData.threshold_tkp || 0}
                  onChange={(e) => setFormData({...formData, threshold_tkp: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="0"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="threshold_non_tag">Non Tag</Label>
                <Input
                  id="threshold_non_tag"
                  type="number"
                  value={formData.threshold_non_tag || 0}
                  onChange={(e) => setFormData({...formData, threshold_non_tag: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="0"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Pricing & Discount Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pricing & Discount</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="original_price">Harga Asli (Rp)</Label>
                <Input
                  id="original_price"
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({...formData, original_price: parseInt(e.target.value) || 0})}
                  placeholder="100000"
                  min="0"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="discount_percentage">Persentase Discount (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({...formData, discount_percentage: parseInt(e.target.value) || 0})}
                  placeholder="50"
                  min="0"
                  max="100"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Masukkan 0 jika tidak ada discount
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price">Harga Setelah Discount (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  placeholder="50000"
                  min="0"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="discount_end_date">Tanggal Berakhir Discount</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.discount_end_date ? (
                        format(formData.discount_end_date, "PPP")
                      ) : (
                        <span className="text-muted-foreground">Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.discount_end_date}
                      onSelect={(date) => setFormData({...formData, discount_end_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-gray-500 mt-1">
                  Kosongkan jika discount tidak berbatas waktu
                </p>
              </div>
            </div>
            
            {/* Preview Discount */}
            {formData.discount_percentage > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Preview Discount:</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600">Harga Asli</div>
                    <div className="line-through text-gray-500 font-medium">
                      Rp {formData.original_price?.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Discount</div>
                    <div className="text-red-600 font-medium">
                      -{formData.discount_percentage}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Hemat</div>
                    <div className="text-red-600 font-medium">
                      Rp {Math.round((formData.original_price * formData.discount_percentage / 100))?.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Harga Final</div>
                    <div className="text-blue-600 font-bold">
                      Rp {formData.price?.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pengaturan</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_payment"
                    checked={formData.requires_payment}
                    onCheckedChange={(checked) => setFormData({...formData, requires_payment: checked})}
                  />
                  <Label htmlFor="requires_payment">Memerlukan Pembayaran</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                  />
                  <Label htmlFor="is_featured">Paket Featured (akan ditampilkan sebagai PAKET TERPOPULER)</Label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="px-6">
              Batal
            </Button>
            <Button type="submit" className="px-6">
              {packageData ? 'Update Paket' : 'Buat Paket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageForm;