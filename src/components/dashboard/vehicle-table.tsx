'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, Sparkles, Edit, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Vehicle } from '@/lib/data';

const statusVariant = {
  available: 'default',
  sold: 'destructive',
  unavailable: 'secondary',
} as const;

const statusText = {
  available: 'Disponível',
  sold: 'Vendido',
  unavailable: 'Indisponível',
};

type SortConfig = {
  key: keyof Vehicle | 'make_model';
  direction: 'asc' | 'desc';
} | null;

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(vehicles.map((v) => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((prevId) => prevId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} veículo(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = selectedIds.map((id) => 
        deleteDoc(doc(firestore, 'vehicles', id))
      );
      await Promise.all(deletePromises);
      
      toast({
        title: "Sucesso",
        description: `${selectedIds.length} veículo(s) excluído(s) com sucesso.`,
      });
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (key: SortConfig['key']) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />;
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const sortedVehicles = useMemo(() => {
    let sortableItems = [...vehicles];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        
        if (sortConfig.key === 'make_model') {
          const aName = `${a.make} ${a.model}`.toLowerCase();
          const bName = `${b.make} ${b.model}`.toLowerCase();
          return aName.localeCompare(bName) * direction;
        }
        
        const aVal = a[sortConfig.key as keyof Vehicle];
        const bVal = b[sortConfig.key as keyof Vehicle];
        
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });
    }
    return sortableItems;
  }, [vehicles, sortConfig]);

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">
            {selectedIds.length} selecionado(s)
          </span>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Excluir Selecionados
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox 
                checked={vehicles.length > 0 && selectedIds.length === vehicles.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="hidden w-[100px] sm:table-cell">
              <span className="sr-only">Image</span>
            </TableHead>
            <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('make_model')}>
              <div className="flex items-center">
                Veículo <SortIcon columnKey="make_model" />
              </div>
            </TableHead>
            <TableHead>Detalhes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('price')}>
              <div className="flex items-center">
                Preço <SortIcon columnKey="price" />
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('mileage')}>
              <div className="flex items-center">
                Quilometragem <SortIcon columnKey="mileage" />
              </div>
            </TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedVehicles.map((vehicle) => (
            <TableRow key={vehicle.id} data-state={selectedIds.includes(vehicle.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox 
                  checked={selectedIds.includes(vehicle.id)}
                  onCheckedChange={(checked) => handleSelectOne(checked as boolean, vehicle.id)}
                  aria-label={`Selecionar ${vehicle.make} ${vehicle.model}`}
                />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Image
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="aspect-square rounded-md object-cover"
                  height="64"
                  src={vehicle.featuredImage || vehicle.images?.[0] || '/placeholder.png'}
                  width="64"
                  data-ai-hint="car"
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className='font-bold'>{`${vehicle.make} ${vehicle.model}`}</div>
                <div className='text-xs text-muted-foreground'>{`${vehicle.year}/${vehicle.modelYear}`}</div>
                <div className='text-xs text-muted-foreground font-mono mt-1 flex items-center gap-2'>
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded border">{vehicle.plate}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <div>{vehicle.fuel}</div>
                <div>{vehicle.color} - {vehicle.doors}P</div>
                <div>{vehicle.transmission}</div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[vehicle.status as keyof typeof statusVariant]}>{statusText[vehicle.status as keyof typeof statusText]}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  vehicle.price / 100
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {new Intl.NumberFormat('pt-BR').format(vehicle.mileage)} km
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/vehicles/${vehicle.id}#generate-content`}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Conteúdo
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
