import React from "react";
import './Navbar.css';
import logo from '../../assets/eye.png';
import { Link } from 'react-router-dom'; // Import Link here

const Navbar = () => {
  return (
    <div className="navbar">
      <img src={logo} alt="" className="logo" />
      <h1>Graph Visualizer</h1>
      <ul className="nav-link">
        <li><Link to="/">Главная</Link></li> {/* Changed to Link, fixed path from /home to / */}
        <li><Link to="/create_graph">Создать граф</Link></li>
        <li><Link to="/settings">Настройки</Link></li>
        <li><Link to="/documentation">Документация</Link></li>
      </ul>
    </div>
  );
};

export default Navbar;