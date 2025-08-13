import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Question } from "@/entities";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/db/supabase";

const QuestionForm = ({ questionData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    question_text: questionData?.question_text || '',
    option_a: questionData?.option_a || '',
    option_b: questionData?.option_b || '',
    option_c: questionData?.option_c || '',
    option_d: questionData?.option_d || '',
    option_e: questionData?.option_e || '',
    points_a: questionData?.points_a || 0,
    points_b: questionData?.points_b || 0,
    points_c: questionData?.points_c || 0,
    points_d: questionData?.points_d || 0,
    points_e: questionData?.points_e || 0,
    correct_answer: questionData?.correct_answer || '',
    explanation: questionData?.explanation || '',
    main_category: questionData?.main_category || '',
    sub_category: questionData?.sub_category || ''
  });

  const [imageFiles, setImageFiles] = useState({
    question: null,
    optionA: null,
    optionB: null,
    optionC: null,
    optionD: null,
    optionE: null,
    explanation: null
  });

  const [imageUrls, setImageUrls] = useState({
    question: questionData?.question_image_url || '',
    optionA: questionData?.option_a_image_url || '',
    optionB: questionData?.option_b_image_url || '',
    optionC: questionData?.option_c_image_url || '',
    optionD: questionData?.option_d_image_url || '',
    optionE: questionData?.option_e_image_url || '',
    explanation: questionData?.explanation_image_url || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form function
  const resetForm = () => {
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      points_a: 0,
      points_b: 0,
      points_c: 0,
      points_d: 0,
      points_e: 0,
      correct_answer: '',
      explanation: '',
      main_category: '',
      sub_category: ''
    });
    
    setImageFiles({
      question: null,
      optionA: null,
      optionB: null,
      optionC: null,
      optionD: null,
      optionE: null,
      explanation: null
    });
    
    setImageUrls({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionE: '',
      explanation: ''
    });
  };

  const uploadImages = async () => {
    const uploadedImages = {};
    
    for (const [key, file] of Object.entries(imageFiles)) {
      if (file) {
        try {
          const fileName = `${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage
            .from('question-images')
            .upload(fileName, file);
          
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from('question-images')
            .getPublicUrl(fileName);
          
          uploadedImages[`${key === 'question' ? 'question' : key === 'explanation' ? 'explanation' : `option_${key.slice(-1).toLowerCase()}`}_image_url`] = publicUrl;
          uploadedImages[`${key === 'question' ? 'question' : key === 'explanation' ? 'explanation' : `option_${key.slice(-1).toLowerCase()}`}_image_path`] = fileName;
        } catch (error) {
          console.error(`Error uploading ${key} image:`, error);
        }
      }
    }
    
    return uploadedImages;
  };

  const removeImage = (key) => {
    setImageFiles({ ...imageFiles, [key]: null });
    setImageUrls({ ...imageUrls, [key]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const uploadedImages = await uploadImages();
      const questionDataToSave = {
        ...formData,
        ...uploadedImages
      };
      
      console.log('Submitting question data:', questionDataToSave); // Debug
      
      await onSubmit(questionDataToSave);
      
      // Reset form setelah berhasil submit
      resetForm();
      
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pertanyaan */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="question_text">Pertanyaan</Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData({...formData, question_text: e.target.value})}
              placeholder="Masukkan pertanyaan..."
              className="min-h-[100px]"
              required
            />
          </div>
          
          {/* Upload Gambar Pertanyaan */}
          <div>
            <Label>Gambar Pertanyaan (Opsional)</Label>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFiles({...imageFiles, question: e.target.files[0]})}
                className="flex-1"
              />
              {imageUrls.question && (
                <div className="relative">
                  <img src={imageUrls.question} alt="Question" className="w-20 h-20 object-cover rounded" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage('question')}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pilihan Jawaban dengan Point */}
        {['a', 'b', 'c', 'd', 'e'].map((option) => (
          <div key={option} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`option_${option}`}>Pilihan {option.toUpperCase()}</Label>
                <Textarea
                  id={`option_${option}`}
                  value={formData[`option_${option}`]}
                  onChange={(e) => setFormData({...formData, [`option_${option}`]: e.target.value})}
                  placeholder={`Masukkan pilihan ${option.toUpperCase()}...`}
                  className="min-h-[80px]"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor={`points_${option}`}>Point Pilihan {option.toUpperCase()}</Label>
                <Input
                  id={`points_${option}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData[`points_${option}`]}
                  onChange={(e) => setFormData({...formData, [`points_${option}`]: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">Point yang didapat jika memilih jawaban ini</p>
              </div>
            </div>
            
            {/* Upload Gambar Pilihan */}
            <div>
              <Label>Gambar Pilihan {option.toUpperCase()} (Opsional)</Label>
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({...imageFiles, [`option${option.toUpperCase()}`]: e.target.files[0]})}
                  className="flex-1"
                />
                {imageUrls[`option${option.toUpperCase()}`] && (
                  <div className="relative">
                    <img src={imageUrls[`option${option.toUpperCase()}`]} alt={`Option ${option.toUpperCase()}`} className="w-20 h-20 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(`option${option.toUpperCase()}`)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Jawaban Benar */}
        <div>
          <Label htmlFor="correct_answer">Jawaban Benar</Label>
          <Select value={formData.correct_answer} onValueChange={(value) => setFormData({...formData, correct_answer: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jawaban benar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
              <SelectItem value="E">E</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Penjelasan */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="explanation">Penjelasan Jawaban</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({...formData, explanation: e.target.value})}
              placeholder="Masukkan penjelasan jawaban..."
              className="min-h-[100px]"
              required
            />
          </div>
          
          {/* Upload Gambar Penjelasan */}
          <div>
            <Label>Gambar Penjelasan (Opsional)</Label>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFiles({...imageFiles, explanation: e.target.files[0]})}
                className="flex-1"
              />
              {imageUrls.explanation && (
                <div className="relative">
                  <img src={imageUrls.explanation} alt="Explanation" className="w-20 h-20 object-cover rounded" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage('explanation')}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kategori dan Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="main_category">Kategori Utama</Label>
            <Select value={formData.main_category} onValueChange={(value) => setFormData({...formData, main_category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori utama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TWK">TWK</SelectItem>
                <SelectItem value="TIU">TIU</SelectItem>
                <SelectItem value="TKP">TKP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sub_category">Sub Kategori</Label>
            <Input
              id="sub_category"
              value={formData.sub_category}
              onChange={(e) => setFormData({...formData, sub_category: e.target.value})}
              placeholder="Masukkan sub kategori..."
            />
          </div>
        </div>

        {/* Tombol Submit */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : (questionData ? 'Update Soal' : 'Simpan Soal')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;