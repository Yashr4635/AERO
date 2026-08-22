import { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge, StatusBadge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { analyticsService } from '../../../services/analyticsService';
import { realtimeService } from '../../../services/realtimeService';
import { mockAmbulances, mockPoliceUnits, mockHospitals } from '../../../mock';
import type { Emergency } from '../../../types';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    activeEmergencies: 0,
    onlineAmbulances: 0,
    availablePolice: 0,
    partnerHospitals: 4,
    completedToday: 18,
    avgResponseTimeMins: 7.2,
    timeSavedMins: 11.4,
    clearanceSuccessRate: 96.4,
  });

  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    analyticsService.getDashboardOverview().then(setStats);
    setEmergencies(realtimeService.getAllEmergencies());

    const unsubEmergency = realtimeService.on('emergency_status', () => {
      analyticsService.getDashboardOverview().then(setStats);
      setEmergencies(realtimeService.getAllEmergencies());
    });

    return () => {
      unsubEmergency();
    };
  }, []);

  const handleExport = (format: 'csv' | 'json') => {
    analyticsService.exportData(format);
  };

  const statCards = [
    { label: 'Active Emergencies', value: stats.activeEmergencies, variant: 'emergency' as const, icon: '🚨' },
    { label: 'Fleet Online', value: `${stats.onlineAmbulances} Units`, variant: 'info' as const, icon: '🚑' },
    { label: 'Police Coverage', value: `${stats.availablePolice} Posts`, variant: 'warning' as const, icon: '👮' },
    { label: 'Avg Response Time', value: `${stats.avgResponseTimeMins}m`, variant: 'success' as const, icon: '⏱️' },
  ];

  const filteredEmergencies = emergencies.filter(emg => {
    const matchesSearch = emg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emg.ambulanceDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emg.hospital.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || emg.patient?.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell userRole="ADMIN" userName="Central Command Admin" connectionState="connected">
      <div className="h-full overflow-y-auto pb-10">
        <div className="px-4 sm:px-6 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <PageHeader
            title="AERO Central Operations"
            subtitle="Real-time multi-agency emergency tracking & traffic clearance supervision"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              📊 Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleExport('json')}>
              💾 Export JSON
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-6 mb-6">
          {statCards.map((stat) => (
            <Card key={stat.label} variant="compact">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-[0.05em] uppercase text-navy-400">
                  {stat.label}
                </p>
                <span className="text-base">{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-navy-50 tabular-nums mt-1">
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Tabbed Content */}
        <div className="px-4 sm:px-6 pb-6">
          <Tabs
            tabs={[
              {
                id: 'emergencies',
                label: 'Emergency Incident Log',
                badge: emergencies.length,
                content: (
                  <div className="space-y-3">
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 bg-navy-900 p-3 rounded-xl border border-navy-800">
                      <input
                        type="text"
                        placeholder="Search by Trip ID, Ambulance, or Hospital..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-navy-100 outline-none placeholder-navy-500"
                      />
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-navy-950 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-navy-100 outline-none"
                      >
                        <option value="ALL">All Medical Categories</option>
                        <option value="CARDIAC">Cardiac</option>
                        <option value="TRAUMA">Trauma</option>
                        <option value="STROKE">Stroke</option>
                        <option value="RESPIRATORY">Respiratory</option>
                      </select>
                    </div>

                    {/* Emergencies Table / Cards */}
                    <div className="space-y-2">
                      {filteredEmergencies.map((emg) => {
                        const amb = mockAmbulances.find(a => a.id === emg.ambulanceId);
                        return (
                          <Card key={emg.id} variant="compact">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs font-mono bg-navy-950 text-navy-300 px-2 py-1 rounded border border-navy-800">
                                  {emg.id}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-navy-100">{emg.ambulanceDisplayName}</p>
                                    <span className="text-xs text-navy-400 font-mono">({amb?.vehicleNumber || 'KA-01'})</span>
                                  </div>
                                  <p className="text-xs text-navy-400">
                                    → {emg.hospital.name} • Category: <strong className="text-emerald-400">{emg.patient?.category || 'CARDIAC'}</strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-navy-400 font-mono hidden sm:inline">
                                  ETA: {Math.round((emg.route?.etaSeconds || 0) / 60)}m ({emg.currentSpeedKmH || 54} km/h)
                                </span>
                                <StatusBadge status={emg.status} />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ),
              },
              {
                id: 'fleet',
                label: 'Ambulance Fleet Telemetry',
                badge: mockAmbulances.length,
                content: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mockAmbulances.map((unit) => (
                      <Card key={unit.id} variant="compact">
                        <div className="flex items-center justify-between border-b border-navy-800 pb-2 mb-2">
                          <div>
                            <p className="text-sm font-bold text-navy-100">{unit.name}</p>
                            <p className="text-xs text-navy-400 font-mono">{unit.vehicleNumber}</p>
                          </div>
                          <Badge variant={unit.connectionState === 'connected' ? 'success' : 'danger'} dot size="sm">
                            {unit.connectionState === 'connected' ? 'Online GPS' : 'Offline'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-navy-400 block text-[10px]">Driver</span>
                            <span className="text-navy-200 font-medium">{unit.driverName}</span>
                          </div>
                          <div>
                            <span className="text-navy-400 block text-[10px]">Speed</span>
                            <span className="text-emerald-400 font-bold font-mono">{unit.speedKmH} km/h</span>
                          </div>
                          <div>
                            <span className="text-navy-400 block text-[10px]">Fuel Level</span>
                            <span className="text-cyan-400 font-bold font-mono">{unit.fuelPercent}%</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ),
              },
              {
                id: 'police',
                label: 'Traffic Police Units',
                badge: mockPoliceUnits.length,
                content: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mockPoliceUnits.map((police) => (
                      <Card key={police.id} variant="compact">
                        <div className="flex items-center justify-between border-b border-navy-800 pb-2 mb-2">
                          <div>
                            <p className="text-sm font-bold text-navy-100">{police.name}</p>
                            <p className="text-xs text-navy-400 font-mono">Badge: {police.badgeNumber}</p>
                          </div>
                          <Badge
                            variant={police.availability === 'AVAILABLE' ? 'success' : police.availability === 'BUSY' ? 'warning' : 'neutral'}
                            size="sm"
                          >
                            {police.availability}
                          </Badge>
                        </div>
                        <p className="text-xs text-navy-300">{police.station}</p>
                        <p className="text-[11px] text-navy-400 mt-1">Direct Wireless: {police.phone}</p>
                      </Card>
                    ))}
                  </div>
                ),
              },
              {
                id: 'hospitals',
                label: 'Hospital ER Network',
                badge: mockHospitals.length,
                content: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mockHospitals.map((h) => (
                      <Card key={h.id} variant="compact">
                        <div className="flex items-center justify-between border-b border-navy-800 pb-2 mb-2">
                          <p className="text-sm font-bold text-navy-100">{h.name}</p>
                          <Badge variant="emergency" size="sm">Emergency ER</Badge>
                        </div>
                        <p className="text-xs text-navy-400 line-clamp-1">{h.address}</p>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-navy-800 text-xs">
                          <div>
                            <span className="text-navy-400 block text-[10px]">ICU Beds</span>
                            <span className="text-emerald-400 font-bold">{h.availableIcuBeds} Free</span>
                          </div>
                          <div>
                            <span className="text-navy-400 block text-[10px]">Trauma Bays</span>
                            <span className="text-sky-400 font-bold">{h.traumaBaysAvailable} Ready</span>
                          </div>
                          <div>
                            <span className="text-navy-400 block text-[10px]">Doctors</span>
                            <span className="text-purple-400 font-bold">{h.doctorsOnDuty} Duty</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
