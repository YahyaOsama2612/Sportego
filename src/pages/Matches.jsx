import React from 'react';
import Card from '../components/shared/Card';
import StatusBadge from '../components/others/StatusBadge';

const Matches = () => {
  const matches = [
    { id: 1, home: 'Purple Panthers FC', away: 'Apex Titans', date: 'Tomorrow, 19:30', league: 'Premier League', status: 'pending' },
    { id: 2, home: 'Sportego United', away: 'Cobalt Dragons', date: 'Nov 4, 16:00', league: 'Champions League', status: 'pending' },
    { id: 3, home: 'Royal Strikers', away: 'Lavender Knights', date: 'Yesterday', result: '88 - 82', league: 'National Series', status: 'active' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Matches & Fixtures</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upcoming schedules, tournaments, and match results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <Card key={match.id} title={match.league} subtitle={match.date}>
            <div className="py-4 flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-800">{match.home}</span>
              <span className="px-2.5 py-1 bg-primary-50 text-primary rounded-lg text-xs font-mono">
                {match.result || 'VS'}
              </span>
              <span className="text-gray-800">{match.away}</span>
            </div>
            <div className="mt-2 flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              <span className="text-gray-400">Match #{match.id}</span>
              <StatusBadge status={match.status} label={match.result ? 'COMPLETED' : 'SCHEDULED'} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Matches;

