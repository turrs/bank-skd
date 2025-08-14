import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, BookOpen, Star, Clock, DollarSign } from "lucide-react";
import { UserContext } from "@/App";
import { TentorProfile } from "@/entities";
import { toast } from "@/hooks/use-toast";

const MentorRegistrationPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    specialization: [] as string[],
    experience_years: 0,
    education_level: "",
    certification: [] as string[],
    bio: "",
    hourly_rate: 0,
    whatsapp: "",
    telegram: "",
    linkedin: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.specialization.length) {
      toast({
        title: "Error",
        description: "Pilih minimal satu spesialisasi",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bio) {
      toast({
        title: "Error",
        description: "Bio tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create tentor profile
      await TentorProfile.create({
        user_id: user.id,
        ...formData,
        is_verified: false, // Will be verified by admin
        is_active: true
      });

      toast({
        title: "Berhasil",
        description: "Pendaftaran mentor berhasil! Tim kami akan memverifikasi profil Anda dalam 1-2 hari kerja.",
      });

      // Redirect to dashboard after successful registration
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error("Error registering as mentor:", error);
      toast({
        title: "Error",
        description: "Gagal mendaftar sebagai mentor. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationChange = (value: string) => {
    if (formData.specialization.includes(value)) {
      setFormData({
        ...formData,
        specialization: formData.specialization.filter(s => s !== value)
      });
    } else {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, value]
      });
    }
  };

  const handleCertificationChange = (value: string) => {
    if (formData.certification.includes(value)) {
      setFormData({
        ...formData,
        certification: formData.certification.filter(c => c !== value)
      });
    } else {
      setFormData({
        ...formData,
        certification: [...formData.certification, value]
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Header */}
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
                Daftar Mentor
              </h1>
              <p className="text-blue-600 font-medium">Bergabung sebagai mentor SKD CPNS</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Form Pendaftaran Mentor</CardTitle>
                <CardDescription>
                  Lengkapi informasi di bawah ini untuk mendaftar sebagai mentor SKD CPNS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Specialization */}
                  <div>
                    <Label className="text-base font-medium">Spesialisasi *</Label>
                    <p className="text-sm text-gray-600 mb-3">Pilih bidang yang Anda kuasai</p>
                    <div className="grid grid-cols-2 gap-3">
                      {['TWK', 'TIU', 'TKP', 'Non Tag'].map((spec) => (
                        <div key={spec} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={spec}
                            checked={formData.specialization.includes(spec)}
                            onChange={() => handleSpecializationChange(spec)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={spec} className="text-sm font-medium">
                            {spec}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience & Education */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience_years">Pengalaman Mengajar (Tahun)</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="education_level">Pendidikan Terakhir</Label>
                      <Select
                        value={formData.education_level}
                        onValueChange={(value) => setFormData({ ...formData, education_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pendidikan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMA">SMA/SMK</SelectItem>
                          <SelectItem value="D3">D3</SelectItem>
                          <SelectItem value="S1">S1</SelectItem>
                          <SelectItem value="S2">S2</SelectItem>
                          <SelectItem value="S3">S3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio & Deskripsi Diri *</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Ceritakan tentang pengalaman, keahlian, dan passion Anda dalam mengajar SKD CPNS
                    </p>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Saya adalah mentor SKD CPNS dengan pengalaman mengajar selama 5 tahun. Spesialis dalam materi TWK dan TIU. Telah membantu ratusan siswa lulus SKD dengan skor tinggi..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <Label htmlFor="hourly_rate">Tarif per Jam (IDR)</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Tentukan tarif yang sesuai dengan pengalaman dan keahlian Anda
                    </p>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                      placeholder="100000"
                    />
                  </div>

                  {/* Contact Information */}
                  <div>
                    <Label className="text-base font-medium">Informasi Kontak</Label>
                    <p className="text-sm text-gray-600 mb-3">Berikan informasi kontak untuk siswa</p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="+6281234567890"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telegram">Telegram Username</Label>
                        <Input
                          id="telegram"
                          value={formData.telegram}
                          onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn Profile</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 py-3 text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Mendaftar...</span>
                        </div>
                      ) : (
                        "Daftar sebagai Mentor"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Benefits & Info */}
          <div className="space-y-6">
            {/* Benefits Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Keuntungan Menjadi Mentor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Penghasilan Tambahan</p>
                    <p className="text-blue-100 text-sm">Dapatkan penghasilan dari sesi bimbingan</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Jangkauan Luas</p>
                    <p className="text-blue-100 text-sm">Akses ke ribuan siswa di seluruh Indonesia</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Reputasi & Rating</p>
                    <p className="text-blue-100 text-sm">Bangun reputasi sebagai mentor terpercaya</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Fleksibilitas Waktu</p>
                    <p className="text-blue-100 text-sm">Atur jadwal sesuai ketersediaan Anda</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements Card */}
            <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Persyaratan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">Minimal pendidikan SMA/SMK</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">Memahami materi SKD CPNS</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">Memiliki passion mengajar</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">Komitmen membantu siswa</p>
                </div>
              </CardContent>
            </Card>

            {/* Process Card */}
            <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Proses Pendaftaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    1
                  </div>
                  <p className="text-sm text-gray-700">Isi form pendaftaran</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    2
                  </div>
                  <p className="text-sm text-gray-700">Tim verifikasi profil (1-2 hari)</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    3
                  </div>
                  <p className="text-sm text-gray-700">Profil aktif & siap menerima siswa</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorRegistrationPage;
