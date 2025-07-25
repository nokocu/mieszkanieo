import React from 'react'
import ReactDOM from 'react-dom/client'
import { Layout } from './components/Layout.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Layout />
  </React.StrictMode>,
)
