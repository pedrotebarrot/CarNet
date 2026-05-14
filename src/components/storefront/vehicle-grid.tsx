'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Gauge, Fuel, Settings2, CalendarDays, Search, ArrowUpDown } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  modelYear: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  plateEnding: string;
  images?: string[];
}

interface VehicleGridProps {
  vehicles: Vehicle[];
  dealershipSlug: string;
  whatsappBase: string | null;
}

// ── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'default',     label: 'Padrão' },
  { value: 'price_asc',   label: 'Menor preço' },
  { value: 'price_desc',  label: 'Maior preço' },
  { value: 'year_desc',   label: 'Mais novo' },
  { value: 'year_asc',    label: 'Mais antigo' },
  { value: 'mileage_asc', label: 'Menor km' },
  { value: 'mileage_desc',label: 'Maior km' },
  { value: 'name_asc',    label: 'A → Z' },
  { value: 'name_desc',   label: 'Z → A' },
];

function sortVehicles(vehicles: Vehicle[], sort: string): Vehicle[] {
  const v = [...vehicles];
  switch (sort) {
    case 'price_asc':    return v.sort((a, b) => a.price - b.price);
    case 'price_desc':   return v.sort((a, b) => b.price - a.price);
    case 'year_desc':    return v.sort((a, b) => b.modelYear - a.modelYear || b.year - a.year);
    case 'year_asc':     return v.sort((a, b) => a.modelYear - b.modelYear || a.year - b.year);
    case 'mileage_asc':  return v.sort((a, b) => a.mileage - b.mileage);
    case 'mileage_desc': return v.sort((a, b) => b.mileage - a.mileage);
    case 'name_asc':     return v.sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`));
    case 'name_desc':    return v.sort((a, b) => `${b.make} ${b.model}`.localeCompare(`${a.make} ${a.model}`));
    default:             return v;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatMileage(km: number) {
  return new Intl.NumberFormat('pt-BR').format(km);
}

// ── Component ────────────────────────────────────────────────────────────────

export function VehicleGrid({ vehicles, dealershipSlug, whatsappBase }: VehicleGridProps) {
  const [sort,   setSort]   = useState('default');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = term
      ? vehicles.filter(v =>
          `${v.make} ${v.model}`.toLowerCase().includes(term) ||
          v.make.toLowerCase().includes(term) ||
          v.model.toLowerCase().includes(term)
        )
      : vehicles;
    return sortVehicles(base, sort);
  }, [vehicles, sort, search]);

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-headline font-semibold text-2xl" style={{ color: '#0b1c30' }}>
            Estoque disponível
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#45464d' }}>
            {filtered.length}{search ? ` resultado${filtered.length !== 1 ? 's' : ''} para "${search}"` : ` veículo${filtered.length !== 1 ? 's' : ''} disponível${filtered.length !== 1 ? 'is' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#45464d' }} />
            <input
              type="text"
              placeholder="Buscar marca ou modelo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded border pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3980f4]/30"
              style={{ borderColor: '#e5eeff', backgroundColor: '#fff', color: '#0b1c30' }}
            />
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#45464d' }} />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none rounded border pl-8 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3980f4]/30 cursor-pointer"
              style={{ borderColor: '#e5eeff', backgroundColor: '#fff', color: '#0b1c30' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-lg border" style={{ borderColor: '#e5eeff' }}>
          {search ? (
            <>
              <p className="font-headline font-semibold text-lg" style={{ color: '#0b1c30' }}>
                Nenhum veículo encontrado
              </p>
              <p className="text-sm mt-2" style={{ color: '#45464d' }}>
                Tente buscar por outro modelo ou{' '}
                <button onClick={() => setSearch('')} className="underline" style={{ color: '#3980f4' }}>
                  limpar a busca
                </button>
              </p>
            </>
          ) : (
            <>
              <p className="font-headline font-semibold text-lg" style={{ color: '#0b1c30' }}>Estoque sendo atualizado</p>
              <p className="text-sm mt-2" style={{ color: '#45464d' }}>Volte em breve para conferir nossos veículos.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((vehicle) => (
            <div
              key={vehicle.id}
              className="group relative flex flex-col bg-white rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-md"
              style={{ borderColor: '#e5eeff' }}
            >
              {/* Invisible full-card link */}
              <Link
                href={`/${dealershipSlug}/${vehicle.id}`}
                className="absolute inset-0 z-0"
                aria-label={`Ver ${vehicle.make} ${vehicle.model}`}
              />

              {/* Image */}
              <div className="aspect-video relative overflow-hidden bg-[#e5eeff]">
                {vehicle.images?.[0] ? (
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: '#45464d' }}>
                    <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17l-2-2m0 0l-2-2m2 2l2-2m0 0l2-2M3 9l1-4h16l1 4M3 9h18M5 9v8a2 2 0 002 2h10a2 2 0 002-2V9" />
                    </svg>
                  </div>
                )}
                <span
                  className="absolute top-2 right-2 font-mono text-[10px] font-medium px-2 py-1 rounded-sm uppercase tracking-wider"
                  style={{ backgroundColor: '#131b2e', color: '#f8f9ff' }}
                >
                  {vehicle.year}/{vehicle.modelYear}
                </span>
              </div>

              {/* Body */}
              <div className="relative z-10 pointer-events-none flex flex-col flex-1 p-4 gap-3">
                <div>
                  <p className="font-headline font-semibold text-base leading-snug" style={{ color: '#0b1c30' }}>
                    {vehicle.make} {vehicle.model}
                  </p>
                  <p className="font-headline font-bold text-xl mt-1" style={{ color: '#0b1c30' }}>
                    {formatPrice(vehicle.price)}
                  </p>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 shrink-0" style={{ color: '#3980f4' }} />
                    <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: '#45464d' }}>
                      {formatMileage(vehicle.mileage)} km
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 shrink-0" style={{ color: '#3980f4' }} />
                    <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: '#45464d' }}>
                      {vehicle.fuel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#3980f4' }} />
                    <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: '#45464d' }}>
                      {vehicle.transmission}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" style={{ color: '#3980f4' }} />
                    <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: '#45464d' }}>
                      Final {vehicle.plateEnding}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                {whatsappBase && (
                  <a
                    href={`${whatsappBase}?text=${encodeURIComponent(`Olá! Vi o anúncio do ${vehicle.make} ${vehicle.model} no site e gostaria de mais informações.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 pointer-events-auto mt-auto w-full text-center py-2.5 rounded font-semibold text-white text-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#006d2f' }}
                  >
                    Tenho Interesse
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
