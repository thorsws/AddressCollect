'use client';

import { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Version {
  id: string;
  version_number: number;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
  change_summary: string | null;
  created_at: string;
  published_at: string | null;
  creator: { id: string; name: string; email: string } | null;
  publisher: { id: string; name: string; email: string } | null;
}

interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
}

interface Props {
  campaignId: string;
  canEdit: boolean;
}

export default function VersionHistory({ campaignId, canEdit }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reverting, setReverting] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [revertConfirm, setRevertConfirm] = useState<{ isOpen: boolean; versionNumber: number }>({ isOpen: false, versionNumber: 0 });
  const [viewingVersion, setViewingVersion] = useState<Version | null>(null);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'settings'>('preview');
  const [bannerOG, setBannerOG] = useState<OGData | null>(null);
  const [loadingOG, setLoadingOG] = useState(false);

  // Check URL params on mount to preserve expanded state after revert/publish
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('section') === 'versions') {
      setExpanded(true);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [campaignId]);

  // Fetch OG data when viewing a version with a banner
  useEffect(() => {
    if (viewingVersion?.data?.show_banner && viewingVersion?.data?.banner_url) {
      setLoadingOG(true);
      setBannerOG(null);
      fetch(`/api/admin/opengraph?url=${encodeURIComponent(String(viewingVersion.data.banner_url))}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setBannerOG(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingOG(false));
    } else {
      setBannerOG(null);
    }
  }, [viewingVersion?.id]);

  async function fetchVersions() {
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/versions`);
      if (!res.ok) throw new Error('Failed to fetch versions');
      const data = await res.json();
      setVersions(data.versions);
      setCurrentVersion(data.currentVersion);
      setHasDraft(data.hasDraft);
    } catch (err) {
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  }

  function handleRevert(versionNumber: number) {
    setRevertConfirm({ isOpen: true, versionNumber });
  }

  async function confirmRevert() {
    const versionNumber = revertConfirm.versionNumber;
    setRevertConfirm({ isOpen: false, versionNumber: 0 });

    setReverting(versionNumber);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_number: versionNumber }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revert');
      }

      // Refresh the page with section param to keep versions expanded
      window.location.href = window.location.pathname + '?section=versions';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revert');
    } finally {
      setReverting(null);
    }
  }

  async function confirmPublishDraft() {
    setPublishConfirm(false);
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/publish-draft`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish draft');
      }

      window.location.href = window.location.pathname + '?section=versions';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish draft');
    } finally {
      setPublishing(false);
    }
  }

  async function confirmDiscardDraft() {
    setDiscardConfirm(false);
    setDiscarding(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/discard-draft`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to discard draft');
      }

      window.location.href = window.location.pathname + '?section=versions';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to discard draft');
    } finally {
      setDiscarding(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-500 text-sm">Loading version history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  const publishedVersions = versions.filter(v => v.status === 'published');
  const draftVersion = versions.find(v => v.status === 'draft');

  return (
    <div className="bg-white rounded-lg shadow">
      <ConfirmDialog
        isOpen={revertConfirm.isOpen}
        title="Revert Campaign"
        message={`Are you sure you want to revert to version ${revertConfirm.versionNumber}? This will replace the current campaign settings.`}
        confirmText="Revert"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmRevert}
        onCancel={() => setRevertConfirm({ isOpen: false, versionNumber: 0 })}
      />

      <ConfirmDialog
        isOpen={publishConfirm}
        title="Publish Draft"
        message="Publish this draft? It will become the current live version of the campaign."
        confirmText="Publish"
        confirmButtonClass="bg-green-600 hover:bg-green-700"
        onConfirm={confirmPublishDraft}
        onCancel={() => setPublishConfirm(false)}
      />

      <ConfirmDialog
        isOpen={discardConfirm}
        title="Discard Draft"
        message="Are you sure you want to discard this draft? All unsaved changes will be lost."
        confirmText="Discard"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDiscardDraft}
        onCancel={() => setDiscardConfirm(false)}
      />

      {/* Version Details Modal */}
      {viewingVersion && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setViewingVersion(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Version {viewingVersion.version_number}
                    {viewingVersion.status === 'draft' && (
                      <span className="ml-2 text-sm text-amber-600">(Draft)</span>
                    )}
                  </h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        viewMode === 'preview'
                          ? 'bg-white shadow text-gray-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode('settings')}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        viewMode === 'settings'
                          ? 'bg-white shadow text-gray-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Settings
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setViewingVersion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                {/* Full Campaign Preview - mimics public page */}
                {viewMode === 'preview' && (
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    {/* Logo */}
                    {viewingVersion.data?.show_logo && (
                      <div className="mb-4 flex justify-center">
                        <img src="/cognitive-kin-logo.svg" alt="Logo" className="h-10 w-auto" />
                      </div>
                    )}

                    {/* Title */}
                    <h2
                      className="text-2xl font-bold text-gray-900 mb-4"
                      dangerouslySetInnerHTML={{ __html: String(viewingVersion.data?.title || 'Untitled') }}
                    />

                    {/* Description */}
                    {viewingVersion.data?.description && (
                      <div
                        className="text-gray-700 mb-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: String(viewingVersion.data.description) }}
                      />
                    )}

                    {/* Deadline */}
                    {viewingVersion.data?.ends_at && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <p className="text-amber-900 font-semibold text-sm">
                          Deadline: {new Date(String(viewingVersion.data.ends_at)).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Scarcity */}
                    {viewingVersion.data?.show_scarcity && Number(viewingVersion.data?.capacity_total) > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-900 font-semibold text-sm">
                          {viewingVersion.data.capacity_total} spots total
                        </p>
                      </div>
                    )}

                    {/* Banner Link Preview */}
                    {viewingVersion.data?.show_banner && viewingVersion.data?.banner_url && (
                      <a
                        href={String(viewingVersion.data.banner_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 hover:bg-indigo-100 transition-colors"
                      >
                        {loadingOG ? (
                          <div className="text-indigo-600 text-sm">Loading preview...</div>
                        ) : bannerOG && bannerOG.title ? (
                          <div className="flex items-start space-x-4">
                            {bannerOG.image && (
                              <div className="flex-shrink-0">
                                <img
                                  src={bannerOG.image}
                                  alt={bannerOG.title}
                                  className="w-24 h-24 object-cover rounded"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {bannerOG.siteName && (
                                <p className="text-xs text-indigo-600 font-medium mb-1 uppercase tracking-wide">
                                  {bannerOG.siteName}
                                </p>
                              )}
                              <h3 className="text-indigo-900 font-semibold mb-1 line-clamp-2">
                                {bannerOG.title}
                              </h3>
                              {bannerOG.description && (
                                <p className="text-indigo-700 text-sm line-clamp-2">
                                  {bannerOG.description}
                                </p>
                              )}
                              <p className="text-indigo-500 text-xs mt-2 flex items-center">
                                <span>Learn more (opens in new tab)</span>
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded flex items-center justify-center">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-indigo-900 font-medium text-sm truncate">
                                {String(viewingVersion.data.banner_url)}
                              </p>
                              <p className="text-indigo-500 text-xs flex items-center mt-1">
                                Opens in new tab
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </p>
                            </div>
                          </div>
                        )}
                      </a>
                    )}

                    {/* Privacy Blurb */}
                    {viewingVersion.data?.show_privacy_blurb !== false && viewingVersion.data?.privacy_blurb && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h3 className="text-green-900 font-bold text-sm mb-1">Privacy Promise</h3>
                        <div
                          className="text-green-800 text-sm"
                          dangerouslySetInnerHTML={{ __html: String(viewingVersion.data.privacy_blurb) }}
                        />
                      </div>
                    )}

                    {/* Contact Info */}
                    {viewingVersion.data?.contact_email && (
                      <p className="text-gray-600 text-sm mb-4">
                        {String(viewingVersion.data?.contact_text || 'Questions?')}{' '}
                        <span className="text-blue-600">{String(viewingVersion.data.contact_email)}</span>
                      </p>
                    )}

                    {/* Form Preview */}
                    <div className="border-t pt-4 mt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-3">Form Fields</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        </div>
                        {viewingVersion.data?.require_email && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        )}
                        {viewingVersion.data?.collect_company && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        )}
                        {viewingVersion.data?.collect_title && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        )}
                        {viewingVersion.data?.collect_phone && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
                          <div className="h-8 bg-gray-100 rounded border border-gray-300 mb-2"></div>
                          <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">State/Province *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Country *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        </div>
                        {viewingVersion.data?.require_invite_code && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Invite Code *</label>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                          </div>
                        )}
                        {viewingVersion.data?.enable_questions && (
                          <div className="bg-purple-50 border border-purple-200 rounded p-3">
                            <p className="text-purple-800 text-xs font-medium">+ Custom Questions</p>
                          </div>
                        )}
                        <div className="flex items-start gap-2 pt-2">
                          <div className="h-4 w-4 border border-gray-300 rounded bg-white mt-0.5"></div>
                          <p className="text-xs text-gray-600">
                            {viewingVersion.data?.consent_text
                              ? String(viewingVersion.data.consent_text).substring(0, 100) + '...'
                              : 'I consent to providing my information...'}
                          </p>
                        </div>
                        <div className="h-10 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-medium">
                          Submit
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* All Settings View */}
                {viewMode === 'settings' && (
                  <div className="space-y-2">
                    {viewingVersion.data && Object.entries(viewingVersion.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-gray-100 pb-2 py-2">
                        <span className="text-gray-600 font-medium">{key.replace(/_/g, ' ')}</span>
                        <span className="text-gray-900 text-right max-w-[60%]">
                          {typeof value === 'boolean' ? (
                            <span className={value ? 'text-green-600' : 'text-gray-400'}>{value ? 'Yes' : 'No'}</span>
                          ) : typeof value === 'object' ? (
                            <code className="text-xs bg-gray-100 px-1 rounded">{JSON.stringify(value)}</code>
                          ) : (
                            String(value) || <span className="text-gray-400">(empty)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                {canEdit && viewingVersion.status === 'draft' && (
                  <>
                    <button
                      onClick={() => {
                        setViewingVersion(null);
                        setDiscardConfirm(true);
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200"
                    >
                      Discard Draft
                    </button>
                    <button
                      onClick={() => {
                        setViewingVersion(null);
                        setPublishConfirm(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
                    >
                      Publish Draft
                    </button>
                  </>
                )}
                {canEdit && viewingVersion.version_number !== currentVersion && viewingVersion.status === 'published' && (
                  <button
                    onClick={() => {
                      setViewingVersion(null);
                      handleRevert(viewingVersion.version_number);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                  >
                    Revert to This Version
                  </button>
                )}
                <button
                  onClick={() => setViewingVersion(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">Version History</h3>
          <span className="text-sm text-gray-500">
            v{currentVersion} {hasDraft && <span className="text-amber-600">(has draft)</span>}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3">
          {draftVersion && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-800 font-medium">Draft (v{draftVersion.version_number})</span>
                  <span className="text-amber-600 text-sm ml-2">
                    by {draftVersion.creator?.name || draftVersion.creator?.email || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 text-xs">
                    {new Date(draftVersion.created_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => setViewingVersion(draftVersion)}
                    className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200"
                  >
                    View
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => setPublishConfirm(true)}
                        disabled={publishing}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {publishing ? 'Publishing...' : 'Publish'}
                      </button>
                      <button
                        onClick={() => setDiscardConfirm(true)}
                        disabled={discarding}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {discarding ? 'Discarding...' : 'Discard'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {draftVersion.change_summary && (
                <p className="text-amber-700 text-sm mt-1">{draftVersion.change_summary}</p>
              )}
            </div>
          )}

          {publishedVersions.length === 0 ? (
            <p className="text-gray-500 text-sm">No version history available.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {publishedVersions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border ${
                    version.version_number === currentVersion
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">v{version.version_number}</span>
                      {version.version_number === currentVersion && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        {version.published_at
                          ? new Date(version.published_at).toLocaleString()
                          : new Date(version.created_at).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setViewingVersion(version)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        View
                      </button>
                      {canEdit && version.version_number !== currentVersion && (
                        <button
                          onClick={() => handleRevert(version.version_number)}
                          disabled={reverting === version.version_number}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          {reverting === version.version_number ? 'Reverting...' : 'Revert'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    by {version.publisher?.name || version.creator?.name || 'Unknown'}
                  </div>
                  {version.change_summary && (
                    <p className="text-gray-700 text-sm mt-1 italic">{version.change_summary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
