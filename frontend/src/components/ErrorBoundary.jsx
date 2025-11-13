import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🔴 Error Boundary caught an error:', error);
    console.error('📋 Error details:', errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // You can also log the error to an error reporting service here
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <AlertTriangle className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
                  <p className="text-red-100 text-sm mt-1">
                    Произошла непредвиденная ошибка
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  Ошибка:
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 font-mono break-all">
                  {error?.toString()}
                </p>
              </div>

              {/* Development Details */}
              {isDevelopment && errorInfo && (
                <details className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                    Технические детали (только для разработки)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Error Count: {errorCount}
                      </p>
                    </div>
                  </div>
                </details>
              )}

              {/* User-friendly message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Что можно сделать:</strong>
                </p>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Попробуйте обновить страницу</li>
                  <li>Вернитесь на главную страницу</li>
                  <li>Проверьте интернет-соединение</li>
                  <li>Если проблема повторяется, обратитесь к администратору</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  Попробовать снова
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  Перезагрузить
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <Home className="h-4 w-4" />
                  На главную
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Если проблема сохраняется, пожалуйста, сообщите об ошибке с указанием времени и действий, которые к ней привели.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;
