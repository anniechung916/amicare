import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, uploadFile } from '../api/tickets';
import { getCarriers, createCarrier } from '../api/carriers';
import { AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react';

const STEPS = ['Patient Info', 'Insurance', 'Provider & Visit', 'Documents', 'Review'];

export default function IntakePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCarrier, setCustomCarrier] = useState({ name: '', phone: '', notes: '' });
  const [form, setForm] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    patient_dob: '',
    carrier_id: '',
    insurance_company: '',
    insurance_phone: '',
    policy_number: '',
    group_number: '',
    provider_name: '',
    provider_npi: '',
    visit_date: '',
    cpt_codes: '',
    diagnosis_codes: '',
    charge_amount: '',
    notes: '',
  });
  const [files, setFiles] = useState({ card_front: null, card_back: null, superbill: null });
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getCarriers();
        setCarriers(data);
      } catch (e) {
        console.error('Failed to load carriers', e);
      }
    })();
  }, []);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleCarrierSelect = (e) => {
    const carrierId = e.target.value;
    if (carrierId === 'custom') {
      setShowCustomForm(true);
      setSelectedCarrier(null);
      setForm({ ...form, carrier_id: '', insurance_company: '', insurance_phone: '' });
      return;
    }
    setShowCustomForm(false);
    const carrier = carriers.find((c) => c.id === carrierId);
    setSelectedCarrier(carrier);
    if (carrier) {
      const phone =
        carrier.phone_numbers?.provider_services ||
        carrier.phone_numbers?.oon_benefits_verification ||
        carrier.phone_numbers?.customer_service ||
        '';
      setForm({
        ...form,
        carrier_id: carrier.id,
        insurance_company: carrier.name,
        insurance_phone: phone,
      });
    }
  };

  const handleAddCustomCarrier = async () => {
    try {
      const { data: newCarrier } = await createCarrier({
        name: customCarrier.name,
        phone_numbers: { customer_service: customCarrier.phone, oon_benefits_verification: customCarrier.phone },
        script_notes: customCarrier.notes,
      });
      setCarriers([...carriers, newCarrier]);
      setSelectedCarrier(newCarrier);
      setShowCustomForm(false);
      setForm({
        ...form,
        carrier_id: newCarrier.id,
        insurance_company: newCarrier.name,
        insurance_phone: customCarrier.phone,
      });
      setCustomCarrier({ name: '', phone: '', notes: '' });
    } catch (e) {
      setError('Failed to add carrier. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        carrier_id: form.carrier_id || null,
        cpt_codes: form.cpt_codes ? form.cpt_codes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        diagnosis_codes: form.diagnosis_codes ? form.diagnosis_codes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        charge_amount: form.charge_amount ? parseFloat(form.charge_amount) : null,
        visit_date: form.visit_date || null,
        patient_dob: form.patient_dob || null,
      };
      const { data: ticket } = await createTicket(payload);
      for (const [type, file] of Object.entries(files)) {
        if (file) await uploadFile(ticket.id, file, type);
      }
      navigate(`/tickets/${ticket.id}`);
    } catch (e) {
      console.error('Failed to create ticket', e);
      setError(e.response?.data?.detail || 'Failed to create ticket. Please try again.');
    }
    setSubmitting(false);
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  // Group carriers by category for the dropdown
  const carriersByCategory = carriers.reduce((acc, c) => {
    if (c.carrier_key === 'custom') return acc;
    const cat = c.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Patient Ticket</h1>

      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${
              i === step
                ? 'bg-indigo-600 text-white'
                : i < step
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
              <input value={form.patient_name} onChange={update('patient_name')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.patient_email} onChange={update('patient_email')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.patient_phone} onChange={update('patient_phone')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" value={form.patient_dob} onChange={update('patient_dob')} className={inputClass} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {/* Carrier dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Carrier *</label>
              <select
                value={showCustomForm ? 'custom' : form.carrier_id}
                onChange={handleCarrierSelect}
                className={inputClass}
              >
                <option value="">Select a carrier...</option>
                {Object.entries(carriersByCategory).map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    {items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.display_name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="---">
                  <option value="custom">Other Carrier (Add Custom)</option>
                </optgroup>
              </select>
            </div>

            {/* Custom carrier form */}
            {showCustomForm && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Add Custom Carrier</h4>
                <input
                  placeholder="Carrier name"
                  value={customCarrier.name}
                  onChange={(e) => setCustomCarrier({ ...customCarrier, name: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Phone number"
                  value={customCarrier.phone}
                  onChange={(e) => setCustomCarrier({ ...customCarrier, phone: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Notes (optional)"
                  value={customCarrier.notes}
                  onChange={(e) => setCustomCarrier({ ...customCarrier, notes: e.target.value })}
                  className={inputClass}
                />
                <button
                  onClick={handleAddCustomCarrier}
                  disabled={!customCarrier.name}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Carrier
                </button>
              </div>
            )}

            {/* Carrier info cards */}
            {selectedCarrier && (
              <div className="space-y-3">
                {/* IVR Navigation Tip */}
                {selectedCarrier.ivr_navigation?.benefits_verification && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">IVR Navigation</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          {selectedCarrier.ivr_navigation.benefits_verification}
                        </p>
                        {selectedCarrier.ivr_navigation.notes && (
                          <p className="text-xs text-blue-600 mt-1 italic">
                            {selectedCarrier.ivr_navigation.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Required Info Checklist */}
                {selectedCarrier.required_info?.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800">Required Info</h4>
                        <ul className="mt-1 space-y-0.5">
                          {selectedCarrier.required_info.map((item, i) => (
                            <li key={i} className="text-xs text-green-700">
                              - {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hold Time */}
                {selectedCarrier.avg_hold_time_minutes && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    Avg. hold time: ~{selectedCarrier.avg_hold_time_minutes} min
                  </div>
                )}

                {/* Special Considerations Warning */}
                {selectedCarrier.special_considerations && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800">Important</h4>
                        <p className="text-xs text-amber-700 mt-1">
                          {selectedCarrier.special_considerations}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Script Notes */}
                {selectedCarrier.script_notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700">Script Notes</h4>
                    <p className="text-xs text-gray-600 mt-1">{selectedCarrier.script_notes}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Provider Services Line
              </label>
              <input
                type="tel"
                value={form.insurance_phone}
                onChange={update('insurance_phone')}
                className={inputClass}
                placeholder={selectedCarrier ? 'Auto-filled from carrier' : 'Provider services phone number'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Policy / Member ID
              </label>
              <input value={form.policy_number} onChange={update('policy_number')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
              <input value={form.group_number} onChange={update('group_number')} className={inputClass} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
              <input value={form.provider_name} onChange={update('provider_name')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider NPI</label>
              <input value={form.provider_npi} onChange={update('provider_npi')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
              <input type="date" value={form.visit_date} onChange={update('visit_date')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPT Codes (comma-separated)
              </label>
              <input
                value={form.cpt_codes}
                onChange={update('cpt_codes')}
                placeholder="99213, 99214"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Codes / ICD-10 (comma-separated)
              </label>
              <input
                value={form.diagnosis_codes}
                onChange={update('diagnosis_codes')}
                placeholder="M54.5, Z12.11"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charge Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.charge_amount}
                onChange={update('charge_amount')}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Card (Front)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFiles({ ...files, card_front: e.target.files[0] })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Card (Back)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFiles({ ...files, card_back: e.target.files[0] })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Superbill / Receipt
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFiles({ ...files, superbill: e.target.files[0] })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={3} value={form.notes} onChange={update('notes')} className={inputClass} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Review Your Submission</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Patient:</span> {form.patient_name}
              </div>
              <div>
                <span className="text-gray-500">Email:</span> {form.patient_email || '-'}
              </div>
              <div>
                <span className="text-gray-500">Phone:</span> {form.patient_phone || '-'}
              </div>
              <div>
                <span className="text-gray-500">DOB:</span> {form.patient_dob || '-'}
              </div>
              <div>
                <span className="text-gray-500">Insurance:</span> {form.insurance_company}
              </div>
              <div>
                <span className="text-gray-500">Ins. Phone:</span> {form.insurance_phone || '-'}
              </div>
              <div>
                <span className="text-gray-500">Policy #:</span> {form.policy_number || '-'}
              </div>
              <div>
                <span className="text-gray-500">Group #:</span> {form.group_number || '-'}
              </div>
              <div>
                <span className="text-gray-500">Provider:</span> {form.provider_name || '-'}
              </div>
              <div>
                <span className="text-gray-500">NPI:</span> {form.provider_npi || '-'}
              </div>
              <div>
                <span className="text-gray-500">Visit Date:</span> {form.visit_date || '-'}
              </div>
              <div>
                <span className="text-gray-500">CPT Codes:</span> {form.cpt_codes || '-'}
              </div>
              <div>
                <span className="text-gray-500">Diagnosis:</span> {form.diagnosis_codes || '-'}
              </div>
              <div>
                <span className="text-gray-500">Charge:</span>{' '}
                {form.charge_amount ? `$${form.charge_amount}` : '-'}
              </div>
              <div>
                <span className="text-gray-500">Files:</span>{' '}
                {Object.values(files).filter(Boolean).length} uploaded
              </div>
            </div>
            {form.notes && (
              <div className="text-sm">
                <span className="text-gray-500">Notes:</span> {form.notes}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && !form.patient_name) ||
                (step === 1 && !form.insurance_company)
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
