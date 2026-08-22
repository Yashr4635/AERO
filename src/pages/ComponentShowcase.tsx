import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Drawer } from '../components/ui/Drawer';
import { Tabs } from '../components/ui/Tabs';
import { Tooltip } from '../components/ui/Tooltip';
import { SkeletonLine, SkeletonCircle, SkeletonCard, SkeletonMap, EmptyState, ErrorState, OfflineOverlay } from '../components/ui/Feedback';
import { ConnectionIndicator } from '../components/status/ConnectionIndicator';
import { GPSIndicator } from '../components/status/GPSIndicator';
import { EmergencyStatusBar } from '../components/status/EmergencyStatusBar';
import { SOSButton } from '../components/status/SOSButton';
import { AvailabilityToggle } from '../components/status/AvailabilityToggle';
import { ETADisplay } from '../components/status/ETADisplay';
import type { AvailabilityStatus, EmergencyStatus, ConnectionState } from '../types';

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-navy-100 mb-4 pb-2 border-b border-navy-600/50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[13px] font-semibold text-navy-400 uppercase tracking-[0.05em] mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function ComponentShowcase() {
  const { addToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [offlineVisible, setOfflineVisible] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityStatus>('AVAILABLE');

  return (
    <div className="min-h-dvh bg-navy-950">
      {/* Header */}
      <div className="bg-navy-900 border-b border-navy-600/50 px-6 py-5">
        <h1 className="text-xl font-bold text-navy-50">
          LIFE<span className="text-info-400">LANE</span> — Design System
        </h1>
        <p className="text-sm text-navy-400 mt-1">Component showcase &amp; living reference</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ═══════ BUTTONS ═══════ */}
        <Section title="Buttons">
          <SubSection title="Variants">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="emergency">Emergency</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </SubSection>
          <SubSection title="Sizes">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl" variant="emergency">XL Emergency</Button>
            </div>
          </SubSection>
          <SubSection title="States">
            <div className="flex flex-wrap gap-3">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button variant="emergency" loading>SOS Sending</Button>
              <Button variant="outline" icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              }>With Icon</Button>
            </div>
          </SubSection>
        </Section>

        {/* ═══════ INPUTS ═══════ */}
        <Section title="Inputs">
          <div className="grid gap-4 max-w-sm">
            <Input label="Default" placeholder="Enter value..." />
            <Input label="With Icon" placeholder="Search..." icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            } />
            <Input label="Error State" placeholder="Invalid input" error="This field is required" />
            <Input label="With Hint" placeholder="Optional" hint="This field is optional" />
            <Input label="Disabled" placeholder="Can't edit" disabled />
          </div>
        </Section>

        {/* ═══════ SELECT ═══════ */}
        <Section title="Select">
          <div className="grid gap-4 max-w-sm">
            <Select label="Default" placeholder="Choose..." options={[
              { value: '1', label: 'City General Hospital' },
              { value: '2', label: 'Apollo Trauma Care' },
              { value: '3', label: "St. Mary's Emergency" },
            ]} />
            <Select label="Error State" error="Selection required" placeholder="Choose..." options={[
              { value: '1', label: 'Option 1' },
            ]} />
          </div>
        </Section>

        {/* ═══════ BADGES ═══════ */}
        <Section title="Badges">
          <SubSection title="Variants">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">Info</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="emergency">Emergency</Badge>
            </div>
          </SubSection>
          <SubSection title="With Dot">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" dot>Connected</Badge>
              <Badge variant="warning" dot>Reconnecting</Badge>
              <Badge variant="danger" dot>Offline</Badge>
            </div>
          </SubSection>
          <SubSection title="Emergency Status Badges">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="PENDING" />
              <StatusBadge status="ACCEPTED" />
              <StatusBadge status="ACTIVE" />
              <StatusBadge status="COMPLETED" />
              <StatusBadge status="CANCELLED" />
            </div>
          </SubSection>
        </Section>

        {/* ═══════ ALERTS ═══════ */}
        <Section title="Alerts">
          <div className="space-y-3">
            <Alert variant="info" title="Information">Route has been recalculated due to road closure.</Alert>
            <Alert variant="success" title="Success">Emergency has been completed successfully.</Alert>
            <Alert variant="warning" title="Warning">GPS accuracy is degraded. Location may be imprecise.</Alert>
            <Alert variant="error" title="Error">Failed to connect to the routing service.</Alert>
            <Alert variant="emergency" title="INCOMING EMERGENCY">
              Ambulance Unit 01 → City General Hospital. ETA: 7 minutes.
            </Alert>
            <Alert variant="info" title="Dismissible Alert" dismissible onDismiss={() => {}}>
              This alert can be dismissed by the user.
            </Alert>
            <Alert
              variant="warning"
              title="With Actions"
              actions={
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Ignore</Button>
                  <Button variant="primary" size="sm">Retry</Button>
                </div>
              }
            >
              Route calculation failed. Would you like to retry?
            </Alert>
          </div>
        </Section>

        {/* ═══════ TOASTS ═══════ */}
        <Section title="Toasts">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => addToast({ variant: 'info', title: 'Info', message: 'Route has been recalculated.' })}>Info Toast</Button>
            <Button variant="success" size="sm" onClick={() => addToast({ variant: 'success', title: 'Success', message: 'Emergency completed.' })}>Success Toast</Button>
            <Button variant="outline" size="sm" onClick={() => addToast({ variant: 'warning', title: 'Warning', message: 'GPS accuracy degraded.' })}>Warning Toast</Button>
            <Button variant="danger" size="sm" onClick={() => addToast({ variant: 'error', title: 'Error', message: 'Connection to server lost.' })}>Error Toast</Button>
          </div>
        </Section>

        {/* ═══════ CARDS ═══════ */}
        <Section title="Cards">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader title="Default Card" subtitle="Standard card component" />
              <p className="text-sm text-navy-300">Card content goes here. Used for grouping related information.</p>
            </Card>
            <Card variant="interactive" onClick={() => addToast({ variant: 'info', message: 'Card clicked!' })}>
              <CardHeader title="Interactive Card" subtitle="Click me" />
              <p className="text-sm text-navy-300">Hover and click interaction.</p>
            </Card>
            <Card variant="compact">
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-200">Compact Card</span>
                <Badge variant="success" dot size="sm">Online</Badge>
              </div>
            </Card>
          </div>
        </Section>

        {/* ═══════ DIALOG ═══════ */}
        <Section title="Dialog">
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>Open Dialog</Button>
          </div>
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onConfirm={() => { setDialogOpen(false); addToast({ variant: 'success', message: 'Confirmed!' }); }}
            title="Confirm Action"
            description="Are you sure you want to proceed with this action? This cannot be undone."
            variant="danger"
            confirmLabel="Confirm"
          />
        </Section>

        {/* ═══════ DRAWER ═══════ */}
        <Section title="Drawer">
          <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>Open Bottom Drawer</Button>
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Emergency Details">
            <div className="space-y-3">
              <p className="text-sm text-navy-300">Drawer content — bottom sheet on mobile, side panel on desktop.</p>
              <Card variant="compact">
                <div className="flex justify-between">
                  <span className="text-sm text-navy-200">Ambulance Unit 01</span>
                  <StatusBadge status="ACTIVE" />
                </div>
              </Card>
              <Card variant="compact">
                <div className="flex justify-between">
                  <span className="text-sm text-navy-200">ETA</span>
                  <span className="text-sm font-semibold text-navy-100">7 min</span>
                </div>
              </Card>
            </div>
          </Drawer>
        </Section>

        {/* ═══════ TABS ═══════ */}
        <Section title="Tabs">
          <Tabs tabs={[
            { id: 'active', label: 'Active', badge: 2, content: <p className="text-sm text-navy-300">Active emergencies content.</p> },
            { id: 'pending', label: 'Pending', badge: 1, content: <p className="text-sm text-navy-300">Pending emergencies content.</p> },
            { id: 'completed', label: 'Completed', content: <p className="text-sm text-navy-300">Completed emergencies content.</p> },
            { id: 'disabled', label: 'Disabled', disabled: true, content: <p>Disabled tab</p> },
          ]} />
        </Section>

        {/* ═══════ TOOLTIP ═══════ */}
        <Section title="Tooltips">
          <div className="flex flex-wrap gap-6">
            <Tooltip content="Top tooltip" position="top"><Button variant="ghost" size="sm">Top</Button></Tooltip>
            <Tooltip content="Bottom tooltip" position="bottom"><Button variant="ghost" size="sm">Bottom</Button></Tooltip>
            <Tooltip content="Left tooltip" position="left"><Button variant="ghost" size="sm">Left</Button></Tooltip>
            <Tooltip content="Right tooltip" position="right"><Button variant="ghost" size="sm">Right</Button></Tooltip>
          </div>
        </Section>

        {/* ═══════ SKELETONS ═══════ */}
        <Section title="Skeleton Loaders">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <SubSection title="Lines & Circle">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <SkeletonCircle />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine className="w-1/3" />
                      <SkeletonLine className="w-full" />
                    </div>
                  </div>
                </div>
              </SubSection>
              <SubSection title="Card Skeleton">
                <SkeletonCard />
              </SubSection>
            </div>
            <SubSection title="Map Skeleton">
              <SkeletonMap className="h-48" />
            </SubSection>
          </div>
        </Section>

        {/* ═══════ EMPTY / ERROR / OFFLINE ═══════ */}
        <Section title="Empty, Error & Offline States">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <EmptyState title="No Emergencies" description="All clear — no active emergencies." action={<Button size="sm" variant="outline">Refresh</Button>} />
            </Card>
            <Card>
              <ErrorState title="Connection Failed" message="Could not reach the server. Please check your connection." onRetry={() => addToast({ variant: 'info', message: 'Retrying...' })} />
            </Card>
            <Card>
              <div className="text-center py-4">
                <Button variant="outline" size="sm" onClick={() => { setOfflineVisible(true); setTimeout(() => setOfflineVisible(false), 3000); }}>
                  Show Offline Overlay (3s)
                </Button>
              </div>
            </Card>
          </div>
          <OfflineOverlay show={offlineVisible} />
        </Section>

        {/* ═══════ CONNECTION & GPS INDICATORS ═══════ */}
        <Section title="Connection & GPS Indicators">
          <SubSection title="Connection States">
            <div className="flex flex-wrap gap-6">
              {(['connected', 'disconnected', 'reconnecting'] as ConnectionState[]).map((state) => (
                <ConnectionIndicator key={state} state={state} showLabel />
              ))}
            </div>
          </SubSection>
          <SubSection title="GPS States">
            <div className="flex flex-wrap gap-6">
              <GPSIndicator state="active" accuracy={5} showLabel />
              <GPSIndicator state="acquiring" showLabel />
              <GPSIndicator state="unavailable" showLabel />
            </div>
          </SubSection>
        </Section>

        {/* ═══════ EMERGENCY STATUS BAR ═══════ */}
        <Section title="Emergency Status Bar">
          <div className="space-y-3">
            {(['PENDING', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as EmergencyStatus[]).map((status) => (
              <EmergencyStatusBar key={status} status={status} />
            ))}
          </div>
        </Section>

        {/* ═══════ SOS BUTTON ═══════ */}
        <Section title="SOS Button">
          <div className="flex flex-wrap gap-8 items-start">
            <div className="text-center">
              <SOSButton onConfirm={() => addToast({ variant: 'success', message: 'SOS Sent!' })} hospitalName="City General Hospital" />
              <p className="text-[11px] text-navy-500 mt-2">Enabled</p>
            </div>
            <div className="text-center">
              <SOSButton onConfirm={() => {}} disabled disabledReason="Select a hospital first" />
              <p className="text-[11px] text-navy-500 mt-2">Disabled</p>
            </div>
            <div className="text-center">
              <SOSButton onConfirm={() => {}} loading />
              <p className="text-[11px] text-navy-500 mt-2">Loading</p>
            </div>
          </div>
        </Section>

        {/* ═══════ AVAILABILITY TOGGLE ═══════ */}
        <Section title="Availability Toggle">
          <div className="space-y-4">
            <AvailabilityToggle status={availability} onChange={setAvailability} />
            <AvailabilityToggle status="BUSY" onChange={() => {}} />
          </div>
        </Section>

        {/* ═══════ ETA DISPLAY ═══════ */}
        <Section title="ETA Display">
          <SubSection title="Full">
            <Card variant="compact" className="inline-block">
              <ETADisplay etaSeconds={420} distanceMeters={4500} speed={45} />
            </Card>
          </SubSection>
          <SubSection title="Compact">
            <ETADisplay etaSeconds={420} distanceMeters={4500} speed={45} compact />
          </SubSection>
          <SubSection title="Short Distance">
            <Card variant="compact" className="inline-block">
              <ETADisplay etaSeconds={45} distanceMeters={350} />
            </Card>
          </SubSection>
        </Section>

        {/* ═══════ COLOR PALETTE ═══════ */}
        <Section title="Color Palette">
          <SubSection title="Navy">
            <div className="flex gap-1">
              {['bg-navy-950','bg-navy-900','bg-navy-800','bg-navy-700','bg-navy-600','bg-navy-500','bg-navy-400','bg-navy-300','bg-navy-200','bg-navy-100','bg-navy-50'].map((c) => (
                <Tooltip key={c} content={c}><div className={`w-10 h-10 rounded ${c}`} /></Tooltip>
              ))}
            </div>
          </SubSection>
          <SubSection title="Semantic">
            <div className="space-y-2">
              {[
                { name: 'Emergency', colors: ['bg-emergency-900','bg-emergency-700','bg-emergency-600','bg-emergency-500','bg-emergency-400','bg-emergency-300'] },
                { name: 'Warning', colors: ['bg-warning-900','bg-warning-700','bg-warning-600','bg-warning-500','bg-warning-400','bg-warning-300'] },
                { name: 'Success', colors: ['bg-success-900','bg-success-700','bg-success-600','bg-success-500','bg-success-400','bg-success-300'] },
                { name: 'Info', colors: ['bg-info-900','bg-info-700','bg-info-600','bg-info-500','bg-info-400','bg-info-300'] },
              ].map((group) => (
                <div key={group.name} className="flex items-center gap-3">
                  <span className="text-[12px] text-navy-400 w-20">{group.name}</span>
                  <div className="flex gap-1">
                    {group.colors.map((c) => (
                      <Tooltip key={c} content={c}><div className={`w-8 h-8 rounded ${c}`} /></Tooltip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ═══════ TYPOGRAPHY ═══════ */}
        <Section title="Typography">
          <div className="space-y-3">
            <p className="text-[30px] font-bold leading-[1.2] text-navy-50">Display — 30px Bold</p>
            <p className="text-2xl font-semibold text-navy-50">Heading LG — 24px Semibold</p>
            <p className="text-xl font-semibold text-navy-50">Heading — 20px Semibold</p>
            <p className="text-base font-semibold text-navy-50">Heading SM — 16px Semibold</p>
            <p className="text-sm text-navy-200">Body — 14px Regular</p>
            <p className="text-[13px] text-navy-300">Body SM — 13px Regular</p>
            <p className="text-[12px] font-medium text-navy-400">Caption — 12px Medium</p>
            <p className="text-[11px] font-medium text-navy-500">Caption SM — 11px Medium</p>
            <p className="text-[13px] font-medium font-mono text-info-400">Monospace — 13px (coordinates, IDs)</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
