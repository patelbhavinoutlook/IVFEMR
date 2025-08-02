import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-secondary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-secondary-500 hover:text-secondary-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Company/Clinic Selection */}
          <div className="hidden sm:flex items-center space-x-4">
            {user?.companies && user.companies.length > 0 && (
              <div className="relative">
                <select className="input pr-8 min-w-48 text-sm">
                  {user.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {user?.clinics && user.clinics.length > 0 && (
              <div className="relative">
                <select className="input pr-8 min-w-48 text-sm">
                  {user.clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-secondary-500 hover:text-secondary-700 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 p-2 text-secondary-700 hover:text-secondary-900"
            >
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary-600" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-secondary-500">
                  {user?.roles?.[0] || 'User'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-secondary-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-secondary-700 border-b border-secondary-100">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-xs text-secondary-500">{user?.email}</p>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile company/clinic selection */}
      <div className="sm:hidden mt-4 flex flex-col space-y-2">
        {user?.companies && user.companies.length > 0 && (
          <select className="input text-sm">
            {user.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        )}
        
        {user?.clinics && user.clinics.length > 0 && (
          <select className="input text-sm">
            {user.clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
};

export default Header;