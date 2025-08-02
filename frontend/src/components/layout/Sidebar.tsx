import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Heart, LayoutDashboard, Users, Stethoscope, CreditCard, Package, TestTube, Calendar, Settings, Building2, UserCog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const hasRole = (roles: string[]): boolean => {
    return user?.roles?.some(role => roles.includes(role)) || false;
  };

  const hasAdminRole = (): boolean => {
    return hasRole(['Super Admin', 'Company Admin', 'Clinic Admin']);
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['all']
    },
    {
      title: 'Patients',
      path: '/patients',
      icon: Users,
      roles: ['all']
    },
    {
      title: 'Treatments',
      path: '/treatments',
      icon: Stethoscope,
      roles: ['Doctor', 'Embryologist', 'Nurse', 'Super Admin', 'Company Admin', 'Clinic Admin']
    },
    {
      title: 'Lab & Reports',
      path: '/lab',
      icon: TestTube,
      roles: ['Doctor', 'Lab Technician', 'Embryologist', 'Super Admin', 'Company Admin', 'Clinic Admin']
    },
    {
      title: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      roles: ['Receptionist', 'Doctor', 'Nurse', 'Super Admin', 'Company Admin', 'Clinic Admin']
    },
    {
      title: 'Billing',
      path: '/billing',
      icon: CreditCard,
      roles: ['Billing Officer', 'Receptionist', 'Super Admin', 'Company Admin', 'Clinic Admin']
    },
    {
      title: 'Inventory',
      path: '/inventory',
      icon: Package,
      roles: ['Pharmacist', 'Super Admin', 'Company Admin', 'Clinic Admin']
    }
  ];

  const adminMenuItems = [
    {
      title: 'User Management',
      path: '/admin/users',
      icon: UserCog,
      roles: ['Super Admin', 'Company Admin', 'Clinic Admin']
    },
    {
      title: 'Company Setup',
      path: '/admin/companies',
      icon: Building2,
      roles: ['Super Admin']
    },
    {
      title: 'Clinic Setup',
      path: '/admin/clinics',
      icon: Settings,
      roles: ['Super Admin', 'Company Admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes('all') || hasRole(item.roles)
  );

  const filteredAdminItems = adminMenuItems.filter(item => 
    hasRole(item.roles)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-secondary-900">FertyFlow</h1>
                <p className="text-xs text-secondary-500">EMR/HIS System</p>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-secondary-500 hover:text-secondary-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {/* Main menu items */}
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                    : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                  }
                `}
                onClick={() => window.innerWidth < 1024 && onClose()}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            ))}

            {/* Admin section */}
            {hasAdminRole() && filteredAdminItems.length > 0 && (
              <>
                <div className="pt-6 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
                
                {filteredAdminItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                        : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                      }
                    `}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-secondary-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <Users className="h-5 w-5 text-primary-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-secondary-500 truncate">
                  {user?.roles?.[0] || 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;