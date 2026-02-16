'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import { useEffect, useState } from 'react';

// Custom font size extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ commands }: { commands: any }) => {
        return commands.setMark('textStyle', { fontSize });
      },
      unsetFontSize: () => ({ chain }: { chain: () => any }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    } as any;
  },
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const FONT_SIZES = [
  { label: 'Default', value: '' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
];

export default function RichTextEditor({ value, onChange, placeholder, rows = 3 }: Props) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextStyle,
      FontSize,
    ],
    content: value,
    immediatelyRender: false, // Fix SSR hydration mismatch
    editorProps: {
      attributes: {
        class: `max-w-none focus:outline-none min-h-[${rows * 24}px] p-3 text-gray-900`,
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

  // Close size menu on click outside
  useEffect(() => {
    if (!showSizeMenu) return;
    const handler = () => setShowSizeMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showSizeMenu]);

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

  const setFontSize = (size: string) => {
    editor.chain().focus().run();
    if (size === '') {
      (editor.commands as any).unsetFontSize();
    } else {
      (editor.commands as any).setFontSize(size);
    }
    setShowSizeMenu(false);
  };

  // Get current font size label
  const currentSize = editor.getAttributes('textStyle')?.fontSize;
  const currentLabel = FONT_SIZES.find(s => s.value === currentSize)?.label || 'Size';

  return (
    <div className="relative border border-gray-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 ${
            editor.isActive('bold') ? 'bg-gray-300 font-bold text-gray-900' : ''
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 italic text-gray-700 ${
            editor.isActive('italic') ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 line-through text-gray-700 ${
            editor.isActive('strike') ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Strikethrough"
        >
          S
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowSizeMenu(!showSizeMenu); }}
            className={`px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 flex items-center gap-1 ${
              currentSize ? 'bg-gray-300 text-gray-900' : ''
            }`}
            title="Font Size"
          >
            {currentLabel}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[120px]">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFontSize(size.value); }}
                  className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-700 ${
                    (size.value === '' && !currentSize) || size.value === currentSize ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 ${
            !editor.isActive('heading') ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Normal text"
        >
          Normal
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold text-gray-700 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold text-gray-700 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-semibold text-gray-700 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 ${
            editor.isActive('bulletList') ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 ${
            editor.isActive('orderedList') ? 'bg-gray-300 text-gray-900' : ''
          }`}
          title="Numbered List"
        >
          1. List
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={addLink}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 ${
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
