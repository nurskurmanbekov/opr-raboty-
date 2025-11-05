import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 bg-gray-50 min-h-screen">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;