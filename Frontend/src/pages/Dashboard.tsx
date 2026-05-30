import { useInventoryStore } from '@/store';
import AdminDashboard from './dashboards/AdminDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import AnalystDashboard from './dashboards/AnalystDashboard';

export default function Dashboard() {
  const role = useInventoryStore((state) => state.currentUser?.role);

  switch (role) {
    case 'ADMIN': return <AdminDashboard />;
    case 'MANAGER': return <ManagerDashboard />;
    case 'STAFF': return <StaffDashboard />;
    case 'ANALYST': return <AnalystDashboard />;
    default: return <AdminDashboard />;
  }
}
