import React from 'react';
import Card from '../components/shared/Card';

const Analytics = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Performance & Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          League statistics, win rates, and attendance insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Average Win Rate" subtitle="Current Season">
          <div className="py-4">
            <span className="text-4xl font-extrabold text-primary">76.4%</span>
            <p className="text-xs text-emerald-600 mt-2 font-medium">↑ +4.2% from last tournament</p>
          </div>
        </Card>

        <Card title="Total Match Hours" subtitle="Recorded Playtime">
          <div className="py-4">
            <span className="text-4xl font-extrabold text-gray-900">340 hrs</span>
            <p className="text-xs text-gray-500 mt-2">Across 4 competitive leagues</p>
          </div>
        </Card>

        <Card title="Fan Engagement" subtitle="Stadium & Online">
          <div className="py-4">
            <span className="text-4xl font-extrabold text-primary">89.1k</span>
            <p className="text-xs text-emerald-600 mt-2 font-medium">↑ +12% monthly growth</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

