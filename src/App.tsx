import { useCallback, useEffect, useRef, useState } from 'react';
import { editor } from '@wix/editor-sdk';   // ✅ Import the Wix Editor SDK
import './App.css';

type AllowedMime = 'image/svg+xml' | 'image/webp';
const ALLOWED_TYPES: AllowedMime[] = ['image/svg+xml', 'image/webp'];

function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setImageDataUrl(null);
    setFileName(null);
    setFileType(null);
    setError(null);
  }, []);

  const readFileAsDataUrl = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type as AllowedMime)) {
      setError('Please upload an SVG or WebP file.');
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setFileName(file.name);
      setFileType(file.type);
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) readFileAsDataUrl(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const insertToWixEditor = () => {
    if (!imageDataUrl || !fileName || !fileType) {
      setError('No image selected.');
      return;
    }

    // ✅ Directly insert the image into the Wix Editor canvas
    editor.addComponent({
      type: 'Image',
      data: {
        src: imageDataUrl,
        name: fileName,
      },
      style: {
        width: 200,
        height: 200,
      }
    });
  };

  useEffect(() => {
    // Optional: listen for messages back from the Wix Editor host
    const handler = (event: MessageEvent) => {
      console.log('Message from host:', event.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="container">
      <h1>SVG/WebP Uploader</h1>

      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFilePicker}
        role="button"
        aria-label="Upload area"
      >
        <p>Drag & drop your SVG/WebP here or click to browse</p>
        <button className="browse" type="button" onClick={openFilePicker}>
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,.webp,image/svg+xml,image/webp"
          onChange={handleFileChange}
          className="hidden-input"
        />
      </div>

      {error && <div className="error">{error}</div>}

      {imageDataUrl && (
        <div className="preview">
          <div className="meta">
            <div className="meta-row">
              <span className="label">File name:</span>
              <span className="value">{fileName}</span>
            </div>
            <div className="meta-row">
              <span className="label">Type:</span>
              <span className="value">{fileType}</span>
            </div>
          </div>

          <div className="image-frame">
            {fileType === 'image/svg+xml' ? (
              <object data={imageDataUrl} type="image/svg+xml" aria-label="SVG preview" />
            ) : (
              <img src={imageDataUrl} alt="Preview" />
            )}
          </div>

          <div className="actions">
            <button className="secondary" onClick={reset}>Clear</button>
            <button className="primary" onClick={insertToWixEditor}>Insert to Wix</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
