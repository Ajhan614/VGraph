import Navbar from './components/Navbar/Navbar';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Removed unused Link import
import Home from './pages/Home';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';

const App = () => {
  return (
    <BrowserRouter>
      <div className='container'>
        <Navbar /> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;