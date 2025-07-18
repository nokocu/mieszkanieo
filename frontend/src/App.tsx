import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layout/Layout'
import PropertyListPage from './pages/PropertyListPage'
import ScrapingPage from './pages/ScrapingPage'

function App() {
  const [activeTab, setActiveTab] = useState('properties')

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'properties':
        return <PropertyListPage />
      case 'scraping':
        return <ScrapingPage />
      default:
        return <PropertyListPage />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </Layout>
  )
}

export default App
