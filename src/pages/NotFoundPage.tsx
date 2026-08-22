import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-navy-900 border border-navy-700 rounded-xl p-8 shadow-card text-center">
        <EmptyState
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-navy-500 mb-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          title="404 — Page Not Found"
          description="The operational page you are looking for does not exist or has been moved."
        />
        <div className="mt-6 flex gap-3 justify-center">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
