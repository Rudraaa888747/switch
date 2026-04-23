import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('adminAuth') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
