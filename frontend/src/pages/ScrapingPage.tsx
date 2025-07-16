import React, { useState } from 'react'

const ScrapingPage: React.FC = () => {
  const [isScrapingActive, setIsScrapingActive] = useState(false)
  const [scrapingProgress, setScrapingProgress] = useState(0)

  const handleStartScraping = () => {
    setIsScrapingActive(true)
    // TODO: Implement actual scraping logic
    // For demo purposes, simulate progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setScrapingProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsScrapingActive(false)
        setScrapingProgress(0)
      }
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Scraping</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and monitor data collection from various property sources
        </p>
      </div>

      {/* Scraping Controls */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Scraping Controls</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isScrapingActive ? 'Scraping in progress...' : 'Ready to scrape'}
              </p>
            </div>
            <button
              onClick={handleStartScraping}
              disabled={isScrapingActive}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                isScrapingActive
                  ? 'bg-neutral-400 cursor-not-allowed text-white'
                  : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isScrapingActive ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scraping...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Start Scraping
                </>
              )}
            </button>
          </div>

          {isScrapingActive && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{scrapingProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 dark:bg-neutral-700">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scrapingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source Configuration */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Sources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Allegro', id: 'allegro', enabled: true, lastUpdate: '2 hours ago' },
            { name: 'GetHome', id: 'gethome', enabled: true, lastUpdate: '1 hour ago' },
            { name: 'Nieruchomości', id: 'nieruchomosci', enabled: true, lastUpdate: '3 hours ago' },
            { name: 'OLX', id: 'olx', enabled: false, lastUpdate: '1 day ago' },
            { name: 'Otodom', id: 'otodom', enabled: true, lastUpdate: '30 minutes ago' }
          ].map((source) => (
            <div key={source.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <img 
                    src={`/logo_${source.id.charAt(0)}.png`} 
                    alt={source.name}
                    className="w-6 h-6 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {source.name}
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${source.enabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {source.lastUpdate}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        
        <div className="space-y-3">
          {[
            { time: '2 hours ago', message: 'Scraped 234 properties from Allegro', status: 'success' },
            { time: '1 hour ago', message: 'Scraped 156 properties from GetHome', status: 'success' },
            { time: '3 hours ago', message: 'Scraped 89 properties from Nieruchomości', status: 'success' },
            { time: '1 day ago', message: 'Failed to scrape from OLX - rate limit exceeded', status: 'error' }
          ].map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ScrapingPage
