import { useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaBars} from "react-icons/fa"; //icons
import Logo from "../assets/img/logos/logo2.png";

export default function Navbar() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      {/* NAVBAR */}
      <nav className="bg-red-600 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center gap-4 p-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <img src={Logo} alt="Logo" className="h-8" />
            Eating Time
          </Link>

          {/* Search */}
          <div className="flex-1">
            <div className="flex bg-white rounded-full overflow-hidden">
              <input
                className="flex-1 px-4 py-2 text-sm outline-none"
                placeholder="Encuentra tu comida favorita..."
              />
              <button className="px-3 text-red-600">
                <FaSearch />
              </button>
            </div>
          </div>

          {/* Menu */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="bg-white/20 p-2 rounded-md text-white"
          >
            <FaBars />
          </button>
        </div>
      </nav>

      {/* OVERLAY */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* PANEL */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl p-6 transform transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"}`}>
        <h2 className="text-red-600 text-xl font-bold mb-4">
          Panel de Navegación
        </h2>

        <div className="flex flex-col gap-2">
          <Link to="/" className="p-2 rounded hover:bg-gray-100">Inicio</Link>
          <Link to="/login" className="p-2 rounded hover:bg-gray-100">Login</Link>
          <Link to="/register" className="p-2 rounded hover:bg-gray-100">Registro</Link>
          <Link to="/orders" className="p-2 rounded hover:bg-gray-100">Pedidos</Link>
          <Link to="/cart" className="p-2 rounded hover:bg-gray-100">Carrito</Link>
        </div>
      </div>
    </>

    
  );
}