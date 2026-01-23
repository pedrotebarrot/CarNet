'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function AddVehicleForm() {
  return (
    <form className="grid gap-6 py-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="make">Marca</Label>
          <Input id="make" placeholder="ex: Volkswagen" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" placeholder="ex: Golf" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" type="number" placeholder="ex: 2021" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mileage">Quilometragem</Label>
          <Input id="mileage" type="number" placeholder="ex: 15000" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Preço (R$)</Label>
        <Input id="price" type="number" placeholder="ex: 120000" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva os principais pontos do veículo..."
          className="min-h-[120px]"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select defaultValue="available">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="sold">Vendido</SelectItem>
            <SelectItem value="unavailable">Indisponível</SelectItem>
          </SelectContent>
        </Select>
      </div>
       <div className="grid gap-2">
          <Label htmlFor="images">Fotos</Label>
          <Input id="images" type="file" multiple />
        </div>
      <Button type="submit">Salvar Veículo</Button>
    </form>
  );
}
