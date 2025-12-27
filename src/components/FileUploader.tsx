import axios from "axios";
import React, { useState, ChangeEvent, useRef, useEffect } from "react";

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

const FileUploader = ({ onClose }: { onClose: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoOpened = useRef(false);  // Prevent double open in dev mode

  useEffect(() => {
    if (inputRef.current && !hasAutoOpened.current) {
      inputRef.current.click();
      hasAutoOpened.current = !hasAutoOpened.current;
    }
  }, [inputRef.current]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>){
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus("uploading");
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        await axios.post("https://httpbin.org/post", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setStatus("success");
      } catch (error) {
        setStatus("error");
        console.error('Upload error:', error);
      } finally {
        if (inputRef.current) {
          inputRef.current.value = '';  // Reset input to allow re-selecting same file
        }
      }
    }
  }

  const handleChangeFile = () => {
    if (inputRef.current) {
      inputRef.current.value = '';  // Clear value before click
      inputRef.current.click();  // Trigger file dialog again
    }
  };

  return (
    <div>
      <input 
        type="file"
        ref={inputRef} 
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".dot"
      />
      {status === "uploading" && <p>Загрузка...</p>}
      {status === "success" && <p>Успех! <button onClick={handleChangeFile}>Изменить файл</button></p>}
      {status === "error" && <p>Ошибка. <button onClick={handleChangeFile}>Попробовать снова</button></p>}
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default FileUploader;