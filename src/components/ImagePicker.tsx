"use client";

import { useRef, useState } from "react";

const MAX_FILE_MB = 8;

/* Compresión en el navegador: la foto se reduce a máx. 1600px
   y JPEG 85 antes de subirla. Así evita el límite de 4.5MB de
   Vercel y sube mucho más rápido con datos móviles. */
function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const MAX_SIDE = 1600;
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    img.onerror = () => reject(new Error("decode"));
    img.src = dataUrl;
  });
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ImagePicker({
  defaultImage,
}: {
  defaultImage?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeInfo, setSizeInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setBusy(false);

    if (!file) {
      setPreview(null);
      setFileName(null);
      setSizeInfo(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG o PNG).");
      setPreview(null);
      setFileName(null);
      setSizeInfo(null);
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`La imagen supera ${MAX_FILE_MB} MB. Toma la foto en calidad media.`);
      setPreview(null);
      setFileName(null);
      setSizeInfo(null);
      return;
    }

    const originalKb = Math.round(file.size / 1024);
    setFileName(file.name);
    setBusy(true);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        const base64 = compressed.split(",")[1] ?? "";
        const compressedBytes = Math.floor((base64.length * 3) / 4);

        setPreview(compressed);
        setSizeInfo(
          `Original ${formatSize(originalKb * 1024)} → optimizada ${formatSize(compressedBytes)} ✓ lista para subir`
        );
        setBusy(false);
      } catch {
        setError("No se pudo procesar la imagen. Intenta con otra.");
        setPreview(null);
        setFileName(null);
        setSizeInfo(null);
        setBusy(false);
      }
    };

    reader.onerror = () => {
      setError("No se pudo leer la imagen. Intenta de nuevo.");
      setBusy(false);
    };

    reader.readAsDataURL(file);
  }

  function handleClear() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setFileName(null);
    setSizeInfo(null);
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
        {busy && <span className="admin-image-busy">OPTIMIZANDO…</span>}
      </div>

      <div className="admin-image-actions">
        <label className={`admin-image-btn primary${busy ? " disabled" : ""}`}>
          {preview ? "CAMBIAR FOTO" : "TOMAR / SUBIR FOTO"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={busy}
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

      {sizeInfo && (
        <p className="admin-image-ok">{sizeInfo}</p>
      )}

      {error && <p className="admin-image-error">{error}</p>}

      <p className="admin-image-hint">
        JPG o PNG · máx. {MAX_FILE_MB} MB · se optimiza automáticamente
      </p>
    </div>
  );
}
