'use client';

interface Props {
  content: string;
  className?: string;
}

/**
 * Renders HTML content from the rich text editor.
 * Falls back to plain text if content doesn't look like HTML.
 */
export default function RichContent({ content, className = '' }: Props) {
  if (!content) return null;

  // Check if content looks like HTML (has tags)
  const isHtml = /<[^>]+>/.test(content);

  if (isHtml) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Plain text fallback - convert markdown-style bold to HTML for backwards compatibility
  const processed = content
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processed }}
    />
  );
}
