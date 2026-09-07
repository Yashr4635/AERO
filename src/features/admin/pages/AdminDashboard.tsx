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
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="h-full overflow-y-auto pb-10 bg-bg-main">
        <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle mb-6">
          <PageHeader
            title="AERO Central Operations"
            subtitle="Real-time multi-agency emergency tracking & traffic clearance supervision"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="enterprise-button-secondary">
              📊 Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleExport('json')} className="enterprise-button-primary">
              💾 Export JSON
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 sm:px-6 mb-6">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card variant="default" className="enterprise-card h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="telemetry-label">
                    {stat.label}
                  </p>
                  <span className="text-xl bg-bg-elevated p-1.5 rounded-lg border border-border-subtle">{stat.icon}</span>
                </div>
                <p className="text-3xl font-bold text-white tabular-nums mt-4">
                  {stat.value}
                </p>
              </Card>
            </motion.div>
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
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 enterprise-card p-3 shadow-none">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Search by Trip ID, Ambulance, or Hospital..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="enterprise-input pl-9 border-none bg-bg-main text-white"
                        />
                      </div>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="enterprise-input border-none bg-bg-main min-w-[200px]"
                      >
                        <option value="ALL">All Medical Categories</option>
                        <option value="CARDIAC">Cardiac</option>
                        <option value="TRAUMA">Trauma</option>
                        <option value="STROKE">Stroke</option>
                        <option value="RESPIRATORY">Respiratory</option>
                      </select>
                    </div>

                    {/* Emergencies Table / Cards */}
                    <div className="space-y-3">
                      <AnimatePresence>
                        {filteredEmergencies.map((emg) => {
                          const amb = mockAmbulances.find(a => a.id === emg.ambulanceId);
                          return (
                            <motion.div
                              key={emg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              <Card variant="default" className="enterprise-card hover:border-border-strong">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <span className="enterprise-badge bg-bg-main">
                                      {emg.id}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-white">{emg.ambulanceDisplayName}</p>
                                        <span className="text-xs text-text-secondary font-mono font-medium">({amb?.vehicleNumber || 'KA-01'})</span>
                                      </div>
                                      <p className="text-xs text-text-secondary font-medium mt-0.5">
                                        → {emg.hospital.name} • Category: <strong className="text-[#FF3B30]">{emg.patient?.category || 'CARDIAC'}</strong>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 shrink-0 bg-bg-main px-3 py-1.5 rounded-lg border border-border-subtle">
                                    <span className="text-xs text-text-secondary font-mono font-bold hidden sm:inline">
                                      ETA: {Math.round((emg.route?.etaSeconds || 0) / 60)}m ({emg.currentSpeedKmH || 54} km/h)
                                    </span>
                                    <StatusBadge status={emg.status} />
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {filteredEmergencies.length === 0 && (
                        <div className="text-center py-12 bg-bg-surface rounded-xl border border-border-subtle shadow-sm">
                          <span className="text-3xl block mb-3">🔍</span>
                          <h3 className="text-sm font-bold text-white">No active incidents found</h3>
                          <p className="text-xs text-text-secondary mt-1">Try adjusting your search or category filters.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ),
              },
              {
                id: 'fleet',
                label: 'Ambulance Fleet Telemetry',
                badge: mockAmbulances.length,
                content: (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {mockAmbulances.map((unit) => (
                      <Card key={unit.id} variant="default" className="enterprise-card">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3">
                          <div>
                            <p className="text-sm font-bold text-white">{unit.name}</p>
                            <p className="text-[11px] text-text-secondary font-mono font-medium">{unit.vehicleNumber}</p>
                          </div>
                          <Badge variant={unit.connectionState === 'connected' ? 'success' : 'danger'} dot size="sm">
                            {unit.connectionState === 'connected' ? 'Online GPS' : 'Offline'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-bg-main p-2 rounded-lg border border-border-subtle">
                            <span className="telemetry-label mb-1">Driver</span>
                            <span className="text-white font-bold block truncate">{unit.driverName}</span>
                          </div>
                          <div className="bg-bg-main p-2 rounded-lg border border-border-subtle">
                            <span className="telemetry-label mb-1">Speed</span>
                            <span className="text-[#35C7FF] font-bold font-mono block truncate">{unit.speedKmH} km/h</span>
                          </div>
                          <div className="bg-bg-main p-2 rounded-lg border border-border-subtle">
                            <span className="telemetry-label mb-1">Fuel</span>
                            <span className="text-[#FFB020] font-bold font-mono block truncate">{unit.fuelPercent}%</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                ),
              },
              {
                id: 'police',
                label: 'Traffic Police Units',
                badge: mockPoliceUnits.length,
                content: (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {mockPoliceUnits.map((police) => (
                      <Card key={police.id} variant="default" className="enterprise-card">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3">
                          <div>
                            <p className="text-sm font-bold text-white">{police.name}</p>
                            <p className="text-[11px] text-text-secondary font-mono font-medium">Badge: <span className="font-bold text-white">{police.badgeNumber}</span></p>
                          </div>
                          <Badge
                            variant={police.availability === 'AVAILABLE' ? 'success' : police.availability === 'BUSY' ? 'warning' : 'neutral'}
                            size="sm"
                          >
                            {police.availability}
                          </Badge>
                        </div>
                        <div className="bg-bg-main p-3 rounded-lg border border-border-subtle">
                          <p className="text-xs font-bold text-text-secondary">{police.station}</p>
                          <p className="text-[11px] text-text-secondary font-medium mt-1">Direct Wireless: <span className="font-mono text-white">{police.phone}</span></p>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                ),
              },
              {
                id: 'hospitals',
                label: 'Hospital ER Network',
                badge: mockHospitals.length,
                content: (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {mockHospitals.map((h) => (
                      <Card key={h.id} variant="default" className="enterprise-card">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3">
                          <p className="text-sm font-bold text-white truncate pr-2">{h.name}</p>
                          <Badge variant="emergency" size="sm">Emergency ER</Badge>
                        </div>
                        <p className="text-[11px] text-text-secondary font-medium line-clamp-1 mb-3">{h.address}</p>
                        <div className="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-border-subtle text-xs">
                          <div className="text-center">
                            <span className="telemetry-label mb-1">ICU Beds</span>
                            <span className="text-[#20D67A] font-bold bg-[#20D67A]/10 px-2 py-0.5 rounded-full">{h.availableIcuBeds} Free</span>
                          </div>
                          <div className="text-center border-l border-r border-border-subtle">
                            <span className="telemetry-label mb-1">Trauma</span>
                            <span className="text-[#35C7FF] font-bold bg-[#35C7FF]/10 px-2 py-0.5 rounded-full">{h.traumaBaysAvailable}</span>
                          </div>
                          <div className="text-center">
                            <span className="telemetry-label mb-1">Doctors</span>
                            <span className="text-[#FFB020] font-bold bg-[#FFB020]/10 px-2 py-0.5 rounded-full">{h.doctorsOnDuty}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
