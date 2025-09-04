import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '../services/firebase';

// Initialize Firebase Storage
const storage = getStorage(app);
/**
 * Uploads a file from a URI to Firebase Storage and returns the download URL.
 * @param fileUri The local URI of the file to upload.
 * @param storagePath The path in Firebase Storage where the file will be saved.
 * @returns A Promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = async (fileUri: string, storagePath: string): Promise<string> => {
    try {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        
        const storageRef = ref(storage, storagePath);
        
        // 'uploadBytes' uploads the blob to the specified storage path
        await uploadBytes(storageRef, blob);
        
        // Get the download URL
        const downloadUrl = await getDownloadURL(storageRef);
        
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};
