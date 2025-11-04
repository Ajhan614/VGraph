import React from "react";
import './Navbar.css'
import logo from '../../assets/eye.png'

const Navbar = () =>{
    return (
        <div className="navbar">

            <img src={logo} alt="" className="logo"/>

            <h1>Graph Visualizer</h1>

            <ul className="nav-link">
                <li><a href="/home">Главная</a></li>
                <li><a href="/create_graph">Создать граф</a></li>
                <li><a href="/settings">Настройки</a></li>
                <li><a href="/documentation">Документация</a></li>
            </ul>

        </div>
    )
}

export default Navbar