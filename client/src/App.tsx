import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-white to-red-200 flex flex-col">
        
        <Navbar />

        <main className="flex-1 p-4">
          <Routes>  
            <Route path="/" element={<Home />} /> 
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />

      </div>
    </BrowserRouter>
  );
}

export default App;