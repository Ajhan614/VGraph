import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../components/Canvas/Canvas';
import './Home.css';
import calculateLayoutFromFile from '../services/api';

const Home = () => {
  const canvasRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const fileInputRef = useRef(null);
  const [calcErrors, setCalcErrors] = useState(null);
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: []
  });

  const handleErrCalculate = () => {
    if (canvasRef.current) {
      const result = canvasRef.current.runCalculation();
      setCalcErrors(result);
    }
  };
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


  const deleteAll = () => {
    setGraphData({ nodes: [], edges: [] });
    setCalcErrors(null); 
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
            <a href="#" onClick={deleteAll}>Удалить граф</a>
          </div>
        </div>
        <button className='btn'>Удалить элемент</button>
        <button className='btn' onClick={handleErrCalculate}>Посчитать ошибку</button>
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
      {calcErrors && (
        <div className="error-results-panel">
          <div className="error-panel-header">
            <h4>Результаты анализа</h4>
            <button onClick={() => setCalcErrors(null)}>×</button>
          </div>
          <div className="error-panel-body">
            <div className="error-stat">
              <span>Пересечение стрелок:</span>
              <strong>{calcErrors.err1EE}</strong>
            </div>
            <div className="error-stat">
              <span>Пересечение вершин:</span>
              <strong>{calcErrors.err2NN}</strong>
            </div>
            <div className="error-stat">
              <span>Вершины на стрелках:</span>
              <strong>{calcErrors.err3EN}</strong>
            </div>
          </div>
        </div>
      )}
      <Canvas 
        ref={canvasRef}
        graphData={graphData} 
        onGraphDataChange={setGraphData}
      />
    </div>
  );
};

export default Home;