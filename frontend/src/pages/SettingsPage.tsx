import React from 'react'

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your application preferences
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Sort Order
            </label>
            <select className="block w-64 px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white">
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Results per Page
            </label>
            <select className="block w-32 px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white">
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="dark-mode"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-blue-500 border-neutral-300 rounded"
            />
            <label htmlFor="dark-mode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Enable dark mode
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="new-properties"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-blue-500 border-neutral-300 rounded"
              defaultChecked
            />
            <label htmlFor="new-properties" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Notify when new properties are found
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="price-alerts"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-blue-500 border-neutral-300 rounded"
            />
            <label htmlFor="price-alerts" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Price drop alerts for favorited properties
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="scraping-complete"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-blue-500 border-neutral-300 rounded"
              defaultChecked
            />
            <label htmlFor="scraping-complete" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Notify when scraping is complete
            </label>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Sources</h2>
        
        <div className="space-y-4">
          {[
            { name: 'Allegro', id: 'allegro', enabled: true },
            { name: 'GetHome', id: 'gethome', enabled: true },
            { name: 'Nieruchomości', id: 'nieruchomosci', enabled: true },
            { name: 'OLX', id: 'olx', enabled: false },
            { name: 'Otodom', id: 'otodom', enabled: true }
          ].map((source) => (
            <div key={source.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={`/logo_${source.id.charAt(0)}.png`} 
                  alt={source.name}
                  className="w-6 h-6 mr-3"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{source.name}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={source.enabled}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Advanced</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scraping Interval (hours)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              defaultValue="6"
              className="block w-24 px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Rate Limit (requests/minute)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              defaultValue="10"
              className="block w-24 px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <button className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
