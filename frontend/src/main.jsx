// main.jsx — Point d'entrée de l'application React
// Rôle : Initialiser React et monter l'application GradFlow dans le DOM
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
