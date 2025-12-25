import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/services/storageService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    bucket: 'tenant-images' | 'product-images' | 'avatars';
    className?: string;
    aspectRatio?: 'square' | 'video' | 'wide';
}

export function ImageUpload({
    value,
    onChange,
    bucket,
    className,
    aspectRatio = 'video'
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const inputRef = useRef<HTMLInputElement>(null);

    const aspectClasses = {
        square: 'aspect-square',
        video: 'aspect-video',
        wide: 'aspect-[21/9]',
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 5MB');
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        setUploading(true);
        try {
            const url = await uploadImage(file, bucket);
            onChange(url);
            toast.success('Gambar berhasil diupload');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Gagal mengupload gambar');
            setPreview(value || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className={cn('relative', className)}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />

            {preview ? (
                <div className={cn('relative rounded-xl overflow-hidden', aspectClasses[aspectRatio])}>
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ganti'}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemove}
                            disabled={uploading}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                        'w-full rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary',
                        aspectClasses[aspectRatio],
                        uploading && 'pointer-events-none opacity-50'
                    )}
                >
                    {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8" />
                            <span className="text-sm">Klik untuk upload gambar</span>
                            <span className="text-xs">PNG, JPG, WEBP (max 5MB)</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
