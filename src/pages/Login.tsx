import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User } from "@/entities";
import { signInWithEmail } from "@/lib/db/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await signInWithEmail({ email, password });
      if (!user) throw new Error("User tidak ditemukan atau belum verifikasi email");
      
      toast({
        title: "Login berhasil",
        description: `Selamat datang, ${user.email}!`,
      });
      
      // Trigger auth check in App.tsx
      window.dispatchEvent(new Event('auth-change'));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error?.message || "Email tidak ditemukan atau password salah");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">BANK CPNS </CardTitle>
          <CardDescription>Masuk ke akun Anda untuk mulai tryout</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Daftar di sini
              </Link>
            </p>
           
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Login Gagal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">{errorMessage}</p>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorDialog(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;