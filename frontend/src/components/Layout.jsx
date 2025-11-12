import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

const Layout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="flex">
      <Sidebar />
      <div
        className="ml-64 flex-1 min-h-screen transition-colors"
        style={{ backgroundColor: theme.colors.backgroundPaper }}
      >
        {/* Top bar with theme toggle */}
        <div
          className="shadow-sm px-8 py-4 flex justify-end items-center transition-colors"
          style={{
            backgroundColor: theme.colors.background,
            borderBottom: `1px solid ${theme.colors.divider}`
          }}
        >
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