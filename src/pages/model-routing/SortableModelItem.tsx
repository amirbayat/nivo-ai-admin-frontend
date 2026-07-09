import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tag } from 'antd'
import { CloseOutlined, HolderOutlined } from '@ant-design/icons'

export function SortableModelItem({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <span {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', color: '#888' }}>
        <HolderOutlined />
      </span>
      <Tag style={{ margin: 0, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {label}
        <CloseOutlined style={{ cursor: 'pointer', color: '#999' }} onClick={onRemove} />
      </Tag>
    </div>
  )
}
