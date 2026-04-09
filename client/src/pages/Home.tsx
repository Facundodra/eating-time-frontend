import { useState } from "react";
import Pizza from "../assets/img/foods/f2.jpg";
import Sushi from "../assets/img/foods/f3.jpeg";
import Pasta from "../assets/img/foods/f4.jpg";
import Wraps from "../assets/img/foods/f5.jpeg";
import Donas from "../assets/img/foods/f1.avif";
import Hamburguesa from "../assets/img/foods/f6.jpeg";

const Home = () => {
  const [panelOpen, setPanelOpen] = useState(false);

  const foods = [
    { name: "Pizza", img: Pizza },
    { name: "Sushi", img: Sushi },
    { name: "Pasta", img: Pasta },
    { name: "Wraps", img: Wraps },
    { name: "Donas", img: Donas },
    { name: "Hamburguesa", img: Hamburguesa },
  ];


return (
  <div className="animate-fade">

    {/* The Carousel using the new scrollbar-hide */}
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Platillos</h2>
      <div className="carousel">
        {foods.map((food, index) => (
          <div className="card" key={index}>
            <img src={food.img} className="food-image" alt={food.name} />
            <p className="text-center mt-2 font-medium">{food.name}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Side Panel & Overlay */}
    {panelOpen && <div className="overlay" onClick={() => setPanelOpen(false)} />}
    
    <div className={`panel ${panelOpen ? "panel-open" : ""}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Menú</h2>
        <button onClick={() => setPanelOpen(false)} className="text-2xl">&times;</button>
      </div>
      <ul className="flex flex-col gap-4">
        <li><a href="/" className="btn block text-center">Inicio</a></li>
        <li><a href="/login" className="btn block text-center">Login</a></li>
      </ul>
    </div>
  </div>
);
};

export default Home;