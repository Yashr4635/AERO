
import { LegalPageLayout } from '../../../components/layout/LegalPageLayout';
import { EmergencyProtocolContent } from '../components/LegalContent';

export function EmergencyProtocolPage() {
  return (
    <LegalPageLayout title="Emergency Response Protocol" lastUpdated="September 1, 2026">
      <EmergencyProtocolContent />
    </LegalPageLayout>
  );
}
