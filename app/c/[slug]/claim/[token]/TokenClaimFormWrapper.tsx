'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import BannerPreview from '../../BannerPreview';
import TokenClaimForm from './TokenClaimForm';

interface Campaign {
  id: string;
  slug: string;
  title: string;
  require_email: boolean;
  require_email_verification: boolean;
  require_invite_code: boolean;
  collect_company: boolean;
  collect_phone: boolean;
  collect_title: boolean;
  test_mode: boolean;
  contact_email: string | null;
}

interface PrefilledData {
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  address1: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  address2: string | null;
}

interface PageContent {
  showLogo: boolean;
  title: string;
  description: string | null;
  showBanner: boolean;
  bannerUrl: string | null;
  privacyBlurb: string | null;
  contactEmail: string | null;
  contactText: string | null;
}

interface GifterInfo {
  name: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  bio: string | null;
}

interface Props {
  campaign: Campaign;
  prefilledData: PrefilledData;
  claimToken: string;
  pageContent: PageContent;
  gifterInfo?: GifterInfo | null;
  giftNote?: string | null;
}

export default function TokenClaimFormWrapper({ campaign, prefilledData, claimToken, pageContent, gifterInfo, giftNote }: Props) {
  const [success, setSuccess] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);

  // Success state - clean confirmation screen
  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
        {pageContent.showLogo && (
          <div className="mb-6 flex justify-center">
            <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-12 w-auto" />
          </div>
        )}

        <div className="text-center py-8">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted!</h2>
          {requiresVerification ? (
            <p className="text-gray-600">
              Please check your email to verify your claim. The verification link will expire in 24 hours.
            </p>
          ) : (
            <p className="text-gray-600">
              Your claim has been confirmed. Thank you!
            </p>
          )}

          {gifterInfo && (
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
              <p className="text-purple-900 font-semibold">
                A gift from {gifterInfo.name}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {gifterInfo.linkedinUrl && (
                  <a
                    href={gifterInfo.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 text-sm hover:underline"
                  >
                    LinkedIn &rarr;
                  </a>
                )}
                {gifterInfo.email && (
                  <a
                    href={`mailto:${gifterInfo.email}`}
                    className="text-purple-700 text-sm hover:underline"
                  >
                    {gifterInfo.email}
                  </a>
                )}
                {gifterInfo.phone && (
                  <a
                    href={`tel:${gifterInfo.phone}`}
                    className="text-purple-700 text-sm hover:underline"
                  >
                    {gifterInfo.phone}
                  </a>
                )}
              </div>
              {giftNote && (
                <p className="text-purple-800 mt-2 italic">&ldquo;{giftNote}&rdquo;</p>
              )}
            </div>
          )}

          {pageContent.contactEmail && (
            <p className="text-gray-600 text-sm mt-6">
              {pageContent.contactText || 'If you have any questions, please email'}{' '}
              <a
                href={`mailto:${pageContent.contactEmail}`}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                {pageContent.contactEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Form state - show full page content
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
      {pageContent.showLogo && (
        <div className="mb-6 flex justify-center">
          <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-12 w-auto" />
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">{pageContent.title}</h1>
      {pageContent.description && (
        <div className="text-gray-700 mb-6 prose prose-base sm:prose-lg max-w-none">
          <ReactMarkdown>{pageContent.description}</ReactMarkdown>
        </div>
      )}

      {gifterInfo && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-5">
          <p className="text-purple-900 font-semibold text-lg">
            A gift from {gifterInfo.name}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {gifterInfo.linkedinUrl && (
              <a
                href={gifterInfo.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 text-sm hover:underline"
              >
                Connect on LinkedIn &rarr;
              </a>
            )}
            {gifterInfo.email && (
              <a
                href={`mailto:${gifterInfo.email}`}
                className="text-purple-700 text-sm hover:underline"
              >
                {gifterInfo.email}
              </a>
            )}
            {gifterInfo.phone && (
              <a
                href={`tel:${gifterInfo.phone}`}
                className="text-purple-700 text-sm hover:underline"
              >
                {gifterInfo.phone}
              </a>
            )}
          </div>
          {gifterInfo.bio && (
            <p className="text-purple-800 text-sm mt-2">{gifterInfo.bio}</p>
          )}
          {giftNote && (
            <p className="text-purple-800 mt-3 italic border-t border-purple-200 pt-3">
              &ldquo;{giftNote}&rdquo;
            </p>
          )}
        </div>
      )}


      {pageContent.showBanner && pageContent.bannerUrl && (
        <div className="mb-6">
          <BannerPreview url={pageContent.bannerUrl} />
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
        <h3 className="text-green-900 font-bold text-lg mb-2">Privacy Promise</h3>
        <p className="text-green-800 text-base font-medium">
          {pageContent.privacyBlurb ||
            "We only use your address to ship the book. We won't sell your information."}
        </p>
      </div>

      {pageContent.contactEmail && (
        <p className="text-gray-700 text-base mb-6">
          {pageContent.contactText || 'If you have any questions, please email'}{' '}
          <a
            href={`mailto:${pageContent.contactEmail}`}
            className="text-blue-600 hover:text-blue-700 underline font-medium"
          >
            {pageContent.contactEmail}
          </a>
        </p>
      )}

      <TokenClaimForm
        campaign={campaign}
        prefilledData={prefilledData}
        claimToken={claimToken}
        onSuccess={(needsVerification) => {
          setSuccess(true);
          setRequiresVerification(needsVerification);
        }}
      />
    </div>
  );
}
