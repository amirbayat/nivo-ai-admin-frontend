import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { Button, Space } from 'antd'
import {
  BoldOutlined, ItalicOutlined, OrderedListOutlined, UnorderedListOutlined,
} from '@ant-design/icons'

interface Props {
  initialValue: string
  onChange: (markdown: string) => void
}

// اولین rich-text editor پروژه — خروجی همیشه Markdown است (نه HTML)، همان چیزی که به
// عنوان system prompt به مدل ربات فروش داده می‌شود (docs/PRD-sales-bot-dashboard.md بخش ۵)
export function ContextEditor({ initialValue, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: initialValue,
    onUpdate: ({ editor }) => {
      onChange((editor.storage as any).markdown.getMarkdown())
    },
  })

  if (!editor) return null

  return (
    <div style={{ border: '1px solid #434343', borderRadius: 8 }}>
      <Space style={{ padding: 8, borderBottom: '1px solid #434343' }} wrap>
        <Button
          size="small"
          icon={<BoldOutlined />}
          type={editor.isActive('bold') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Button
          size="small"
          icon={<ItalicOutlined />}
          type={editor.isActive('italic') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Button
          size="small"
          type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          size="small"
          type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Button
          size="small"
          icon={<UnorderedListOutlined />}
          type={editor.isActive('bulletList') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Button
          size="small"
          icon={<OrderedListOutlined />}
          type={editor.isActive('orderedList') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Button
          size="small"
          type={editor.isActive('blockquote') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </Button>
      </Space>
      <div style={{ padding: 12, minHeight: 360, maxHeight: 560, overflowY: 'auto' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
