

export function EmergencyProtocolContent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-white mb-4">1. Scope of the Protocol</h2>
        <p>
          This Emergency Response Protocol dictates the operational procedures for the AERO system when a high-priority medical transport is initiated. The protocol defines the interactions between ambulance units, traffic control infrastructure, and destination hospitals.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">2. Traffic Authority Coordination</h2>
        <p>
          AERO submits predictive routing requests to connected traffic management systems. 
          The platform does not directly assume hardware control of municipal traffic signals. Instead, it securely transmits projected arrival windows, allowing authorized local traffic command centers to execute emergency green-wave corridors based on their internal safety parameters and real-time conditions.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">3. Hospital Telemetry Integration</h2>
        <p>
          When an ambulance is en route, AERO continuously streams live ETA, patient severity status, and critical telemetry to the receiving emergency department. Hospitals are expected to acknowledge the incoming patient via the AERO terminal to confirm trauma bay and team readiness.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">4. Liability & Overrides</h2>
        <p>
          The AERO platform is an advisory and coordination tool. The primary responsibility for the safe operation of the emergency vehicle rests entirely with the certified driver. At any point, the vehicle operator or central command may override the AERO-generated route if real-world road conditions dictate a safer alternative.
        </p>
      </section>
    </>
  );
}

export function TermsOfServiceContent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing and using the AERO platform, you agree to be bound by these Terms of Service. AERO provides coordination software for emergency response professionals and is strictly limited to authorized personnel within designated medical, police, and command center organizations.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">2. Authorized Use</h2>
        <p>
          You agree to use AERO solely for the purpose of coordinating genuine emergency response activities. Unauthorized access, sharing of credentials, or testing the system with false emergency data is strictly prohibited and may result in immediate suspension of access and notification of relevant authorities.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">3. System Availability & Warranties</h2>
        <p>
          While AERO strives for maximum uptime, the platform is provided "as is" and "as available." We do not guarantee uninterrupted access or that route calculation will be flawless under all network conditions. AERO is not a replacement for traditional emergency radio communications or primary dispatch systems.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">4. Limitation of Liability</h2>
        <p>
          AERO and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of or inability to use the platform. In life-critical situations, operators must exercise independent judgment.
        </p>
      </section>
    </>
  );
}

export function PrivacyPolicyContent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-white mb-4">1. Data Collection</h2>
        <p>
          AERO collects real-time location data (GPS), operational status, and limited patient severity indicators necessary for hospital preparation. We also log access records and system interactions for security and auditing purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">2. Data Usage</h2>
        <p>
          The information collected is used exclusively for routing, traffic coordination, and alerting destination hospitals. Aggregate, anonymized route data may be used to improve the efficiency of our predictive traffic algorithms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">3. Data Sharing & Security</h2>
        <p>
          Data is transmitted via end-to-end encryption. AERO shares live emergency telemetry strictly with authorized endpoints (e.g., the specific destination hospital and relevant traffic authorities). We do not sell or share data with third parties for marketing purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">4. Compliance</h2>
        <p>
          AERO operates in accordance with standard medical data protection guidelines regarding the transmission of patient severity status. However, detailed personally identifiable medical records (EMR) are not stored or transmitted through the AERO routing platform.
        </p>
      </section>
    </>
  );
}
