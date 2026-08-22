import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AppRoutes } from './routes';
import { MapProvider } from './providers/MapProvider';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <MapProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </MapProvider>
    </BrowserRouter>
  );
}
