import React from 'react';

const PatientList: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Patient List</h1>
        <p className="text-secondary-600">Manage and view all patients</p>
      </div>
      
      <div className="card">
        <div className="card-body">
          <p className="text-secondary-600">Patient list coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default PatientList;