import React, { useState } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import GenericTable from '../components/shared/GenericTable';
import StatusBadge from '../components/others/StatusBadge';

const Teams = () => {
  const [teams, setTeams] = useState([
    { id: 1, name: 'Purple Panthers FC', sport: 'Football', players: 24, coach: 'Marcus Vance', status: 'active' },
    { id: 2, name: 'Royal Strikers', sport: 'Basketball', players: 15, coach: 'Sarah Lin', status: 'active' },
    { id: 3, name: 'Apex Titans', sport: 'Football', players: 26, coach: 'Diego Silva', status: 'active' },
    { id: 4, name: 'Violet Hawks', sport: 'Volleyball', players: 14, coach: 'Elena Rostova', status: 'pending' },
    { id: 5, name: 'Sportego United', sport: 'Football', players: 25, coach: 'David Miller', status: 'purple' },
  ]);

  const columns = [
    {
      key: 'name',
      header: 'Team Name',
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-gray-900">{row.name}</div>
      ),
    },
    {
      key: 'sport',
      header: 'Sport',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {row.sport}
        </span>
      ),
    },
    {
      key: 'players',
      header: 'Squad Size',
      sortable: true,
      align: 'center',
      render: (row) => <span className="font-mono text-gray-800">{row.players} players</span>,
    },
    {
      key: 'coach',
      header: 'Head Coach',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} label={row.status.toUpperCase()} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => alert(`Viewing squad details for ${row.name}`)}
        >
          View Squad
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teams & Rosters</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage sports clubs, registered athletes, and coaching staff.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            const newTeam = {
              id: Date.now(),
              name: `New Club ${teams.length + 1}`,
              sport: 'Football',
              players: 20,
              coach: 'New Coach',
              status: 'active',
            };
            setTeams((prev) => [newTeam, ...prev]);
          }}
        >
          + Add New Team
        </Button>
      </div>

      <GenericTable
        title="Active Teams Directory"
        columns={columns}
        data={teams}
        pageSize={5}
        searchable={true}
        pagination={true}
      />
    </div>
  );
};

export default Teams;

