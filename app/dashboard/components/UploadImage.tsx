'use client';
import { useState, useRef } from 'react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
console.log('Cloudinary config:', { CLOUD_NAME, UPLOAD_PRESET });

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'artisana/products');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Cloudinary error response:', errorData); // 👈 see the real error
    throw new Error(errorData?.error?.message ?? 'Cloudinary upload failed');
  }

  const data = await res.json();
  return data.secure_url as string;
}
export default function UploadImage({
  multiple = true,
  onUploadStart,
  onUpload,
  onError,
}: {
  multiple?: boolean;
  onUploadStart?: () => void;
  onUpload?: (urls: string[]) => void;
  onError?: (msg: string) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Show local previews immediately for UX
    const blobPreviews = fileArray.map(f => URL.createObjectURL(f));
    setPreviews(p => [...p, ...blobPreviews]);

    // Notify parent that upload is starting
    onUploadStart?.();
    setUploading(true);

    try {
      // Upload all files to Cloudinary in parallel
      const cloudinaryUrls = await Promise.all(fileArray.map(f => uploadToCloudinary(f)));

      // Replace blob previews with real Cloudinary URLs
      setPreviews(p => {
        const withoutBlobs = p.filter(url => !blobPreviews.includes(url));
        return [...withoutBlobs, ...cloudinaryUrls];
      });

      // Send real URLs to parent
      onUpload?.(cloudinaryUrls);
    } catch (err: any) {
      // Remove the failed blob previews
      setPreviews(p => p.filter(url => !blobPreviews.includes(url)));
      onError?.(err.message ?? 'Upload failed');
      console.error('Cloudinary upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        style={{ opacity: uploading ? 0.6 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
      >
        <div className="upload-icon">{uploading ? '⏳' : '⬆'}</div>
        <div className="upload-text-main">
          {uploading ? 'Upload en cours…' : 'Glisser-déposer des images'}
        </div>
        <div className="upload-text-sub">
          {uploading ? 'Veuillez patienter' : 'ou cliquer pour parcourir'}
        </div>
        <div className="upload-hint">PNG, JPG, WebP — max 10 MB</div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={e => handleFiles(e.target.files)}
          style={{ display: 'none' }}
          disabled={uploading}
        />
      </div>

      {previews.length > 0 && (
        <div className="upload-previews">
          {previews.map((src, i) => (
            <div key={i} className="upload-preview-item">
              <img src={src} alt="" />
              <button
                className="upload-preview-remove"
                onClick={() => setPreviews(p => p.filter((_, idx) => idx !== i))}
                disabled={uploading}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}