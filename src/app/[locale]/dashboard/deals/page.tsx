'use client';

import { useState } from 'react';

interface Deal {
  id: string;
  name: string;
  value: number;
  company: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  expectedCloseDate: Date;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: '1',
      name: 'Enterprise Software Package',
      value: 85000,
      company: 'Acme Inc.',
      stage: 'proposal',
      expectedCloseDate: new Date(Date.now() + 86400000 * 15), // 15 days from now
    },
    {
      id: '2',
      name: 'Cloud Migration Services',
      value: 45000,
      company: 'XYZ Corp',
      stage: 'negotiation',
      expectedCloseDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
    },
    {
      id: '3',
      name: 'Support & Maintenance Plan',
      value: 12000,
      company: 'ABC Ltd',
      stage: 'closed-won',
      expectedCloseDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    },
  ]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get stage badge color
  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'lead':
        return 'bg-gray-200 text-gray-800';
      case 'qualified':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-indigo-100 text-indigo-800';
      case 'negotiation':
        return 'bg-purple-100 text-purple-800';
      case 'closed-won':
        return 'bg-green-100 text-green-800';
      case 'closed-lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deals</h1>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md">
          New Deal
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Close
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{deal.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{deal.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900 font-medium">{formatCurrency(deal.value)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStageBadgeColor(deal.stage)}`}>
                      {deal.stage.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(deal.expectedCloseDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 