"use client";

import { useRef, useState } from "react";

const MAX_FILE_MB = 8;

export default function ImagePicker({
  defaultImage,
}: {
  defaultImage?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG o PNG).");
      setPreview(null);
      setFileName(null);
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`La imagen supera ${MAX_FILE_MB} MB. Toma la foto en calidad media.`);
      setPreview(null);
      setFileName(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result as string);
      setFileName(file.name);
    };

    reader.onerror = () => {
      setError("No se pudo leer la imagen. Intenta de nuevo.");
    };

    reader.readAsDataURL(file);
  }

  function handleClear() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setFileName(null);
    setError(null);
  }

  return (
    <div className="admin-image-picker">
      <input
        type="hidden"
        name="image_file_data"
        value={preview ?? ""}
      />

      <div className="admin-image-preview">
        {preview ? (
          <img src={preview} alt="Vista previa" />
        ) : (
          <img src={defaultImage || "/img/portfolio-1.jpg"} alt="Imagen actual" />
        )}
      </div>

      <div className="admin-image-actions">
        <label className="admin-image-btn primary">
          {preview ? "CAMBIAR FOTO" : "TOMAR / SUBIR FOTO"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
          />
        </label>

        {preview && (
          <button
            type="button"
            className="admin-image-btn"
            onClick={handleClear}
          >
            QUITAR FOTO
          </button>
        )}
      </div>

      {fileName && (
        <p className="admin-image-name">{fileName}</p>
      )}

      {error && <p className="admin-image-error">{error}</p>}

      <p className="admin-image-hint">
        JPG o PNG · máx. {MAX_FILE_MB} MB · se optimiza automáticamente
      </p>
    </div>
  );
}
