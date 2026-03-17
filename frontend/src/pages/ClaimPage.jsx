import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const publicClient = axios.create({ baseURL: '/api' });

function formatMoney(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ClaimPage() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | ready | error | notfound
  const [data, setData] = useState(null);
  const [step, setStep] = useState(1); // 1 = summary, 2 = portal

  useEffect(() => {
    publicClient
      .post(`/claims/submit/${token}`)
      .then((res) => {
        setData(res.data);
        setState('ready');
      })
      .catch((err) => {
        if (err.response?.status === 404) setState('notfound');
        else setState('error');
      });
  }, [token]);

  if (state === 'loading') {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b7280', marginTop: 16 }}>Loading your claim info…</p>
      </div>
    );
  }

  if (state === 'notfound') {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={styles.heading}>Link not found</h2>
        <p style={{ color: '#6b7280', textAlign: 'center', maxWidth: 320 }}>
          This claim link may have expired or is invalid. Please contact your provider.
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={styles.heading}>Something went wrong</h2>
        <p style={{ color: '#6b7280' }}>Please try again or contact your provider.</p>
      </div>
    );
  }

  const { ticket, estimate, insurer_portal } = data;
  const firstName = ticket.patient_name?.split(' ')[0] || 'there';

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>AmiCare</span>
      </div>

      <div style={styles.container}>
        {step === 1 && (
          <>
            <h1 style={styles.title}>Hi {firstName}, here's your claim summary</h1>
            <p style={styles.subtitle}>Review the details below, then tap "Submit My Claim" to file with your insurance.</p>

            {/* Claim Details Card */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Claim Details</h2>
              <div style={styles.grid}>
                <Row label="Patient" value={ticket.patient_name} />
                {ticket.patient_dob && <Row label="Date of Birth" value={formatDate(ticket.patient_dob)} />}
                <Row label="Visit Date" value={formatDate(ticket.visit_date)} />
                <Row label="Provider" value={ticket.provider_name} />
                {ticket.provider_npi && <Row label="Provider NPI" value={ticket.provider_npi} />}
                <Row label="Insurance" value={ticket.insurance_company} />
                {ticket.policy_number && <Row label="Policy #" value={ticket.policy_number} />}
                {ticket.group_number && <Row label="Group #" value={ticket.group_number} />}
              </div>

              {ticket.cpt_codes?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={styles.rowLabel}>Service Codes</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {ticket.cpt_codes.map((code) => (
                      <span key={code} style={styles.badge}>{code}</span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.diagnosis_codes?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={styles.rowLabel}>Diagnosis Codes</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {ticket.diagnosis_codes.map((code) => (
                      <span key={code} style={styles.badge}>{code}</span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.charge_amount && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                  <Row label="Charge Amount" value={formatMoney(ticket.charge_amount)} />
                </div>
              )}
            </div>

            {/* Estimate Card */}
            {estimate && (
              <div style={{ ...styles.card, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff' }}>
                <h2 style={{ ...styles.cardTitle, color: '#fff', opacity: 0.9 }}>Your Cost Estimate</h2>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 13, opacity: 0.75, margin: '0 0 4px' }}>You Pay (OOP)</p>
                    <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                      {formatMoney(estimate.oop_low)} – {formatMoney(estimate.oop_high)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, opacity: 0.75, margin: '0 0 4px' }}>Expected Reimbursement</p>
                    <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                      {formatMoney(estimate.reimbursement_low)} – {formatMoney(estimate.reimbursement_high)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button style={styles.primaryBtn} onClick={() => setStep(2)}>
              Submit My Claim →
            </button>

            <p style={styles.fine}>
              By continuing, you'll be directed to your insurance company's website to submit this claim.
              Your information above will be pre-filled for you.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={styles.title}>Submit your claim</h1>
            <p style={styles.subtitle}>
              You're just 3 steps away from getting reimbursed.
            </p>

            {/* Steps */}
            <div style={styles.card}>
              <Step number={1} title="Open your insurer's portal">
                Tap the button below to go to {insurer_portal.name || ticket.insurance_company || 'your insurance'}.
                Log in with your member credentials (from your insurance card).
              </Step>
              <Step number={2} title="Submit a new claim">
                Find the "File a Claim" or "Submit Claim" section. Select "Out-of-Network" or "Member-Submitted Claim."
              </Step>
              <Step number={3} title="Enter your details">
                <p style={{ margin: '4px 0 8px', color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
                  Use the information from your claim summary. Keep this page open for reference.
                </p>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
                  <SmallRow label="Provider NPI" value={ticket.provider_npi} />
                  <SmallRow label="Visit Date" value={formatDate(ticket.visit_date)} />
                  <SmallRow label="CPT Codes" value={ticket.cpt_codes?.join(', ')} />
                  {ticket.charge_amount && (
                    <SmallRow label="Charge Amount" value={formatMoney(ticket.charge_amount)} />
                  )}
                </div>
              </Step>
            </div>

            {/* Portal CTA */}
            {insurer_portal.url ? (
              <a href={insurer_portal.url} target="_blank" rel="noopener noreferrer" style={{ ...styles.primaryBtn, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Open {insurer_portal.name} →
              </a>
            ) : (
              <div style={{ ...styles.card, background: '#fefce8', borderColor: '#fde68a' }}>
                <p style={{ margin: 0, color: '#92400e', fontSize: 14 }}>
                  <strong>Search online for:</strong> "{ticket.insurance_company || 'your insurance'} member portal claim submission"
                </p>
              </div>
            )}

            <button style={styles.secondaryBtn} onClick={() => setStep(1)}>
              ← Back to Summary
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
    </div>
  );
}

function SmallRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: '#4f46e5',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 14, flexShrink: 0,
      }}>
        {number}
      </div>
      <div>
        <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#111827', fontSize: 15 }}>{title}</p>
        {typeof children === 'string'
          ? <p style={{ margin: 0, color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{children}</p>
          : children}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' },
  logo: { fontSize: 20, fontWeight: 700, color: '#4f46e5' },
  container: { maxWidth: 560, margin: '0 auto', padding: '32px 20px 64px' },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' },
  spinner: { width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  title: { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
  subtitle: { color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6, fontSize: 15 },
  heading: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 16px' },
  grid: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowLabel: { fontSize: 13, color: '#9ca3af', fontWeight: 500, flexShrink: 0 },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: 500, textAlign: 'right' },
  badge: { background: '#ede9fe', color: '#5b21b6', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  primaryBtn: {
    display: 'block', width: '100%', padding: '16px 24px', background: '#4f46e5',
    color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600,
    cursor: 'pointer', marginBottom: 12, boxSizing: 'border-box',
  },
  secondaryBtn: {
    display: 'block', width: '100%', padding: '14px 24px', background: 'transparent',
    color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 15,
    fontWeight: 500, cursor: 'pointer', marginTop: 8,
  },
  fine: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6, marginTop: 8 },
};
