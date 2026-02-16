'use client';

import { useState, useRef, useEffect } from 'react';

interface Claim {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  linkedin_url: string | null;
  address1: string;
  address2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  status: string;
  pre_created_by: string | null;
  is_test_claim: boolean;
  created_at: string;
  admin_notes: string | null;
}

interface Props {
  campaignId: string;
  capacityTotal: number | null;
  initialClaims: Claim[];
  initialConfirmedCount: number;
}

type SourceFilter = 'all' | 'self' | 'admin';

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'SE', label: 'Sweden' },
  { code: 'NO', label: 'Norway' },
  { code: 'DK', label: 'Denmark' },
  { code: 'IL', label: 'Israel' },
  { code: 'IN', label: 'India' },
  { code: 'JP', label: 'Japan' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'ES', label: 'Spain' },
  { code: 'IT', label: 'Italy' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'IE', label: 'Ireland' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'SG', label: 'Singapore' },
];

const REQUIRED_FIELDS = ['first_name', 'last_name', 'address1', 'city', 'region', 'postal_code', 'country'];

const emptyForm: Record<string, string> = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company: '',
  title: '',
  linkedin_url: '',
  address1: '',
  address2: '',
  city: '',
  region: '',
  postal_code: '',
  country: 'US',
  admin_notes: '',
};

