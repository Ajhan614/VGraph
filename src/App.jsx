import React from 'react';
import Navbar from './components/Navbar/Navbar';
import './App.css'
import Home from './pages/Home'
import CreateGraph from './pages/CreateGraph';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'

const App = () => {
  return (
    <Router>
      <div className='container'>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create_graph" element={<CreateGraph />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/documentation" element={<Documentation />} />
        </Routes>
      </div>
    </Router>
  )
};

export default App;
