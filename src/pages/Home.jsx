// Home.jsx
import React, { useState, useEffect } from 'react';
import Canvas from '../components/Canvas/Canvas';
import FileUploader from '../components/FileUploader.tsx';
import './Home.css';

const Home = () => {
  const [open, setOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

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

  const importGraph = () => {
    setShowUploader(true);
  };

  const exportGraph = () => {
    alert('Экспорт');
  };
  const saveGraph = () => {
    alert('Сохранить');
  };
  const deleteAll = () => {
    alert('Удалить');
  };

  return (
    <div>
      <div className='control-board'>
        <div className="dropdown">
          <button onClick={toggleDropdown} className="btn">Работа с графом</button>

          <div className={`dropdown-content ${open ? 'show' : ''}`}>
            <a href="#" onClick={importGraph}>Импортировать граф</a>
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
        {showUploader && <FileUploader onClose={() => setShowUploader(false)} />}
      </div>
      <Canvas/>
    </div>
  );
};

export default Home;