export default function RegisterForm({ campaignId, capacityTotal, initialClaims, initialConfirmedCount }: Props) {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [confirmedCount, setConfirmedCount] = useState(initialConfirmedCount);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>(emptyForm);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Focus first name when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => firstNameRef.current?.focus(), 100);
    }
  }, [showModal]);

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    if (sourceFilter === 'admin') return claim.pre_created_by != null;
    if (sourceFilter === 'self') return claim.pre_created_by == null;
    return true;
  });

  const isFieldMissing = (field: string) => {
    if (!REQUIRED_FIELDS.includes(field)) return false;
    const isEmpty = !formData[field]?.trim();
    return isEmpty && (submitted || touched.has(field));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTouched(prev => new Set(prev).add(e.target.name));
  };

  const getInputClass = (field: string) => {
    const base = "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent text-gray-900";
    if (isFieldMissing(field)) {
      return `${base} border-red-400 focus:ring-red-500 bg-red-50`;
    }
    return `${base} border-gray-300 focus:ring-teal-500`;
  };

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const validateForm = () => {
    const missing = REQUIRED_FIELDS.filter(f => !formData[f]?.trim());
    if (missing.length > 0) {
      setSubmitted(true);
      setError('Please fill in all required fields');
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  // --- Add flow ---
  const submitAdd = async (keepOpen: boolean) => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      const name = `${formData.first_name} ${formData.last_name}`.trim();
      setConfirmedCount(data.totalConfirmed);
      setClaims(prev => [data.claim, ...prev]);

      if (keepOpen) {
        const rememberedCountry = formData.country;
        setFormData({ ...emptyForm, country: rememberedCountry });
        setTouched(new Set());
        setSubmitted(false);
        setSuccessMessage(`Registered ${name} (#${data.totalConfirmed})`);
        setTimeout(() => firstNameRef.current?.focus(), 100);
      } else {
        setFormData(emptyForm);
        setTouched(new Set());
        setSubmitted(false);
        setShowModal(false);
        setSuccessMessage(`Registered ${name} (#${data.totalConfirmed})`);
      }
    } catch (err: any) {
      setError(err.message);
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // --- Edit flow ---
  const submitEdit = async () => {
    if (!validateForm()) return;
    if (!editingClaimId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/claims/${editingClaimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      setClaims(prev =>
        prev.map(c => c.id === editingClaimId ? { ...c, ...formData } as unknown as Claim : c)
      );
      setShowModal(false);
      setSuccessMessage(`Updated ${formData.first_name} ${formData.last_name}`);
    } catch (err: any) {
      setError(err.message);
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'edit') {
      submitEdit();
    } else {
      submitAdd(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingClaimId(null);
    setFormData(emptyForm);
    setTouched(new Set());
    setSubmitted(false);
    setError('');
    setSuccessMessage('');
    setShowModal(true);
  };

  const openEditModal = (claim: Claim) => {
    setModalMode('edit');
    setEditingClaimId(claim.id);
    setFormData({
      first_name: claim.first_name || '',
      last_name: claim.last_name || '',
      email: claim.email || '',
      phone: claim.phone || '',
      company: claim.company || '',
      title: claim.title || '',
      linkedin_url: claim.linkedin_url || '',
      address1: claim.address1 || '',
      address2: claim.address2 || '',
      city: claim.city || '',
      region: claim.region || '',
      postal_code: claim.postal_code || '',
      country: claim.country || 'US',
      admin_notes: claim.admin_notes || '',
    });
    setTouched(new Set());
    setSubmitted(false);
    setError('');
    setSuccessMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const copyLink = () => {
    const url = `${window.location.origin}/admin/campaigns/${campaignId}/register`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this registration?')) return;
    try {
      const res = await fetch(`/api/admin/claims/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      setClaims(prev => prev.filter(c => c.id !== id));
      setConfirmedCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filterBtn = (filter: SourceFilter, label: string) => (
    <button
      type="button"
      onClick={() => setSourceFilter(filter)}
      className={`px-3 py-1 text-xs rounded-full border ${
        sourceFilter === filter
          ? 'bg-teal-600 text-white border-teal-600'
          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Top bar: counter + actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">{confirmedCount}</span>
          {capacityTotal != null && capacityTotal > 0 && (
            <span className="text-sm text-gray-500">/ {capacityTotal}</span>
          )}
          <span className="text-sm text-gray-500">registered</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300"
          >
            {linkCopied ? 'Copied!' : 'Share Link'}
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700"
          >
            + Add Person
          </button>
        </div>
      </div>

      {/* Success message (outside modal) */}
      {successMessage && !showModal && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-800 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Error message (outside modal) */}
      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Source filter */}
      {claims.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Source:</span>
          {filterBtn('all', `All (${claims.length})`)}
          {filterBtn('self', `Self (${claims.filter(c => !c.pre_created_by).length})`)}
          {filterBtn('admin', `Admin (${claims.filter(c => c.pre_created_by).length})`)}
        </div>
      )}

      {/* Claims list */}
      {claims.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No registrations yet</p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700"
          >
            + Add First Person
          </button>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No results for this filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden sm:table-cell">Address</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden md:table-cell">Source</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClaims.map(claim => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">
                      {claim.first_name} {claim.last_name}
                    </div>
                    {claim.email && (
                      <div className="text-xs text-gray-500">{claim.email}</div>
                    )}
                    <div className="text-xs text-gray-400 sm:hidden mt-0.5">
                      {claim.city}, {claim.region}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden sm:table-cell">
                    <div className="truncate max-w-xs">
                      {claim.address1}, {claim.city}, {claim.region} {claim.postal_code}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      claim.pre_created_by
                        ? 'bg-teal-50 text-teal-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {claim.pre_created_by ? 'Admin' : 'Self'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEditModal(claim)}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEntry(claim.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />

          <div ref={modalBodyRef} className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-lg z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === 'edit' ? 'Edit Person' : 'Add Person'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4">
              {successMessage && showModal && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-800 text-sm font-medium">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>First Name *</label>
                    <input
                      ref={firstNameRef}
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClass('first_name')}
                    />
                    {isFieldMissing('first_name') && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Last Name *</label>
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClass('last_name')}
                    />
                    {isFieldMissing('last_name') && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className={labelClass}>Email</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={getInputClass('email')}
                  />
                </div>

                {/* Phone / Company */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={getInputClass('phone')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company</label>
                    <input
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className={getInputClass('company')}
                    />
                  </div>
                </div>

                {/* Title / LinkedIn */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={getInputClass('title')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>LinkedIn URL</label>
                    <input
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      className={getInputClass('linkedin_url')}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Shipping Address</h3>
                </div>

                {/* Address 1 */}
                <div className="mb-3">
                  <label className={labelClass}>Address Line 1 *</label>
                  <input
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass('address1')}
                  />
                  {isFieldMissing('address1') && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>

                {/* Address 2 */}
                <div className="mb-3">
                  <label className={labelClass}>Address Line 2</label>
                  <input
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    className={getInputClass('address2')}
                    placeholder="Apt, suite, etc."
                  />
                </div>

                {/* City / Region */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>City *</label>
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClass('city')}
                    />
                    {isFieldMissing('city') && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                  <div>
                    <label className={labelClass}>State / Region *</label>
                    <input
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClass('region')}
                    />
                    {isFieldMissing('region') && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                </div>

                {/* Postal / Country */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Postal Code *</label>
                    <input
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClass('postal_code')}
                    />
                    {isFieldMissing('postal_code') && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Country *</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={getInputClass('country')}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="mb-4">
                  <label className={labelClass}>Notes (private)</label>
                  <textarea
                    name="admin_notes"
                    value={formData.admin_notes}
                    onChange={handleChange}
                    className={getInputClass('admin_notes')}
                    rows={2}
                    placeholder="Internal notes..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  {modalMode === 'edit' ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 disabled:opacity-50 text-sm"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => submitAdd(true)}
                        className="flex-1 px-4 py-2.5 bg-teal-700 text-white font-medium rounded-md hover:bg-teal-800 disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Saving...' : 'Save & Next'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
