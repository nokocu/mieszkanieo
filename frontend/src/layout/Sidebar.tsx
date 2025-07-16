interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  paths: string[];
  width?: number;
  height?: number;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const navigationItems: NavigationItem[] = [
  { 
    id: 'properties', 
    label: 'Properties', 
    paths: ["M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"],
  },
  { 
    id: 'favorites', 
    label: 'Favorites', 
    paths: ["M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"],
  },
  { 
    id: 'scraping', 
    label: 'Scraping', 
    paths: ["M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"],
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    paths: ["M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z", "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"],
  }
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="relative col-start-1 row-span-full row-start-1">
      {/* Full sidebar */}
      <div className="absolute inset-0 hidden xl:block">
        <div className="sticky top-14.25 bottom-0 left-0 h-full max-h-[calc(100dvh-(var(--spacing)*14.25))] w-72 overflow-y-auto p-6">
          <div>
            <nav className="flex flex-col gap-8">
              <ul className="flex flex-col gap-2">
                {navigationItems.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`group inline-flex items-center gap-3 text-base/8 w-full text-left sm:text-sm/7 **:data-outline:stroke-gray-400 dark:**:data-outline:stroke-gray-500 **:[svg]:first:size-5 **:[svg]:first:sm:size-4 hover:text-gray-950 hover:**:data-highlight:fill-gray-300 hover:**:data-outline:stroke-gray-950 dark:hover:text-white dark:hover:**:data-highlight:fill-gray-600 dark:hover:**:data-outline:stroke-white ${
                        activeTab === item.id 
                          ? 'font-semibold text-gray-950 **:data-highlight:fill-gray-300 **:data-outline:stroke-gray-950 dark:text-white dark:**:data-highlight:fill-gray-600 dark:**:data-outline:stroke-white' 
                          : 'text-gray-300 dark:text-gray-300'
                      }`}
                      onClick={() => onTabChange(item.id)}
                    >
                      <svg 
                        width={item.width || 24} 
                        height={item.height || 24} 
                        viewBox={item.viewBox || "0 0 24 24"}
                        fill={item.fill || "none"}
                        stroke={item.stroke || "currentColor"}
                        className={activeTab === item.id ? 'text-white' : 'text-gray-400 dark:text-gray-500'}
                      >
                        {item.paths.map((pathData, index) => (
                          <path key={index} strokeLinecap="round" strokeLinejoin="round" d={pathData} />
                        ))}
                      </svg>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Compact sidebar */}
      <div className="absolute inset-0 block xl:hidden">
        <div className="sticky top-14.25 bottom-0 left-0 h-full max-h-[calc(100dvh-(var(--spacing)*14.25))] w-16 overflow-y-auto p-3">
          <nav className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`group relative flex items-center justify-center w-10 h-10 transition-colors ${
                      activeTab === item.id 
                        ? 'text-sky-800 dark:text-sky-300' 
                        : 'text-gray-600 hover:bg-neutral-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-300 rounded-lg'
                    }`}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                  >
                    {activeTab === item.id && (
                      <>
                        <span className="absolute inset-0 border border-dashed border-sky-300/60 bg-sky-400/10 group-hover:bg-sky-400/15 dark:border-sky-300/30"></span>
                        <svg width="5" height="5" viewBox="0 0 5 5" className="absolute top-[-2px] left-[-2px] fill-sky-300 dark:fill-sky-300/50">
                          <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z"></path>
                        </svg>
                        <svg width="5" height="5" viewBox="0 0 5 5" className="absolute top-[-2px] right-[-2px] fill-sky-300 dark:fill-sky-300/50">
                          <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z"></path>
                        </svg>
                        <svg width="5" height="5" viewBox="0 0 5 5" className="absolute bottom-[-2px] left-[-2px] fill-sky-300 dark:fill-sky-300/50">
                          <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z"></path>
                        </svg>
                        <svg width="5" height="5" viewBox="0 0 5 5" className="absolute right-[-2px] bottom-[-2px] fill-sky-300 dark:fill-sky-300/50">
                          <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z"></path>
                        </svg>
                      </>
                    )}
                    <svg 
                      width={20} 
                      height={20} 
                      viewBox={item.viewBox || "0 0 24 24"}
                      fill={item.fill || "none"}
                      stroke={item.stroke || "currentColor"}
                      strokeWidth={item.strokeWidth || 2} 
                    >
                      {item.paths.map((pathData, index) => (
                        <path key={index} strokeLinecap="round" strokeLinejoin="round" d={pathData} />
                      ))}
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}
