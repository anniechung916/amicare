import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Lock } from 'lucide-react';
import { getCarriers, createCarrier, updateCarrier, deleteCarrier } from '../api/carriers';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

function getPhone(carrier) {
  return (
    carrier.phone_numbers?.oon_benefits_verification ||
    carrier.phone_numbers?.customer_service ||
    ''
  );
}

export default function SettingsPage() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCarrier, setNewCarrier] = useState({ name: '', phone: '' });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCarriers = async () => {
    try {
      const { data } = await getCarriers({ active_only: false });
      setCarriers(data);
    } catch (e) {
      console.error('Failed to load carriers', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCarriers(); }, []);

  const handleAdd = async () => {
    if (!newCarrier.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createCarrier({
        name: newCarrier.name.trim(),
        display_name: newCarrier.name.trim(),
        category: 'Custom',
        phone_numbers: {
          customer_service: newCarrier.phone.trim(),
          oon_benefits_verification: newCarrier.phone.trim(),
        },
      });
      setNewCarrier({ name: '', phone: '' });
      setShowAdd(false);
      await fetchCarriers();
    } catch (e) {
      setError('Failed to add carrier. Please try again.');
    }
    setSaving(false);
  };

  const startEdit = (carrier) => {
    setEditId(carrier.id);
    setEditData({ name: carrier.name, phone: getPhone(carrier) });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      await updateCarrier(editId, {
        name: editData.name.trim(),
        display_name: editData.name.trim(),
        phone_numbers: {
          customer_service: editData.phone.trim(),
          oon_benefits_verification: editData.phone.trim(),
        },
      });
      setEditId(null);
      await fetchCarriers();
    } catch (e) {
      setError('Failed to save changes. Please try again.');
    }
    setSaving(false);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Remove this carrier?')) return;
    try {
      await deleteCarrier(id);
      await fetchCarriers();
    } catch (e) {
      setError('Failed to remove carrier.');
    }
  };

  const grouped = carriers.reduce((acc, c) => {
    const cat = c.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  const categoryOrder = ['National', 'Regional', 'Regional HMO', 'Network Only', 'Custom', 'Other'];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryOrder.indexOf(a) ?? 99) - (categoryOrder.indexOf(b) ?? 99)
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Insurance Companies Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Insurance Companies</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage carriers and their phone numbers used during intake and calls.
            </p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setError(''); }}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Carrier
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add new carrier form */}
        {showAdd && (
          <div className="mx-6 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-gray-800">New Carrier</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Carrier Name *</label>
                <input
                  placeholder="e.g. Blue Shield of California"
                  value={newCarrier.name}
                  onChange={(e) => setNewCarrier({ ...newCarrier, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone Number</label>
                <input
                  placeholder="e.g. +18005551234"
                  value={newCarrier.phone}
                  onChange={(e) => setNewCarrier({ ...newCarrier, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newCarrier.name.trim() || saving}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check size={14} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewCarrier({ name: '', phone: '' }); }}
                className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedCategories.map((category) => (
              <div key={category}>
                <div className="px-6 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {category}
                </div>
                {grouped[category].map((carrier) => (
                  <div key={carrier.id} className="px-6 py-3 flex items-center gap-4">
                    {editId === carrier.id ? (
                      <>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className={inputClass}
                          />
                          <input
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            placeholder="Phone number"
                            className={inputClass}
                          />
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {carrier.display_name}
                            </span>
                            {!carrier.active && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                inactive
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {getPhone(carrier) || <span className="italic">No phone set</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => startEdit(carrier)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          {carrier.is_custom ? (
                            <button
                              onClick={() => handleDeactivate(carrier.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                              title="Remove"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-gray-200"
                              title="Built-in carriers cannot be removed"
                            >
                              <Lock size={15} />
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
