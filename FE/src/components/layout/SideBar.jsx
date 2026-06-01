import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Home, Crown, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export function Sidebar({ children }) {
  const [activeItem, setActiveItem] = useState("home");
  const [activityLimit] = useState({ current: 1, max: 20 });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();

  // Get user data from localStorage
  const username = localStorage.getItem('user_username');

  const userData = {
    name: username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const menuItems = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      path: "/home"
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  }

  const progressPercentage = (activityLimit.current / activityLimit.max) * 100;

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation Bar */}
      <header className="h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 relative z-50 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/home')}>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-white dark:bg-slate-900 rounded-full"></div>
                <div className="w-1 h-4 bg-white dark:bg-slate-900 rounded-full"></div>
                <div className="w-1 h-2.5 bg-white dark:bg-slate-900 rounded-full"></div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveItem(item.id);
                      navigate(item.path);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all relative ${isActive
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-gray-900 dark:text-gray-100"
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.5]" : "stroke-2"
                      }`} />
                    <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"
                      }`}>
                      {item.label}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-500 rounded-t-full"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Section - Upgrade & User */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors mr-1"
              title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Upgrade Button */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              title="Nâng cấp"
            >
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                <Crown className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-xs font-semibold">Nâng cấp</span>
            </button>

            {/* User Profile with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="relative">
                  {/* Circular Progress */}
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 14}`}
                      strokeDashoffset={`${2 * Math.PI * 14 * (1 - progressPercentage / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={userData.avatar}
                      alt={userData.name}
                      className="w-6 h-6 rounded-full border-2 border-white"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{userData.name}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {activityLimit.current}/{activityLimit.max}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div
                    className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 w-56 z-50"
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activityLimit.current}/{activityLimit.max}</p>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <div className="px-4 pt-2 pb-1 border-t border-gray-100 mt-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 bg-gray-50 dark:bg-slate-800 flex flex-col">
        <div className="h-full overflow-hidden">
          <Outlet />
          {children}
        </div>
      </main>
    </div>
  );
}

export default Sidebar;
