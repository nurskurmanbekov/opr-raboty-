import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

const Layout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 bg-gray-50 dark:bg-slate-950 min-h-screen">
        {/* Top bar with theme toggle */}
        <div className="bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-800/50 px-8 py-4 flex justify-end items-center border-b border-gray-100 dark:border-gray-800">
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