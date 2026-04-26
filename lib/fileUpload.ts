import { supabase } from './supabase';

export interface FileUploadResult {
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

/**
 * Upload a file to Supabase Storage
 * @param file File to upload
 * @param projectId Project ID for organizing files
 * @param type 'packing' or 'todo' to determine folder structure
 * @returns Upload result with file metadata
 */
export async function uploadFile(
  file: File,
  projectId: string,
  type: 'packing' | 'todo'
): Promise<FileUploadResult | null> {
  try {
    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${projectId}/${type}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('packing-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('File upload error:', error);
      return null;
    }

    return {
      file_name: file.name,
      file_path: data.path,
      file_type: file.type,
      file_size: file.size,
    };
  } catch (error) {
    console.error('File upload failed:', error);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param filePath Path to the file in storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('packing-files')
      .remove([filePath]);

    if (error) {
      console.error('File delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('File delete failed:', error);
    return false;
  }
}

/**
 * Get public URL for a file (for download/preview)
 * @param filePath Path to the file in storage
 * @returns Public URL or null
 */
export function getFileUrl(filePath: string): string | null {
  try {
    const { data } = supabase.storage
      .from('packing-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Failed to get file URL:', error);
    return null;
  }
}

/**
 * Download a file
 * @param filePath Path to the file in storage
 * @param fileName Original file name
 */
export async function downloadFile(filePath: string, fileName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('packing-files')
      .download(filePath);

    if (error) {
      console.error('File download error:', error);
      alert('파일 다운로드 실패!');
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('File download failed:', error);
    alert('파일 다운로드 실패!');
  }
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on file type
 * @param fileType MIME type
 * @returns Emoji icon
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return '📦';
  return '📎';
}
