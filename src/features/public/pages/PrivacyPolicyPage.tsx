
import { LegalPageLayout } from '../../../components/layout/LegalPageLayout';
import { PrivacyPolicyContent } from '../components/LegalContent';

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="September 1, 2026">
      <PrivacyPolicyContent />
    </LegalPageLayout>
  );
}
