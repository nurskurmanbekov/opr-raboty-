import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

const Layout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 bg-gray-50 min-h-screen">
        {/* Top bar with theme toggle */}
        <div className="bg-white shadow-sm px-8 py-4 flex justify-end items-center">
          <ThemeToggle />
        </div>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;