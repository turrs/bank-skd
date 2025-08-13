import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Trophy, Users, CheckCircle, Star, ArrowRight, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform, useInView, useAnimation } from "framer-motion";
import { useRef, useEffect } from "react";

const Index = () => {
  const { scrollYProgress } = useScroll();
  const headerRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);
  
  const headerInView = useInView(headerRef, { once: true });
  const heroInView = useInView(heroRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });
  const statsInView = useInView(statsRef, { once: true });
  const ctaInView = useInView(ctaRef, { once: true });

  const headerControls = useAnimation();
  const heroControls = useAnimation();
  const featuresControls = useAnimation();
  const statsControls = useAnimation();
  const ctaControls = useAnimation();

  useEffect(() => {
    if (headerInView) headerControls.start("visible");
    if (heroInView) heroControls.start("visible");
    if (featuresInView) featuresControls.start("visible");
    if (statsInView) statsControls.start("visible");
    if (ctaInView) ctaControls.start("visible");
  }, [headerInView, heroInView, featuresInView, statsInView, ctaInView, headerControls, heroControls, featuresControls, statsControls, ctaControls]);

  const headerY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Modern Header */}
      <motion.header 
        ref={headerRef}
        className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-40"
        style={{ y: headerY }}
        initial={{ y: -100, opacity: 0 }}
        animate={headerControls}
        variants={{
          visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                SKD CPNS Tryout
              </motion.h1>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                    Masuk
                  </Button>
                </motion.div>
              </Link>
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                    Daftar
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Modern Hero Section */}
      <motion.section 
        ref={heroRef}
        className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ scale: heroScale, opacity: heroOpacity }}
        initial={{ opacity: 0, y: 100 }}
        animate={heroControls}
        variants={{
          visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
              duration: 1, 
              ease: "easeOut",
              staggerChildren: 0.2
            } 
          }
        }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200"></div>
        
        {/* Draggable Background Blobs */}
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.2, opacity: 0.3 }}
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.2, opacity: 0.3 }}
          animate={{ 
            x: [0, -30, 0], 
            y: [0, 50, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.2, opacity: 0.3 }}
          animate={{ 
            x: [0, 40, 0], 
            y: [0, -30, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 9, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 4
          }}
        />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-4 py-2 text-sm font-medium" variant="secondary">
              🚀 Platform Tryout  CPNS Terpercaya
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.span 
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              Persiapkan Diri untuk
            </motion.span>
            <motion.span 
              className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent block mt-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              menjadi CPNS
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-blue-800 mb-10 max-w-4xl mx-auto font-medium leading-relaxed"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Platform tryout online terlengkap dengan soal-soal berkualitas, 
            sistem penilaian akurat, dan analisis mendalam untuk membantu Anda 
            <motion.span 
              className="font-bold text-blue-900"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              {" "}lolos seleksi CPNS
            </motion.span>.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link to="/register">
              <motion.div
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)" 
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 text-lg px-8 py-6">
                  🚀 Mulai Tryout Gratis
                </Button>
              </motion.div>
            </Link>
            
          </motion.div>
        </div>
      </motion.section>

      {/* Modern Features Section */}
      <motion.section 
        ref={featuresRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-sm"
        initial={{ opacity: 0, y: 100 }}
        animate={featuresControls}
        variants={{
          visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
              duration: 1, 
              ease: "easeOut",
              staggerChildren: 0.1
            } 
          }
        }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-4 py-2 text-sm font-medium">
                ✨ Fitur Unggulan
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Mengapa Memilih Platform Kami?
            </motion.h2>
            <motion.p 
              className="text-xl text-blue-700 max-w-3xl mx-auto font-medium"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Fitur-fitur unggulan yang dirancang khusus untuk membantu Anda 
              <span className="font-bold text-blue-900"> sukses dalam seleksi SKD CPNS</span>
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              variants={{
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6 }
                }
              }}
              initial={{ opacity: 0, y: 50 }}
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center pb-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <Clock className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-blue-900 text-xl">Timer Realistis</CardTitle>
                    <CardDescription className="text-blue-700">
                      Simulasi waktu pengerjaan yang sama dengan tes sesungguhnya (110 menit)
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6 }
                }
              }}
              initial={{ opacity: 0, y: 50 }}
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center pb-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, -2, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 1
                      }}
                    >
                      <Trophy className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-blue-900 text-xl">Analisis Mendalam</CardTitle>
                    <CardDescription className="text-blue-700">
                      Dapatkan analisis detail hasil tryout dengan statistik lengkap
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6 }
                }
              }}
              initial={{ opacity: 0, y: 50 }}
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center pb-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 3, 0]
                      }}
                      transition={{ 
                        duration: 3.5, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 2
                      }}
                    >
                      <BookOpen className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-blue-900 text-xl">Bank Soal Lengkap</CardTitle>
                    <CardDescription className="text-blue-700">
                      Ribuan soal berkualitas yang disusun sesuai kisi-kisi SKD terbaru
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6 }
                }
              }}
              initial={{ opacity: 0, y: 50 }}
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center pb-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 5, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    >
                      <Users className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-blue-900 text-xl">Pembahasan Detail</CardTitle>
                    <CardDescription className="text-blue-700">
                      Setiap soal dilengkapi dengan pembahasan yang mudah dipahami
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6 }
                }
              }}
              initial={{ opacity: 0, y: 50 }}
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center pb-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, -1, 0]
                      }}
                      transition={{ 
                        duration: 4.5, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 1.5
                      }}
                    >
                      <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-blue-900 text-xl">Riwayat Lengkap</CardTitle>
                    <CardDescription className="text-blue-700">
                      Pantau progress belajar dengan riwayat tryout yang tersimpan
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6 }
                }
              }}
              initial={{ opacity: 0, y: 50 }}
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center pb-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, 0]
                      }}
                      transition={{ 
                        duration: 6, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 2.5
                      }}
                    >
                      <Star className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-blue-900 text-xl">Interface Mudah</CardTitle>
                    <CardDescription className="text-blue-700">
                      Antarmuka yang user-friendly dan mudah digunakan untuk semua kalangan
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Modern Stats Section */}
      <motion.section 
        ref={statsRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-100"
        initial={{ opacity: 0, y: 100 }}
        animate={statsControls}
        variants={{
          visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
              duration: 1, 
              ease: "easeOut",
              staggerChildren: 0.2
            } 
          }
        }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-4 py-2 text-sm font-medium">
                📊 Statistik Platform
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Platform yang Terpercaya
            </motion.h2>
            <motion.p 
              className="text-lg text-blue-700 font-medium"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Bukti nyata keberhasilan ribuan peserta CPNS
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">10,000+</div>
              <div className="text-blue-700 font-medium text-lg">Soal Berkualitas</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">5,000+</div>
              <div className="text-blue-700 font-medium text-lg">Pengguna Aktif</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">85%</div>
              <div className="text-blue-700 font-medium text-lg">Tingkat Kelulusan</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Modern CTA Section */}
      <motion.section 
        ref={ctaRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden"
        initial={{ opacity: 0, y: 100 }}
        animate={ctaControls}
        variants={{
          visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
              duration: 1, 
              ease: "easeOut"
            } 
          }
        }}
      >
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-white/20 text-white border border-white/30 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            🎯 Mulai Sekarang
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Siap Memulai Persiapan SKD CPNS?
          </h2>
          <p className="text-blue-100 mb-10 text-xl font-medium leading-relaxed">
            Bergabunglah dengan ribuan peserta lainnya dan tingkatkan peluang 
            <span className="font-bold text-white"> kelulusan Anda</span> dengan tryout berkualitas tinggi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-white/25 transition-all duration-300 text-lg px-8 py-6 font-bold">
                🚀 Daftar Sekarang - Gratis!
              </Button>
            </Link>
           
          </div>
        </div>
      </motion.section>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-900/50 via-indigo-900/50 to-purple-900/50"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-500/10 rounded-full"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  SKD CPNS Tryout
                </h3>
              </div>
              <p className="text-blue-200 mb-6 text-lg leading-relaxed">
                Platform tryout online terpercaya untuk persiapan SKD CPNS. 
                Dilengkapi dengan soal berkualitas dan analisis mendalam untuk 
                <span className="font-bold text-white"> kesuksesan karir Anda</span>.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center hover:bg-blue-500/30 transition-colors cursor-pointer">
                  <span className="text-blue-300">📧</span>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center hover:bg-blue-500/30 transition-colors cursor-pointer">
                  <span className="text-blue-300">📱</span>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center hover:bg-blue-500/30 transition-colors cursor-pointer">
                  <span className="text-blue-300">💬</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg text-white">✨ Fitur</h4>
              <ul className="space-y-3 text-blue-200">
                <li className="hover:text-white transition-colors cursor-pointer">🚀 Tryout Online</li>
                <li className="hover:text-white transition-colors cursor-pointer">📚 Bank Soal</li>
                <li className="hover:text-white transition-colors cursor-pointer">📊 Analisis Hasil</li>
                <li className="hover:text-white transition-colors cursor-pointer">📈 Riwayat Tryout</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg text-white">🛠️ Dukungan</h4>
              <ul className="space-y-3 text-blue-200">
                <li className="hover:text-white transition-colors cursor-pointer">📖 Panduan Penggunaan</li>
                <li className="hover:text-white transition-colors cursor-pointer">❓ FAQ</li>
                <li className="hover:text-white transition-colors cursor-pointer">📞 Kontak Support</li>
                <li className="hover:text-white transition-colors cursor-pointer">🔒 Kebijakan Privasi</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-700/50 pt-8 text-center">
            <p className="text-blue-300 font-medium">
              &copy; 2024 BANK CPNS. Semua hak dilindungi. 
              <span className="text-white font-bold"> Dibuat dengan ❤️ untuk Indonesia</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;