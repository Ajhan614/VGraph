import React from "react";
import './Navbar.css';
import logo from '../../assets/eye.png';
import { Link } from 'react-router-dom'; // Import Link here

const Navbar = () => {
  return (
    <div className="navbar">
      <img src={logo} alt="" className="logo" />
      <h1>Graph Visualizer</h1>
    </div>
  );
};

export default Navbar;