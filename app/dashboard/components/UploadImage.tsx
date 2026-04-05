'use client';
import { useState, useRef } from 'react';

export default function UploadImage({ multiple = true }: { multiple?: boolean }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setPreviews(p => [...p, ...urls]);
  };

  return (
    <div>
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="upload-icon">⬆</div>
        <div className="upload-text-main">Glisser-déposer des images</div>
        <div className="upload-text-sub">ou cliquer pour parcourir</div>
        <div className="upload-hint">PNG, JPG, WebP — max 10 MB</div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={e => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {previews.length > 0 && (
        <div className="upload-previews">
          {previews.map((src, i) => (
            <div key={i} className="upload-preview-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button
                className="upload-preview-remove"
                onClick={() => setPreviews(p => p.filter((_, idx) => idx !== i))}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
