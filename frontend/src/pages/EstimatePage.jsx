import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, DollarSign, Shield, Calendar, FileText } from 'lucide-react';
import axios from 'axios';

const publicClient = axios.create({ baseURL: '/api' });

function ConfidenceBadge({ level }) {
  const styles = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  };
  const labels = { high: 'High confidence', medium: 'Moderate confidence', low: 'Estimated' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[level] || styles.medium}`}>
      {labels[level] || level}
    </span>
  );
}

function formatMoney(n) {
  if (n == null) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(str) {
  if (!str) return null;
  return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function EstimatePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | pending | error

  useEffect(() => {
    publicClient.get(`/estimates/public/${token}`)
      .then(({ data: res }) => {
        setData(res);
        setStatus(res.estimate ? 'ready' : 'pending');
      })
      .catch((err) => {
        setStatus(err.response?.status === 404 ? 'notfound' : 'error');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Link not found</h1>
          <p className="text-gray-500 text-sm">This estimate link is invalid or has expired. Please contact your provider's office.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm">Please try again or contact your provider's office.</p>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={28} className="text-indigo-600 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Hi {data.ticket.patient_first_name}, your estimate is being prepared
          </h1>
          <p className="text-gray-500 text-sm">
            We're verifying your benefits with {data.ticket.insurance_company}. Check back shortly — you'll receive a notification when it's ready.
          </p>
        </div>
      </div>
    );
  }

  const { ticket, estimate } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600">AmiCare</span>
          <span className="text-xs text-gray-400">Your personal cost estimate</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hi {ticket.patient_first_name} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's your out-of-network cost estimate for your upcoming visit.
          </p>
        </div>

        {/* Visit details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Visit Details</h2>
          <div className="space-y-2">
            {ticket.provider_name && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <span>{ticket.provider_name}</span>
              </div>
            )}
            {ticket.visit_date && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <span>{formatDate(ticket.visit_date)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Shield size={14} className="text-gray-400 shrink-0" />
              <span>{ticket.insurance_company}</span>
            </div>
            {ticket.charge_amount && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <DollarSign size={14} className="text-gray-400 shrink-0" />
                <span>Total charge: {formatMoney(ticket.charge_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cost breakdown — the hero card */}
        <div className="bg-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-indigo-100 text-sm uppercase tracking-wider">Your Cost Estimate</h2>
            <ConfidenceBadge level={estimate.confidence} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-indigo-200 text-xs mb-1">You pay (est.)</p>
              <p className="text-2xl font-bold">
                {formatMoney(estimate.oop_low)}
                <span className="text-lg font-normal text-indigo-200"> – {formatMoney(estimate.oop_high)}</span>
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-indigo-200 text-xs mb-1">Insurance pays (est.)</p>
              <p className="text-2xl font-bold">
                {formatMoney(estimate.reimbursement_low)}
                <span className="text-lg font-normal text-indigo-200"> – {formatMoney(estimate.reimbursement_high)}</span>
              </p>
            </div>
          </div>

          <p className="text-indigo-200 text-xs mt-4">
            These are estimates based on your verified benefits. Final amounts may vary.
          </p>
        </div>

        {/* What is this */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            How this works
          </h2>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="font-bold text-indigo-600 shrink-0">1.</span>
              Your provider's office verified your benefits with {ticket.insurance_company} using AmiCare.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-indigo-600 shrink-0">2.</span>
              After your visit, pay your provider directly. You'll receive a superbill (itemized receipt).
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-indigo-600 shrink-0">3.</span>
              Submit your claim below — we'll generate your form and walk you through it.
            </li>
          </ol>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/claim/${token}`)}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
        >
          Submit My Claim →
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by AmiCare · Your information is secure
        </p>
      </div>
    </div>
  );
}
