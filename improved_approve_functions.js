// Improved approve and reject mentor functions using Supabase client
// Copy dan paste fungsi ini ke AdminDashboard.tsx untuk menggantikan fungsi yang lama

// Approve mentor
const approveMentor = async (userId: string) => {
  try {
    console.log('✅ Approving mentor:', userId);
    
    // Import supabase client
    const { supabase } = await import('@/lib/db/supabase');
    
    // Find the mentor profile
    const mentorProfile = pendingMentors.find(mentor => mentor.id === userId);
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }
    
    // 1. Update tentor_profile to verified
    const { data: profileData, error: profileError } = await supabase
      .from('tentor_profiles')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', mentorProfile.profile_id)
      .select();
    
    if (profileError) {
      console.error('❌ Error updating tentor profile:', profileError);
      throw profileError;
    }
    
    console.log('✅ Mentor profile verified:', profileData);
    
    // 2. Update user role to tentor
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        role: 'tentor'
      })
      .eq('id', userId)
      .select();
    
    if (userError) {
      console.error('❌ Error updating user role:', userError);
      throw userError;
    }
    
    console.log('✅ User role updated to tentor:', userData);
    
    toast({
      title: "Mentor Disetujui!",
      description: "Mentor berhasil disetujui dan dapat mengakses fitur mentor",
    });
    
    // Reload pending mentors
    loadPendingMentors();
    
  } catch (error) {
    console.error('❌ Error approving mentor:', error);
    toast({
      title: "Error",
      description: "Gagal menyetujui mentor",
      variant: "destructive",
    });
  }
};

// Reject mentor
const rejectMentor = async (userId: string) => {
  try {
    console.log('❌ Rejecting mentor:', userId);
    
    // Import supabase client
    const { supabase } = await import('@/lib/db/supabase');
    
    // Find the mentor profile
    const mentorProfile = pendingMentors.find(mentor => mentor.id === userId);
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }
    
    // 1. Delete tentor_profile
    const { error: deleteError } = await supabase
      .from('tentor_profiles')
      .delete()
      .eq('id', mentorProfile.profile_id);
    
    if (deleteError) {
      console.error('❌ Error deleting tentor profile:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ Tentor profile deleted');
    
    // 2. Update user role back to student
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        role: 'student'
      })
      .eq('id', userId)
      .select();
    
    if (userError) {
      console.error('❌ Error updating user role:', userError);
      throw userError;
    }
    
    console.log('✅ User role updated to student:', userData);
    
    toast({
      title: "Mentor Ditolak",
      description: "Pengajuan mentor berhasil ditolak",
    });
    
    // Reload pending mentors
    loadPendingMentors();
    
  } catch (error) {
    console.error('❌ Error rejecting mentor:', error);
    toast({
      title: "Error",
      description: "Gagal menolak mentor",
      variant: "destructive",
    });
  }
};
