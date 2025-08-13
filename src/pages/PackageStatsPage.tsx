import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QuestionPackage } from "@/entities";
import PackageStats from "@/components/PackageStats";
import { UserContext } from "@/App";

const PackageStatsPage = () => {
  const { packageId } = useParams();
  const { user } = useContext(UserContext);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (packageId) {
      loadPackageData();
    }
  }, [packageId]);

  const loadPackageData = async () => {
    try {
      setLoading(true);
      const pkg = await QuestionPackage.get(packageId);
      setPackageData(pkg);
    } catch (error) {
      console.error("Error loading package data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
            <p className="text-center mt-4 text-blue-700 font-medium">Loading Package Stats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center">
            <p className="text-blue-700 font-medium mb-4">Paket tidak ditemukan</p>
            <Link to="/admin">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                Kembali ke Admin Dashboard
              </Button>
            </Link>
          </div>
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
              <Link to="/admin">
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Statistik Paket
                </h1>
                <p className="text-blue-700 font-medium">{packageData.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PackageStats packageId={packageId} packageTitle={packageData.title} />
      </div>
    </div>
  );
};

export default PackageStatsPage;
