import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../components/Canvas/Canvas';
import './Home.css';
import calculateLayoutFromFile from '../services/api';
import { runGeneticAlgorithm } from '../services/optimizer';

const Home = () => {
  const [weights, setWeights] = useState({
    a: 1.0,   // вес пересечения стрелок
    b: 10.0,  // вес пересечения вершин 
    c: 5.0    // вес вершин на стрелках
  });
  const canvasRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const fileInputRef = useRef(null);
  const [calcErrors, setCalcErrors] = useState(null);
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: []
  });
const [isOptimizing, setIsOptimizing] = useState(false);

const handleWeightChange = (key, value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setWeights(prev => ({ ...prev, [key]: num }));
    }
  };

const handleOptimize = async () => {
    if (isOptimizing) return;
    if (!graphData.nodes || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
        alert('Нет вершин для оптимизации! Сначала импортируйте граф (.dot файл).');
        return;
    }
    setIsOptimizing(true);
    console.log('🚀 Запуск оптимизации. Количество вершин:', graphData.nodes.length);
    const epsilon = 100; 
    try {
        const finalNodes = await runGeneticAlgorithm(
            graphData.nodes,
            graphData.edges,
            weights,
            epsilon,
            (gen, score, nodes) => {
                if (Array.isArray(nodes) && nodes.length > 0) {
                    setGraphData(prev => ({ ...prev, nodes }));
                }
                console.log(`Ген: ${gen}, Ошибка: ${score.toFixed(2)}`);
            }
        );
        if (Array.isArray(finalNodes) && finalNodes.length > 0) {
            setGraphData(prev => ({ ...prev, nodes: finalNodes }));
        }
    } catch (err) {
        console.error('Ошибка во время оптимизации:', err);
    } finally {
        setIsOptimizing(false);
    }
};
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
            <a href="#" onClick={handleOptimize}>Оптимизировать топологию</a>
          </div>
        </div>
        <button className='btn' onClick={handleErrCalculate}>Посчитать ошибку</button>
               
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
            <div className="weights-section">
              <h5>Настройка весов</h5>
              <div className="weight-row">
                <span>a (пересечение стрелок)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weights.a}
                  onChange={(e) => handleWeightChange('a', e.target.value)}
                />
              </div>
              <div className="weight-row">
                <span>b (пересечение вершин)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weights.b}
                  onChange={(e) => handleWeightChange('b', e.target.value)}
                />
              </div>
              <div className="weight-row">
                <span>c (вершины на стрелках)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weights.c}
                  onChange={(e) => handleWeightChange('c', e.target.value)}
                />
              </div>
            </div>
            <div className="error-stat">
              <span>Общая ошибка:</span>
              <strong>{(weights.a * calcErrors.err1EE) + (weights.b * calcErrors.err2NN) + (weights.c * calcErrors.err3EN)}</strong>
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