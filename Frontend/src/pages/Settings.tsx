import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Bell, Shield, Key } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">System Settings</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage platform configuration and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden md:block w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 max-w-2xl">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Platform display and organization configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Organization Name</label>
                  <Input defaultValue="SmartInventory Corp" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Platform Email</label>
                  <Input type="email" defaultValue="admin@smartinventory.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Timezone</label>
                  <Input defaultValue="America/Chicago (CST)" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Default Currency</label>
                  <Input defaultValue="USD ($)" />
                </div>
                <Button className="mt-2">Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure alert channels and thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Low Stock Alerts', desc: 'When product stock falls below reorder point', enabled: true },
                  { label: 'Forecast Drift Alerts', desc: 'When AI model prediction variance exceeds threshold', enabled: true },
                  { label: 'Anomaly Detection', desc: 'Unusual demand patterns or stock discrepancies', enabled: true },
                  { label: 'Purchase Order Updates', desc: 'Status changes on active purchase orders', enabled: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <Badge variant={item.enabled ? 'success' : 'secondary'} className="text-[10px] font-bold">
                      {item.enabled ? 'Active' : 'Off'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Authentication and access control settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Session Timeout (minutes)</label>
                  <Input type="number" defaultValue={30} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Max Login Attempts</label>
                  <Input type="number" defaultValue={5} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Two-Factor Authentication</p>
                    <p className="text-[11px] text-slate-400">Require TOTP for all admin users</p>
                  </div>
                  <Badge variant="success" className="text-[10px] font-bold">Enabled</Badge>
                </div>
                <Button className="mt-2">Update Security Settings</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Manage API keys and integration endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">API Base URL</label>
                  <Input defaultValue="https://api.smartinventory.com/v1" readOnly className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">ML Service Endpoint</label>
                  <Input defaultValue="https://ml.smartinventory.com/predict" readOnly className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Live API Key</label>
                  <Input defaultValue="sk_live_••••••••••••••••••••" type="password" />
                </div>
                <Button variant="outline" className="mt-2">Regenerate Key</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
