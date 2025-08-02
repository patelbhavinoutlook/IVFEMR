import React from 'react';
import { Users, Calendar, DollarSign, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600">Welcome to FertyFlow EMR/HIS System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Total Patients</p>
                <p className="text-2xl font-bold text-secondary-900">1,234</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-full">
                <Activity className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Active Treatments</p>
                <p className="text-2xl font-bold text-secondary-900">89</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-full">
                <Calendar className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Today's Appointments</p>
                <p className="text-2xl font-bold text-secondary-900">24</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-danger-100 rounded-full">
                <DollarSign className="h-6 w-6 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-secondary-900">₹5.6L</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-secondary-900">Recent Activity</h3>
        </div>
        <div className="card-body">
          <p className="text-secondary-600">Dashboard content coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;