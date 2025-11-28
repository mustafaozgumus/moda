import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  preview: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  id: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  preview,
  onUpload,
  onClear,
  id
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <span className="text-sm font-medium text-gray-700 tracking-wide uppercase">{label}</span>
      
      {preview ? (
        <div className="relative group w-full aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
          <img 
            src={preview} 
            alt={label} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-800 hover:bg-white hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-full aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-fashion-accent transition-all cursor-pointer group"
        >
          <div className="p-4 rounded-full bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform">
            <Upload className="text-fashion-accent" size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Fotoğraf Yükle</p>
          <p className="text-xs text-gray-400 mt-1 text-center px-4">Tıkla veya sürükle bırak</p>
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};