import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// 1. Import CSS của Bootstrap và Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// 2. Import JS của Bootstrap (Bắt buộc để Carousel kéo thả hoạt động)
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap; // Gán vào window để Home.jsx có thể gọi được

// Import CSS Global của bạn (như đã hướng dẫn ở bước trước)
import './assets/global.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)