// Home.jsx
import React, { useState, useEffect } from 'react';
import Canvas from '../components/Canvas/Canvas';
import './Home.css';

const Home = () => {
  const [open, setOpen] = useState(false);

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
    alert('Импорт')
  }
  const exportGraph = () => {
    alert('Экспорт')
  }
  const saveGraph = () => {
    alert('Сохранить')
  }
  const deleteAll = () => {
    alert('Удалить')
  }
  return (
    <div>
      <div className="dropdown">
        <button onClick={toggleDropdown} className="dropbtn">Граф</button>

        <div className={`dropdown-content ${open ? 'show' : ''}`}>
          <a href="#" onClick={importGraph}>Импортировать граф</a>
          <a href="#" onClick={exportGraph}>Экспортировать граф</a>
          <a href="#" onClick={saveGraph}>Сохранить граф</a>
          <a href="#" onClick={deleteAll}>Удалить все</a>
        </div>
      </div>
      <Canvas />
    </div>
  );
};

export default Home;