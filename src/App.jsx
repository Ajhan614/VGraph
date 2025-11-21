import React, {useState, useEffect} from 'react';
import Navbar from './components/Navbar/Navbar';
import './App.css'
import Canvas from './components/Canvas/Canvas'

const App = () => {
  return (
    <div className='container'>
      <Navbar/>
      <Canvas/>
    </div>
  )
};

export default App;
