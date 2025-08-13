import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageCircle, Settings } from 'lucide-react';
import { chatService } from '@/lib/services/chatService';
import { toast } from '@/hooks/use-toast';

interface ChatSettingsProps {
  onSettingChange?: () => void;
}

const ChatSettings = ({ onSettingChange }: ChatSettingsProps) => {
  const [currentDuration, setCurrentDuration] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Duration options in minutes
  const durationOptions = [
    { value: 10, label: '10 menit', description: 'Chat 10 menit terakhir' },
    { value: 30, label: '30 menit', description: 'Chat 30 menit terakhir' },
    { value: 60, label: '1 jam', description: 'Chat 1 jam terakhir' },
    { value: 1440, label: '1 hari', description: 'Chat 1 hari terakhir' },
    { value: 4320, label: '3 hari', description: 'Chat 3 hari terakhir' },
    { value: 10080, label: '1 minggu', description: 'Chat 1 minggu terakhir' },
    { value: 43200, label: '1 bulan', description: 'Chat 1 bulan terakhir' }
  ];

  // Load current setting
  useEffect(() => {
    loadCurrentSetting();
  }, []);

  const loadCurrentSetting = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading chat duration setting...');
      
      const { data: duration, error } = await chatService.getChatDurationSetting();
      console.log('📊 Chat duration setting response:', { duration, error });
      
      if (error) throw error;
      
      console.log('✅ Chat duration setting loaded:', duration);
      setCurrentDuration(duration);
    } catch (error) {
      console.error('❌ Error loading chat duration setting:', error);
      toast({
        title: "Error",
        description: "Gagal memuat pengaturan chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDurationChange = async (newDuration: string) => {
    const duration = parseInt(newDuration);
    if (duration === currentDuration) return;

    try {
      setIsUpdating(true);
      
      // Save to database
      console.log('💾 Saving chat duration setting:', duration);
      const { success, error } = await chatService.updateChatDurationSetting(duration);
      console.log('📊 Save response:', { success, error });
      
      if (!success) throw error;
      
      // Update local state
      setCurrentDuration(duration);
      
      toast({
        title: "Berhasil",
        description: `Durasi chat berhasil diubah ke ${durationOptions.find(opt => opt.value === duration)?.label}`,
      });

      // Notify parent component
      if (onSettingChange) {
        onSettingChange();
      }
    } catch (error) {
      console.error('Error updating chat duration setting:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah pengaturan chat",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentDurationLabel = () => {
    const option = durationOptions.find(opt => opt.value === currentDuration);
    return option ? option.label : 'Unknown';
  };

  const getCurrentDurationDescription = () => {
    const option = durationOptions.find(opt => opt.value === currentDuration);
    return option ? option.description : '';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6" />
          <div>
            <CardTitle className="text-white">Pengaturan Chat</CardTitle>
            <CardDescription className="text-blue-100">
              Konfigurasi durasi chat yang akan di-load
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Current Setting Display */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Pengaturan Saat Ini</h3>
              <p className="text-sm text-blue-700 mt-1">
                {getCurrentDurationDescription()}
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              <Clock className="w-4 h-4 mr-2" />
              {getCurrentDurationLabel()}
            </Badge>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Durasi Chat
            </label>
            <Select
              value={currentDuration.toString()}
              onValueChange={handleDurationChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih durasi chat" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-gray-500">
            <p>• Durasi yang lebih lama akan memuat lebih banyak pesan chat</p>
            <p>• Performa chat mungkin lebih lambat dengan durasi yang lebih lama</p>
            <p>• Perubahan akan berlaku untuk semua user yang membuka chat</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={loadCurrentSetting}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            {isUpdating ? 'Mengupdate...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSettings;
