import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, createContext, Dispatch, SetStateAction } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TryoutPage from "./pages/TryoutPage";
import PaymentPage from "./pages/PaymentPage";
import HistoryPage from "./pages/HistoryPage";
import TryoutReviewPage from "./pages/TryoutReviewPage";
import NotFound from "./pages/NotFound";
import { supabase } from "@/lib/db/supabase";
import AdminQuestions from "./pages/AdminQuestions";
import PackageStatsPage from "./pages/PackageStatsPage";
import ProtectedRoute from "./components/ProtectedRoute";




export const UserContext = createContext<{
  user: any;
  setUser: Dispatch<SetStateAction<any>>;
}>({
  user: null,
  setUser: () => {},
});

// Simple Route Wrapper - No Transition Issues
const RouteWrapper = ({ children, user, loading }: { children: React.ReactNode; user: any; loading: boolean }) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Jika Supabase tidak terkonfigurasi, lewati auth (tetap bisa pakai mode lokal)
      if (!supabase) {
        setUser(null);
        return;
      }
      // Ambil user dari Supabase Auth
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (authUser) {
        // Ambil data lengkap user dari tabel users
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (

      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UserContext.Provider value={{ user, setUser }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={
                user ? (
                  <RouteWrapper user={user} loading={loading}>
                    <Dashboard />
                  </RouteWrapper>
                ) : <Navigate to="/login" />
              } />
              <Route path="/tryout/:packageId" element={
                user ? (
                  <RouteWrapper user={user} loading={loading}>
                    <TryoutPage />
                  </RouteWrapper>
                ) : <Navigate to="/login" />
              } />
              <Route path="/payment/:packageId" element={
                user ? (
                  <RouteWrapper user={user} loading={loading}>
                    <PaymentPage />
                  </RouteWrapper>
                ) : <Navigate to="/login" />
              } />
              <Route path="/history" element={
                user ? (
                  <RouteWrapper user={user} loading={loading}>
                    <HistoryPage />
                  </RouteWrapper>
                ) : <Navigate to="/login" />
              } />
              <Route path="/review/:sessionId" element={
                user ? (
                  <RouteWrapper user={user} loading={loading}>
                    <TryoutReviewPage />
                  </RouteWrapper>
                ) : <Navigate to="/login" />
              } />
              <Route 
                path="/admin" 
                element={
                  user ? (
                    <RouteWrapper user={user} loading={loading}>
                      <ProtectedRoute requireAdmin>
                        <AdminDashboard />
                      </ProtectedRoute>
                    </RouteWrapper>
                  ) : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/admin/questions/:packageId" 
                element={
                  user ? (
                    <RouteWrapper user={user} loading={loading}>
                      <ProtectedRoute requireAdmin>
                        <AdminQuestions />
                      </ProtectedRoute>
                    </RouteWrapper>
                  ) : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/admin/package-stats/:packageId" 
                element={
                  user ? (
                    <RouteWrapper user={user} loading={loading}>
                      <ProtectedRoute requireAdmin>
                        <PackageStatsPage />
                      </ProtectedRoute>
                    </RouteWrapper>
                  ) : <Navigate to="/login" />
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserContext.Provider>
      </TooltipProvider>
  );
};

export default App;