import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function ArtisanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <Sidebar role="artisan" />
      <div className="dashboard-main">
        <Navbar title="Dashboard Artisan" role="artisan" />
        <div className="dashboard-content">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="dashboard-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
