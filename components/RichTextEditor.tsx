'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, rows = 3 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: value,
    immediatelyRender: false, // Fix SSR hydration mismatch
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[${rows * 24}px] p-3`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="relative border border-gray-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 italic ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 line-through ${
            editor.isActive('strike') ? 'bg-gray-300' : ''
          }`}
          title="Strikethrough"
        >
          S
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-semibold ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="Numbered List"
        >
          1. List
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={addLink}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('link') ? 'bg-gray-300 text-blue-600' : ''
          }`}
          title="Add Link"
        >
          Link
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={removeLink}
            className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-red-600"
            title="Remove Link"
          >
            Unlink
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="bg-white"
          style={{ minHeight: `${rows * 32}px` }}
        />
        {placeholder && !editor.getText().trim() && (
          <div className="absolute top-0 left-0 pointer-events-none text-gray-400 p-3">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
