import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Shield, 
  CheckCircle, 
  Star, 
  Clock, 
  Zap, 
  Award,
  Play,
  BarChart3,
  FileText,
  MessageCircle,
  Smartphone,
  Globe,
  Lock
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Tryout Berkualitas",
      description: "Soal-soal yang disusun oleh tim ahli dengan standar nasional"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Analisis Mendalam",
      description: "Laporan detail performa dan rekomendasi perbaikan"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Komunitas Belajar",
      description: "Bergabung dengan ribuan peserta lainnya"
    }
  ];

  const stats = [
    { number: "50K+", label: "Peserta Aktif", icon: <Users className="w-6 h-6" /> },
    { number: "100+", label: "Paket Soal", icon: <BookOpen className="w-6 h-6" /> },
    { number: "95%", label: "Tingkat Kepuasan", icon: <Star className="w-6 h-6" /> },
    { number: "24/7", label: "Dukungan", icon: <MessageCircle className="w-6 h-6" /> }
  ];

  const packages = [
    {
      title: "Paket Dasar",
      description: "Untuk pemula yang ingin memulai persiapan",
      price: "Gratis",
      features: ["50 Soal", "Durasi 60 menit", "Analisis dasar", "Sertifikat"],
      popular: false,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Paket Premium",
      description: "Solusi lengkap untuk persiapan optimal",
      price: "Rp 99.000",
      features: ["100 Soal", "Durasi 120 menit", "Analisis mendalam", "Sertifikat", "Konsultasi"],
      popular: true,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Paket Pro",
      description: "Untuk yang serius ingin sukses",
      price: "Rp 199.000",
      features: ["150 Soal", "Durasi 180 menit", "Analisis lengkap", "Sertifikat", "Konsultasi", "Mock Test"],
      popular: false,
      color: "from-blue-600 to-indigo-700"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  TryoutPro
                </h1>
                <p className="text-xs text-blue-600 font-medium">Platform Tryout Terdepan</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all duration-200"
              >
                Tentang Kami
              </Button>
              <Button 
                variant="ghost" 
                className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all duration-200"
              >
                Kontak
              </Button>
              <Link to="/login">
                <Button 
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 px-6 py-2 rounded-xl transition-all duration-200"
                >
                  Masuk
                </Button>
              </Link>
              <Link to="/register">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Daftar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Siapkan Diri
                  </span>
                  <br />
                  <span className="text-gray-800">
                    Untuk Masa Depan
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Platform tryout online terdepan dengan soal berkualitas tinggi, 
                  analisis mendalam, dan sistem pembelajaran yang adaptif untuk 
                  membantu Anda meraih kesuksesan.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <span>Mulai Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-xl font-medium text-lg transition-all duration-200"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <div className="text-blue-600">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Paket Premium</h3>
                          <p className="text-blue-100 opacity-90">Solusi lengkap untuk persiapan optimal</p>
                        </div>
                      </div>
                      <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>POPULAR</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Clock className="w-8 h-8" />
                        </div>
                        <p className="text-blue-100 text-sm">Durasi</p>
                        <p className="text-2xl font-bold">120m</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-8 h-8" />
                        </div>
                        <p className="text-blue-100 text-sm">Total Soal</p>
                        <p className="text-2xl font-bold">100</p>
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
                    <div className="text-center space-y-6">
                      <div className="text-3xl font-bold text-gray-800">Rp 99.000</div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Pilih Paket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold text-gray-800">
              Mengapa Memilih <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TryoutPro</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kami menyediakan solusi lengkap untuk persiapan tryout dengan teknologi terkini 
              dan pendekatan yang terbukti efektif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  index === currentFeature ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold text-gray-800">
              Pilih <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Paket</span> Yang Tepat
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai pilihan paket yang disesuaikan dengan kebutuhan dan budget Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <Card 
                key={index}
                className={`bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  pkg.popular ? 'ring-2 ring-indigo-500 scale-105' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-2 text-sm font-bold">
                    ⭐ PALING POPULAR
                  </div>
                )}
                
                <CardHeader className="text-center p-8">
                  <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                    {pkg.title}
                  </CardTitle>
                  <p className="text-gray-600">{pkg.description}</p>
                  <div className="text-4xl font-bold text-blue-600 mt-4">
                    {pkg.price}
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 pt-0">
                  <div className="space-y-4 mb-8">
                    {pkg.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 ${
                      pkg.popular 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    }`}
                  >
                    {pkg.price === "Gratis" ? "Mulai Sekarang" : "Pilih Paket"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-16 text-center text-white">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold">Siap Untuk Memulai?</h2>
                  <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                    Bergabunglah dengan ribuan peserta lainnya dan mulai perjalanan 
                    menuju kesuksesan bersama TryoutPro.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/register')}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Daftar Sekarang
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-medium text-lg transition-all duration-200"
                  >
                    Hubungi Kami
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">TryoutPro</h3>
                  <p className="text-sm text-gray-400">Platform Tryout Terdepan</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Solusi lengkap untuk persiapan tryout dengan teknologi terkini 
                dan pendekatan yang terbukti efektif.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Produk</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Paket Soal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analisis</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sertifikat</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Konsultasi</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Perusahaan</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Berita</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Dukungan</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Bantuan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © 2024 TryoutPro. Semua hak dilindungi.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Smartphone className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
