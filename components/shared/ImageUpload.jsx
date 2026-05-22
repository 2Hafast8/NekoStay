"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Cat } from "lucide-react";

export function ImageUpload({
  onUpload,
  label = "Upload Foto Kucing",
  defaultValue = null,
}) {
  const [preview, setPreview] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe & ukuran (max 2MB)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Hanya file JPG, PNG, atau WebP yang diperbolehkan");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 2MB");
      return;
    }

    setErrorMsg(null);
    setUploading(true);

    try {
      // Local preview and base64 generation using FileReader
      const reader = new FileReader();
      const fileLoadPromise = new Promise((resolve, reject) => {
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result);
          } else {
            reject(new Error("Gagal membaca file gambar."));
          }
        };
        reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
      });

      reader.readAsDataURL(file);
      const base64DataUrl = await fileLoadPromise;

      setPreview(base64DataUrl);
      onUpload(base64DataUrl);
    } catch (err) {
      console.error("File conversion error:", err);
      setErrorMsg(err.message || "Gagal memproses file gambar.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        {label}
      </label>

      <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-6 bg-muted/30 transition-all duration-300 relative overflow-hidden">
        {preview ? (
          <div className="relative w-full aspect-video max-w-sm rounded-xl overflow-hidden shadow-sm group">
            <Image
              src={preview}
              alt="Preview Kucing"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button
                type="button"
                onClick={removePhoto}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform scale-90 group-hover:scale-100 shadow-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 cursor-pointer py-4 w-full"
          >
            <div className="p-4 bg-secondary rounded-2xl text-primary shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Klik untuk upload foto
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG atau WebP (Maks. 2MB)
              </p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
            <Cat className="w-8 h-8 text-primary animate-bounce" />
            <span className="text-xs font-semibold animate-pulse text-muted-foreground">
              Mengupload foto...
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
