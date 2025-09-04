import { supabase } from './supabase';

export const uploadFile = async (fileUri: string, storagePath: string): Promise<string> => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from('lab-results')
      .upload(storagePath, blob);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('lab-results')
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};