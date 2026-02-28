'use client';

import { useState } from 'react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  admin_notes: string | null;
  is_lead: boolean;
  campaign_name: string;
  created_at: string;
}

export default function ContactsPage() {
  const [code, setCode] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', company: '', linkedin_url: '', admin_notes: '' });
  const [saving, setSaving] = useState(false);

  const handleAccess = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/contacts?key=${encodeURIComponent(code.trim())}`);
      if (!res.ok) {
        setError('Invalid access code');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setContacts(data.contacts);
      setAccessKey(code.trim());
    } catch {
      setError('Failed to load contacts');
    }
    setLoading(false);
  };

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setEditData({
      title: contact.title || '',
      company: contact.company || '',
      linkedin_url: contact.linkedin_url || '',
      admin_notes: contact.admin_notes || '',
    });
  };

  const handleSave = async (contactId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}?key=${encodeURIComponent(accessKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        setContacts(prev =>
          prev.map(c =>
            c.id === contactId
              ? {
                  ...c,
                  title: editData.title || null,
                  company: editData.company || null,
                  linkedin_url: editData.linkedin_url || null,
                  admin_notes: editData.admin_notes || null,
                }
              : c
          )
        );
        setEditingId(null);
      }
    } catch {
      // silent fail
    }
    setSaving(false);
  };

  const toggleLead = async (contact: Contact) => {
    const newValue = !contact.is_lead;
    // Optimistic update
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_lead: newValue } : c));
    try {
      const res = await fetch(`/api/contacts/${contact.id}?key=${encodeURIComponent(accessKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_lead: newValue }),
      });
      if (!res.ok) {
        // Revert on failure
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_lead: !newValue } : c));
      }
    } catch {
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_lead: !newValue } : c));
    }
  };

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(s) ||
      (c.company || '').toLowerCase().includes(s) ||
      (c.title || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.campaign_name || '').toLowerCase().includes(s)
    );
  });

  const sortByDate = (a: Contact, b: Contact) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const leads = filtered.filter(c => c.is_lead).sort(sortByDate);
  const others = filtered.filter(c => !c.is_lead).sort(sortByDate);

  // Gate view
  if (!accessKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contacts</h1>
          <p className="text-sm text-gray-500 mb-6">Enter access code to continue</p>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAccess()}
            placeholder="Access code"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            autoFocus
          />
          <button
            onClick={handleAccess}
            disabled={loading || !code.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  const renderTable = (items: Contact[], label: string, emptyMsg: string) => (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">{label} ({items.length})</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-2 w-8"></th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Company</th>
            <th className="px-4 py-2">LinkedIn</th>
            <th className="px-4 py-2">Notes</th>
            <th className="px-4 py-2">Campaign</th>
            <th className="px-4 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(contact => (
            <tr
              key={contact.id}
              className={`hover:bg-gray-50 ${editingId === contact.id ? 'bg-blue-50' : ''}`}
            >
              {editingId === contact.id ? (
                <>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleLead(contact)}
                      title={contact.is_lead ? 'Remove from leads' : 'Mark as lead'}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        contact.is_lead
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 text-gray-300 hover:border-green-400'
                      }`}
                    >
                      {contact.is_lead ? '✓' : ''}
                    </button>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {contact.first_name} {contact.last_name}
                    {contact.email && <div className="text-xs text-gray-400 font-normal">{contact.email}</div>}
                  </td>
                  <td className="px-4 py-1">
                    <input
                      type="text"
                      value={editData.title}
                      onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                      placeholder="Role / Title"
                      className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-1">
                    <input
                      type="text"
                      value={editData.company}
                      onChange={e => setEditData(d => ({ ...d, company: e.target.value }))}
                      placeholder="Company"
                      className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-1">
                    <input
                      type="url"
                      value={editData.linkedin_url}
                      onChange={e => setEditData(d => ({ ...d, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-1">
                    <textarea
                      value={editData.admin_notes}
                      onChange={e => setEditData(d => ({ ...d, admin_notes: e.target.value }))}
                      placeholder="Notes..."
                      rows={2}
                      className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{contact.campaign_name}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSave(contact.id)}
                        disabled={saving}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleLead(contact)}
                      title={contact.is_lead ? 'Remove from leads' : 'Mark as lead'}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                        contact.is_lead
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 text-gray-300 hover:border-green-400'
                      }`}
                    >
                      {contact.is_lead ? '✓' : ''}
                    </button>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {contact.first_name} {contact.last_name}
                    {contact.email && <div className="text-xs text-gray-400 font-normal">{contact.email}</div>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{contact.title || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{contact.company || '—'}</td>
                  <td className="px-4 py-2">
                    {contact.linkedin_url ? (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs truncate block max-w-[140px]"
                      >
                        {contact.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs max-w-[180px] truncate">
                    {contact.admin_notes || '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{contact.campaign_name}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 text-xs rounded"
                    >
                      Edit
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">
                {emptyMsg}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500">
              {contacts.length} total &middot; {contacts.filter(c => c.is_lead).length} leads
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, campaign..."
            className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Leads Table */}
        <div className="mb-6">
          {renderTable(leads, 'Potential Leads', search ? 'No leads match your search' : 'No leads yet — click the circle next to a contact to mark them as a lead')}
        </div>

        {/* Other Contacts Table */}
        {renderTable(others, 'All Other Contacts', search ? 'No contacts match your search' : 'No contacts yet')}
      </div>
    </div>
  );
}
