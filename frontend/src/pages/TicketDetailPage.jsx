import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getTicket, updateTicket, uploadFile } from '../api/tickets';
import { triggerCall, hangupCall } from '../api/calls';
import { addBenefits, generateEstimate } from '../api/estimates';
import { notifyPatient } from '../api/notify';
import StatusBadge from '../components/common/StatusBadge';
import useWebSocket from '../hooks/useWebSocket';
import { Phone, PhoneOff, FileText, ChevronDown, ChevronUp, Play, DollarSign, Info, AlertTriangle, Clock, Send, Copy, CheckCheck } from 'lucide-react';
import CallProgressBar from '../components/CallProgressBar';

const STATUS_OPTIONS = [
  'pending_estimate',
  'estimate_generated',
  'claim_submitted',
  'calling_insurer',
  'awaiting_payment',
  'resolved',
];

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [hangingUp, setHangingUp] = useState(null);
  const [expandedCall, setExpandedCall] = useState(null);
  const [showBenefitsForm, setShowBenefitsForm] = useState(false);
  const [benefitsForm, setBenefitsForm] = useState({
    deductible_individual: '',
    deductible_met: '',
    oop_max: '',
    coinsurance_percentage: '',
    reimbursement_method: '',
  });
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const { data } = await getTicket(id);
      setTicket(data);
      setNotes(data.notes || '');
    } catch (e) {
      console.error('Failed to fetch ticket', e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  useWebSocket((msg) => {
    if (msg.data?.ticket_id === id) fetchTicket();
  });

  const handleStatusChange = async (e) => {
    try {
      await updateTicket(id, { status: e.target.value });
      fetchTicket();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleNotesBlur = async () => {
    if (notes !== (ticket?.notes || '')) {
      await updateTicket(id, { notes });
    }
  };

  const handleCallInsurance = async () => {
    setCalling(true);
    try {
      await triggerCall(id);
      fetchTicket();
    } catch (e) {
      alert('Failed to initiate call: ' + (e.response?.data?.detail || e.message));
    }
    setCalling(false);
  };

  const handleAddBenefits = async (e) => {
    e.preventDefault();
    const data = {};
    for (const [k, v] of Object.entries(benefitsForm)) {
      if (v !== '') data[k] = k === 'coinsurance_percentage' ? parseInt(v) : parseFloat(v) || v;
    }
    try {
      await addBenefits(id, data);
      setShowBenefitsForm(false);
      setBenefitsForm({ deductible_individual: '', deductible_met: '', oop_max: '', coinsurance_percentage: '', reimbursement_method: '' });
      fetchTicket();
    } catch (e) {
      alert('Failed to add benefits');
    }
  };

  const handleGenerateEstimate = async () => {
    try {
      await generateEstimate({ ticket_id: id });
      fetchTicket();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleSendToPatient = async () => {
    setSending(true);
    try {
      await notifyPatient(id);
      setSent(true);
      fetchTicket();
    } catch (e) {
      alert('Failed to send: ' + (e.response?.data?.detail || e.message));
    }
    setSending(false);
  };

  const handleCopyLink = () => {
    if (!ticket?.share_token) return;
    const url = `${window.location.origin}/estimate/${ticket.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCall = ticket?.call_logs?.find((cl) =>
    ['queued', 'ringing', 'in_progress', 'on_hold', 'transferring'].includes(cl.status)
  );
  const hasEstimate = ticket?.estimates?.length > 0;
  const shareLink = ticket?.share_token
    ? `${window.location.origin}/estimate/${ticket.share_token}`
    : null;

  const handleHangup = async (callLogId) => {
    setHangingUp(callLogId);
    try {
      await hangupCall(callLogId);
      fetchTicket();
    } catch (e) {
      alert('Failed to hang up: ' + (e.response?.data?.detail || e.message));
    }
    setHangingUp(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadFile(id, file, 'other');
      fetchTicket();
    } catch (err) {
      alert('Upload failed');
    }
  };

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading...</div>;
  if (!ticket) return <div className="text-red-500 py-8 text-center">Ticket not found</div>;

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.patient_name}</h1>
          <p className="text-sm text-gray-500">Ticket {ticket.id.slice(0, 8)}... | Created {new Date(ticket.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={ticket.status} onChange={handleStatusChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <button
            onClick={handleCallInsurance}
            disabled={calling || !ticket.insurance_phone}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Phone size={16} />
            {calling ? 'Calling...' : 'Call Insurance Now'}
          </button>
        </div>
      </div>

      {/* Live Call Progress */}
      {activeCall && (
        <CallProgressBar callLog={activeCall} onDone={fetchTicket} />
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Patient Info</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Email:</span> {ticket.patient_email || '-'}</div>
            <div><span className="text-gray-500">Phone:</span> {ticket.patient_phone || '-'}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Insurance</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Carrier:</span> {ticket.insurance_company}</div>
            <div><span className="text-gray-500">Phone:</span> {ticket.insurance_phone || '-'}</div>
            <div><span className="text-gray-500">Policy #:</span> {ticket.policy_number || '-'}</div>
            <div><span className="text-gray-500">Group #:</span> {ticket.group_number || '-'}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Provider & Visit</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Provider:</span> {ticket.provider_name || '-'}</div>
            <div><span className="text-gray-500">NPI:</span> {ticket.provider_npi || '-'}</div>
            <div><span className="text-gray-500">Visit Date:</span> {ticket.visit_date || '-'}</div>
            <div><span className="text-gray-500">CPT Codes:</span> {ticket.cpt_codes?.join(', ') || '-'}</div>
            <div><span className="text-gray-500">Charge:</span> {ticket.charge_amount ? `$${ticket.charge_amount}` : '-'}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Files</h3>
          {ticket.file_uploads?.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {ticket.file_uploads.map((f) => (
                <li key={f.id}>
                  <a href={`/api/uploads/${f.id}/download`} className="text-indigo-600 hover:underline flex items-center gap-1">
                    <FileText size={14} /> {f.original_filename}
                  </a>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-400">No files</p>}
          <input type="file" onChange={handleFileUpload} className="mt-2 text-sm" />
        </div>
      </div>

      {/* Carrier Intelligence */}
      {ticket.carrier && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Carrier Intelligence - {ticket.carrier.display_name}</h3>

          {ticket.carrier.special_considerations && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Important</h4>
                  <p className="text-xs text-amber-700 mt-1">{ticket.carrier.special_considerations}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {ticket.carrier.ivr_navigation?.benefits_verification && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">IVR Navigation</h4>
                    <p className="text-xs text-blue-700 mt-1">{ticket.carrier.ivr_navigation.benefits_verification}</p>
                    {ticket.carrier.ivr_navigation.notes && (
                      <p className="text-xs text-blue-600 mt-1 italic">{ticket.carrier.ivr_navigation.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {ticket.carrier.script_notes && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700">Script Notes</h4>
                <p className="text-xs text-gray-600 mt-1">{ticket.carrier.script_notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {ticket.carrier.avg_hold_time_minutes && (
              <span className="flex items-center gap-1"><Clock size={12} /> ~{ticket.carrier.avg_hold_time_minutes} min hold</span>
            )}
            {ticket.carrier.reference_number_format && (
              <span>Ref # format: {ticket.carrier.reference_number_format}</span>
            )}
            {ticket.carrier.reimbursement_methods?.length > 0 && (
              <span>Reimbursement: {ticket.carrier.reimbursement_methods.join(', ')}</span>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          className={inputClass}
          placeholder="Add notes..."
        />
      </div>

      {/* Call Log Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Call Log</h3>
        {ticket.call_logs?.length > 0 ? (
          <div className="space-y-3">
            {[...ticket.call_logs].reverse().map((cl) => (
              <div key={cl.id} className="border border-gray-100 rounded-lg p-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedCall(expandedCall === cl.id ? null : cl.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      cl.status === 'completed' ? 'bg-green-500' :
                      cl.status === 'in_progress' ? 'bg-yellow-500' :
                      cl.status === 'failed' || cl.status === 'no_answer' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{cl.phone_number}</span>
                    <span className="text-xs text-gray-500">{cl.status}</span>
                    {cl.duration_seconds && <span className="text-xs text-gray-400">{Math.floor(cl.duration_seconds / 60)}m {cl.duration_seconds % 60}s</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {new Date(cl.created_at).toLocaleString()}
                    {['queued', 'ringing', 'in_progress', 'on_hold', 'transferring'].includes(cl.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleHangup(cl.id); }}
                        disabled={hangingUp === cl.id}
                        className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        <PhoneOff size={12} />
                        {hangingUp === cl.id ? 'Ending...' : 'Hang Up'}
                      </button>
                    )}
                    {expandedCall === cl.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
                {expandedCall === cl.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {cl.summary && <div className="text-sm"><span className="font-medium text-gray-600">Summary:</span> {cl.summary}</div>}
                    {cl.transcript && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Transcript:</span>
                        <pre className="mt-1 text-xs bg-gray-50 p-3 rounded whitespace-pre-wrap max-h-60 overflow-auto">{cl.transcript}</pre>
                      </div>
                    )}
                    {cl.recording_url && (
                      <div className="flex items-center gap-2">
                        <Play size={14} className="text-gray-500" />
                        <audio controls src={cl.recording_url} className="h-8" />
                      </div>
                    )}
                    {cl.reference_numbers?.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Ref #:</span> {cl.reference_numbers.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No calls yet</p>}
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Benefits Verification</h3>
          <button
            onClick={() => setShowBenefitsForm(!showBenefitsForm)}
            className="text-xs text-indigo-600 hover:underline"
          >
            + Add Benefits Data
          </button>
        </div>
        {ticket.benefits?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs">
                <th className="pb-2">Deductible</th><th className="pb-2">Met</th>
                <th className="pb-2">OOP Max</th><th className="pb-2">Coinsurance %</th>
                <th className="pb-2">Method</th>
              </tr>
            </thead>
            <tbody>
              {ticket.benefits.map((b) => (
                <tr key={b.id}>
                  <td>${b.deductible_individual || '-'}</td>
                  <td>${b.deductible_met || '-'}</td>
                  <td>${b.oop_max || '-'}</td>
                  <td>{b.coinsurance_percentage != null ? `${b.coinsurance_percentage}%` : '-'}</td>
                  <td>{b.reimbursement_method || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-gray-400">No benefits data yet</p>}

        {showBenefitsForm && (
          <form onSubmit={handleAddBenefits} className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Deductible ($)</label>
              <input type="number" step="0.01" value={benefitsForm.deductible_individual}
                onChange={(e) => setBenefitsForm({...benefitsForm, deductible_individual: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Deductible Met ($)</label>
              <input type="number" step="0.01" value={benefitsForm.deductible_met}
                onChange={(e) => setBenefitsForm({...benefitsForm, deductible_met: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">OOP Max ($)</label>
              <input type="number" step="0.01" value={benefitsForm.oop_max}
                onChange={(e) => setBenefitsForm({...benefitsForm, oop_max: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Coinsurance %</label>
              <input type="number" value={benefitsForm.coinsurance_percentage}
                onChange={(e) => setBenefitsForm({...benefitsForm, coinsurance_percentage: e.target.value})} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Reimbursement Method</label>
              <input value={benefitsForm.reimbursement_method}
                onChange={(e) => setBenefitsForm({...benefitsForm, reimbursement_method: e.target.value})}
                placeholder="UCR, Medicare %, R&C" className={inputClass} />
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                Save Benefits
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Estimates */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Cost Estimates</h3>
          <button
            onClick={handleGenerateEstimate}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            <DollarSign size={14} /> Generate Estimate
          </button>
        </div>
        {ticket.estimates?.length > 0 ? (
          <>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-gray-500 text-xs">
                  <th className="pb-2">Charge</th>
                  <th className="pb-2">Reimbursement (Est.)</th>
                  <th className="pb-2">Out-of-Pocket (Est.)</th>
                  <th className="pb-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {ticket.estimates.map((est) => (
                  <tr key={est.id}>
                    <td>${est.charge_amount}</td>
                    <td>${est.reimbursement_low} – ${est.reimbursement_high}</td>
                    <td>${est.oop_low} – ${est.oop_high}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        est.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        est.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{est.confidence}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Send to patient */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleSendToPatient}
                  disabled={sending || sent || !hasEstimate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sent ? <CheckCheck size={14} /> : <Send size={14} />}
                  {sending ? 'Sending…' : sent ? 'Sent to patient' : 'Send to Patient'}
                </button>
                {shareLink && (
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                )}
              </div>
              {sent && (
                <p className="text-xs text-gray-400 mt-2">
                  {ticket.patient_phone && ticket.patient_email
                    ? 'SMS and email sent to patient.'
                    : ticket.patient_phone
                    ? 'SMS sent to patient.'
                    : ticket.patient_email
                    ? 'Email sent to patient.'
                    : 'Link generated — copy and share manually.'}
                </p>
              )}
            </div>
          </>
        ) : <p className="text-sm text-gray-400">No estimates yet. Add benefits data first, then generate.</p>}
      </div>
    </div>
  );
}
