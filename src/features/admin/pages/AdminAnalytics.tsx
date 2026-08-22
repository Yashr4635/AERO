import { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { analyticsService } from '../../../services/analyticsService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

export function AdminAnalytics() {
  const [data, setData] = useState<{
    overview: any;
    emergencyVolume: any[];
    statusDistribution: any[];
    categoryDistribution: any[];
    responseTimes: any[];
    junctionClearanceMetrics: any[];
  } | null>(null);

  useEffect(() => {
    analyticsService.getAnalyticsData().then(setData);
  }, []);

  return (
    <AppShell userRole="ADMIN" userName="Central Command Admin" connectionState="connected">
      <div className="h-full overflow-y-auto pb-10">
        <PageHeader
          title="Operations Analytics & Performance"
          subtitle="Real-time metrics on ambulance transit times, junction clearance speeds, and multi-agency response"
        />

        {!data ? (
          <div className="flex justify-center py-10">
            <span className="text-navy-400">Loading analytics dataset...</span>
          </div>
        ) : (
          <div className="px-4 sm:px-6 space-y-6">
            
            {/* KPI Highlight Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card variant="compact">
                <span className="text-[10px] font-bold text-navy-400 uppercase block">Average Transit Time</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {data.overview.avgResponseTimeMinutes} mins
                </span>
                <span className="text-[10px] text-emerald-300/80 block mt-0.5">↓ 62% faster than city traffic</span>
              </Card>

              <Card variant="compact">
                <span className="text-[10px] font-bold text-navy-400 uppercase block">Time Saved Per Trip</span>
                <span className="text-2xl font-bold text-cyan-400 font-mono">
                  {data.overview.timeSavedVsNormalTrafficMins} mins
                </span>
                <span className="text-[10px] text-navy-300 block mt-0.5">Golden Hour Preservation</span>
              </Card>

              <Card variant="compact">
                <span className="text-[10px] font-bold text-navy-400 uppercase block">Junction Clearance Rate</span>
                <span className="text-2xl font-bold text-purple-400 font-mono">
                  {data.overview.junctionClearanceSuccessRatePercent}%
                </span>
                <span className="text-[10px] text-navy-300 block mt-0.5">Police-Assisted Green Wave</span>
              </Card>

              <Card variant="compact">
                <span className="text-[10px] font-bold text-navy-400 uppercase block">Total Dispatches Today</span>
                <span className="text-2xl font-bold text-emergency-400 font-mono">
                  {data.overview.totalEmergenciesToday} Runs
                </span>
                <span className="text-[10px] text-navy-300 block mt-0.5">Across 4 Network Hospitals</span>
              </Card>
            </div>

            {/* Charts Row 1: Volume & Weekly Response Times */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Emergency Volume by Time of Day */}
              <Card>
                <h3 className="text-sm font-bold text-navy-100 mb-1">Emergency Volume by Time of Day</h3>
                <p className="text-xs text-navy-400 mb-4">Total calls vs Police green-wave assisted corridors</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.emergencyVolume} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Bar dataKey="count" name="Total Emergencies" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clearedByPolice" name="Police Cleared" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Response Time Comparison vs Traffic Baseline */}
              <Card>
                <h3 className="text-sm font-bold text-navy-100 mb-1">Transit Time Comparison (Minutes)</h3>
                <p className="text-xs text-navy-400 mb-4">AERO Corridor vs Standard Urban Congestion</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.responseTimes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Line type="monotone" dataKey="standardTrafficMins" name="Without Coordination" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="avgResponseMins" name="AERO Clearance" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>

            {/* Charts Row 2: Category Distribution & Junction Clearance Speeds */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Emergency Category Distribution */}
              <Card>
                <h3 className="text-sm font-bold text-navy-100 mb-1">Emergency Category Distribution</h3>
                <p className="text-xs text-navy-400 mb-4">Breakdown by emergency triage pathology</p>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryDistribution}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {data.categoryDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-navy-300">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Junction Clearance Speeds */}
              <Card>
                <h3 className="text-sm font-bold text-navy-100 mb-1">Junction Clearance Speed (Seconds)</h3>
                <p className="text-xs text-navy-400 mb-4">Average police clearance time before ambulance arrival</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.junctionClearanceMetrics} layout="vertical" margin={{ top: 5, right: 15, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="junction" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Bar dataKey="avgClearanceSecs" name="Avg Clearance (Seconds)" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
