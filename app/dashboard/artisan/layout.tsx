import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import PageTransition from '@/components/PageTransition';

export default function ArtisanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <Sidebar role="artisan" />
      <div className="dashboard-main">
        <Navbar title="Dashboard Artisan" role="artisan" />
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
