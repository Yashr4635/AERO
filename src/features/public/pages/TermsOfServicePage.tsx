
import { LegalPageLayout } from '../../../components/layout/LegalPageLayout';
import { TermsOfServiceContent } from '../components/LegalContent';

export function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="September 1, 2026">
      <TermsOfServiceContent />
    </LegalPageLayout>
  );
}
