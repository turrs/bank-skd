import { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, ArrowLeft, User, Settings, History, BookOpen } from 'lucide-react';
import { getFallbackRoute, shouldRedirect, ROUTES } from '@/lib/routeHelpers';

const SmartNotFound = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if current path should redirect to another route
    const redirectPath = shouldRedirect(location.pathname);
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
      return;
    }

    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      const fallbackRoute = getFallbackRoute(!!user, user?.is_admin);
      navigate(fallbackRoute);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, navigate, location.pathname]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoDashboard = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Halaman Tidak Ditemukan
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Auto-redirect info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700 text-center">
              {user ? (
                <>
                  Redirect ke Dashboard dalam <span className="font-bold">3 detik</span>...
                </>
              ) : (
                <>
                  Redirect ke Landing Page dalam <span className="font-bold">3 detik</span>...
                </>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {user ? (
              <Button 
                onClick={handleGoDashboard}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <User className="w-4 h-4 mr-2" />
                Ke Dashboard
              </Button>
            ) : (
              <Button 
                onClick={handleGoHome}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Ke Landing Page
              </Button>
            )}
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>

          {/* Quick links */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">Quick Links:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs"
              >
                Home
              </Button>
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="text-xs"
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/history')}
                    className="text-xs"
                  >
                    History
                  </Button>
                  {user.is_admin && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="text-xs"
                    >
                      Admin
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="text-xs"
                  >
                    Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/register')}
                    className="text-xs"
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartNotFound;
