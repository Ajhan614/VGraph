import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../components/Canvas/Canvas';
import './Home.css';
import calculateLayoutFromFile from '../services/api';

const Home = () => {
  const [open, setOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const fileInputRef = useRef(null);
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: []
  });

  const toggleDropdown = () => setOpen(prev => !prev);
  
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('.dropdown')) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('click', close);
    }
    return () => document.removeEventListener('click', close);
  }, [open]);

  const uploadFile = async (file) => {
    if (!file) return;
    
    setUploadStatus('uploading');
    
    try {
      const coordinates = await calculateLayoutFromFile(file);

      const nodes = coordinates.nodes || [];
      const edges = coordinates.edges || [];
      
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));
      const converted = nodes.map(n => ({
        ...n,
        y: maxY - n.y + minY,
      }));
      
      setGraphData({
        nodes: converted,
        edges: edges
      });
      
      setUploadStatus('success');
      
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
      
      return converted;
    } catch (error) {
      setUploadStatus('error');
      console.error('Ошибка загрузки:', error);

      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
      
      throw error;
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      await uploadFile(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const triggerFileInput = () => {
    setOpen(false); 
    fileInputRef.current?.click();
  };

  const exportGraph = () => {
    alert('Экспорт');
    setOpen(false);
  };

  const saveGraph = () => {
    alert('Сохранить');
    setOpen(false);
  };

  const deleteAll = () => {
    setGraphData({ nodes: [], edges: [] });
    setOpen(false);
  };

  return (
    <div className="main-container">
      <div className='control-board'>
        <div className="dropdown">
          <button onClick={toggleDropdown} className="btn">Работа с графом</button>

          <div className={`dropdown-content ${open ? 'show' : ''}`}>
            <a href="#" onClick={triggerFileInput}>Импортировать граф</a>
            <a href="#" onClick={exportGraph}>Экспортировать граф</a>
            <a href="#" onClick={saveGraph}>Сохранить граф</a>
            <a href="#" onClick={deleteAll}>Удалить граф</a>
          </div>
        </div>
        <button className='btn'>Удалить</button>
        <button className='btn'>Настройки холста</button>
        <button className='btn'>Соединить вершины</button>
        <button className='btn'>Алгоритмы</button>
        <button className='btn'>Добавить вершину</button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".dot"
          style={{ display: 'none' }}
        />
        
        {uploadStatus === 'uploading' && (
          <div className="upload-status uploading">
            Загрузка файла...
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="upload-status success">
            Файл успешно загружен!
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="upload-status error">
            Ошибка загрузки файла
          </div>
        )}
      </div>
      <Canvas 
        graphData={graphData} 
        onGraphDataChange={setGraphData}
      />
    </div>
  );
};

export default Home;