import { useState } from "react";
import { Home, FileText, PieChart, Crown, Settings, LogOut } from "lucide-react";

export function Sidebar({ onNavigate, children }) {
  const [activeItem, setActiveItem] = useState("exercise");
  const [activityLimit] = useState({ current: 1, max: 20 });
  const [showDropdown, setShowDropdown] = useState(false);

  const userData = {
    name: "Hưng Nguyễn",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  };

  const menuItems = [
    {
      id: "home",
      icon: Home,
      label: "Dashboard",
      path: "/dashboard"
    },
    {
      id: "exercise",
      icon: FileText,
      label: "Bài tập",
      path: "/exercises",
      active: true
    },
    {
      id: "roadmap",
      icon: PieChart,
      label: "Lộ trình"
    },
    {
      id: "settings",
      icon: Settings,
      label: "Cài đặt",
      path: "/settings"
    },
  ];

  const progressPercentage = (activityLimit.current / activityLimit.max) * 100;

  return (
    <div className="flex h-screen">
      <aside className="w-28 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col items-center py-4 relative">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <div className="flex gap-0.5">
              <div className="w-1 h-4 bg-white dark:bg-slate-900 rounded-full"></div>
              <div className="w-1 h-5 bg-white dark:bg-slate-900 rounded-full"></div>
              <div className="w-1 h-3 bg-white dark:bg-slate-900 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2 w-full px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id);
                  if (onNavigate && item.path) {
                    onNavigate(item.path);
                  }
                }}
                className={`w-full flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all group relative ${
                  isActive
                    ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-gray-700 dark:text-gray-300"
                }`}
                title={item.label}
              >
                <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                  isActive ? "stroke-[2.5]" : "stroke-2"
                }`} />
                <span className={`text-xs leading-tight text-center ${
                  isActive ? "font-semibold" : "font-medium"
                }`}>
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-4 w-full px-2">
          {/* Upgrade Button */}
          <button
            className="w-full flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-colors group"
            title="Nâng cấp"
          >
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Crown className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xs font-semibold">Nâng cấp</span>
          </button>

          {/* Activity Progress with Dropdown */}
          <div 
            className="w-full flex flex-col items-center gap-2 pb-2 relative"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="relative w-12 h-12 cursor-pointer">
              {/* Circular Progress */}
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                {/* Background circle */}
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercentage / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              {/* Center avatar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={userData.avatar} 
                  alt={userData.name}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {activityLimit.current}/{activityLimit.max}
            </span>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div 
                className="absolute left-full bottom-0 ml-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 w-56 z-50 animate-fadeIn"
                style={{
                  animation: 'fadeIn 0.2s ease-in-out'
                }}
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <img 
                    src={userData.avatar} 
                    alt={userData.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{userData.name}</p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      if (onNavigate) {
                        onNavigate('/settings');
                      }
                      setActiveItem('settings');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center gap-3 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cài đặt</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // Handle logout
                      console.log('Logout');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="px-4 pt-2 pb-1 border-t border-gray-100 mt-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // Handle logout
                      console.log('Logout main button');
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </aside>
      
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-800">
        {children}
      </main>
    </div>
  );
}

export default Sidebar;