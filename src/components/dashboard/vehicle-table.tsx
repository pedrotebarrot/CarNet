'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, Sparkles, Edit } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Image</span>
          </TableHead>
          <TableHead>Veículo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Preço</TableHead>
          <TableHead className="hidden md:table-cell">Quilometragem</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => (
          <TableRow key={vehicle.id}>
            <TableCell className="hidden sm:table-cell">
              <Image
                alt={`${vehicle.make} ${vehicle.model}`}
                className="aspect-square rounded-md object-cover"
                height="64"
                src={vehicle.featuredImage}
                width="64"
                data-ai-hint="car"
              />
            </TableCell>
            <TableCell className="font-medium">
              <div className='font-bold'>{`${vehicle.make} ${vehicle.model}`}</div>
              <div className='text-xs text-muted-foreground'>{vehicle.year}</div>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[vehicle.status]}>{statusText[vehicle.status]}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                vehicle.price
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
  );
}
