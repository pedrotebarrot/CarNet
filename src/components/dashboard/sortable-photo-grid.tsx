'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Upload, X } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export interface PhotoItem {
  id: string;
  src: string;
}

interface SortablePhotoProps {
  item: PhotoItem;
  index: number;
  onRemove: (id: string) => void;
}

function SortablePhoto({ item, index, onRemove }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
    >
      <img src={item.src} alt="Veículo" className="object-cover w-full h-full select-none" draggable={false} />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 rounded bg-black/50 cursor-grab active:cursor-grabbing text-white opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
        title="Remover foto"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Cover badge */}
      {index === 0 && (
        <div
          className="absolute bottom-2 left-2 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded pointer-events-none"
          style={{ backgroundColor: '#3980f4', color: '#fff' }}
        >
          ★ Capa
        </div>
      )}
    </div>
  );
}

interface SortablePhotoGridProps {
  items: PhotoItem[];
  onChange: (items: PhotoItem[]) => void;
  onAddMore?: (files: FileList) => void;
  isUploading?: boolean;
  uploadProgress?: string;
  accept?: string;
}

export function SortablePhotoGrid({
  items,
  onChange,
  onAddMore,
  isUploading,
  uploadProgress,
  accept = 'image/jpeg,image/png,image/webp,image/heic',
}: SortablePhotoGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  }, [items, onChange]);

  const handleRemove = useCallback((id: string) => {
    onChange(items.filter(i => i.id !== id));
  }, [items, onChange]);

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: '#45464d' }}>
        A <strong style={{ color: '#0b1c30' }}>1ª foto</strong> é a capa. <strong style={{ color: '#0b1c30' }}>Arraste</strong> para reordenar.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item, index) => (
              <SortablePhoto key={item.id} item={item} index={index} onRemove={handleRemove} />
            ))}

            {onAddMore && (
              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Adicionar</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept={accept}
                  className="hidden"
                  onChange={e => e.target.files && onAddMore(e.target.files)}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {uploadProgress && (
        <div className="flex items-center gap-2 text-sm" style={{ color: '#45464d' }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: '#3980f4' }} />
          {uploadProgress}
        </div>
      )}
    </div>
  );
}
