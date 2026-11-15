import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import PageTransition from '@/components/PageTransition';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="dashboard-main">
        <Navbar title="Dashboard Admin" role="admin" />
        <div className="dashboard-content">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="dashboard-inner">
            <PageTransition dashboardContent>{children}</PageTransition>
          </div>
        </div>
      </div>
    </div>
  );
}
