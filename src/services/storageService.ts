import { supabase } from '@/lib/supabase';

/**
 * Upload file to Supabase Storage
 */
export async function uploadImage(
    file: File,
    bucket: 'tenant-images' | 'product-images' | 'avatars',
    folder?: string
): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder ? folder + '/' : ''}${user.id}-${Date.now()}.${fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteImage(
    url: string,
    bucket: 'tenant-images' | 'product-images' | 'avatars'
): Promise<void> {
    // Extract file path from URL
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

    if (error) {
        console.error('Error deleting image:', error);
    }
}
