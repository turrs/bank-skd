import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PaymentSetting } from "@/entities";
import { toast } from "@/hooks/use-toast";

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    qris_merchant_id: "",
    qris_merchant_name: "",
    payment_timeout_minutes: 30,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsList = await PaymentSetting.list('-created_at', 1);
      if (settingsList.length > 0) {
        const currentSettings = settingsList[0];
        setSettings({
          qris_merchant_id: currentSettings.qris_merchant_id || "",
          qris_merchant_name: currentSettings.qris_merchant_name || "",
          payment_timeout_minutes: currentSettings.payment_timeout_minutes || 30,
          is_active: currentSettings.is_active ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading payment settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSwitchChange = (checked) => {
    setSettings(prev => ({
      ...prev,
      is_active: checked
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Check if settings exist
      const existingSettings = await PaymentSetting.list('-created_at', 1);
      
      if (existingSettings.length > 0) {
        await PaymentSetting.update(existingSettings[0].id, settings);
      } else {
        await PaymentSetting.create(settings);
      }

      toast({
        title: "Berhasil",
        description: "Pengaturan pembayaran berhasil disimpan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan pembayaran",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Pembayaran</CardTitle>
        <CardDescription>
          Konfigurasi sistem pembayaran QRIS untuk akses paket soal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qris_merchant_id">Merchant ID QRIS</Label>
            <Input
              id="qris_merchant_id"
              name="qris_merchant_id"
              value={settings.qris_merchant_id}
              onChange={handleChange}
              placeholder="Masukkan Merchant ID QRIS"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qris_merchant_name">Nama Merchant</Label>
            <Input
              id="qris_merchant_name"
              name="qris_merchant_name"
              value={settings.qris_merchant_name}
              onChange={handleChange}
              placeholder="Masukkan nama merchant"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_timeout_minutes">Timeout Pembayaran (menit)</Label>
            <Input
              id="payment_timeout_minutes"
              name="payment_timeout_minutes"
              type="number"
              value={settings.payment_timeout_minutes}
              onChange={handleChange}
              min="5"
              max="60"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={settings.is_active}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="is_active">Sistem Pembayaran Aktif</Label>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;