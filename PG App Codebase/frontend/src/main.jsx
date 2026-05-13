import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const { default: App } = await (
  import.meta.env.MODE === 'student'
    ? import('./platforms/student-pwa/App.jsx')
    : import('./platforms/unified/App.jsx')
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
