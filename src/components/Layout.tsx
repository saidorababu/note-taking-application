import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, StarIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Reference for dropdown

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // 🔹 Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Favorites', href: '/favorites', icon: StarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="sm:w-20 md:w-64 lg:w-64 bg-white shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-center h-16 px-4">
            <DocumentTextIcon className="h-8 w-8 text-gray-800 mr-2" />
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">AI Notes</h1>
          </div>
          <nav className="px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-6 w-6 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className="ml-3 hidden md:block">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Section */}
        <div className="relative" ref={dropdownRef}>
          {/* Profile Button */}
          {/* Profile Button */}
          <div
            className="p-4 border-t flex items-center cursor-pointer hover:bg-gray-100 relative"
            onClick={() => setIsOpen(!isOpen)}
          >
            <UserCircleIcon className="h-8 w-8 text-gray-800" />
            <span
              className="text-gray-700 text-sm hidden md:block ml-2 truncate max-w-[100px]"
              title={user?.email} // Shows full name on hover
            >
              {user?.email || 'User'}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-500 ml-auto hidden md:block" />
          </div>


          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute bottom-12 left-4 bg-white border rounded-lg shadow-lg w-40">
              <button
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/profile');
                }}
              >
                Profile
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
