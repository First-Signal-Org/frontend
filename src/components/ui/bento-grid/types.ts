export type BentoSize = 'xs' | 'small' | 'medium' | 'large' | 'xl'

export interface BentoItem {
  id: string
  type: 'text' | 'url' | 'embed' | 'image'
  title: string
  content: string
  size?: BentoSize
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface BentoGridProps {
  items: BentoItem[]
  onItemsChange: (items: BentoItem[]) => void
  editable?: boolean
  className?: string
  onAddItem?: (newItem: Omit<BentoItem, 'id' | 'layout'>) => void
  showAddModal?: boolean
  setShowAddModal?: (show: boolean) => void
}
