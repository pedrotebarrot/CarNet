import Image from "next/image";
import type { Vehicle } from "@/lib/data";
import { Logo } from "@/components/logo";

export function PostPreview({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="relative h-full w-full">
            <Image
                src={vehicle.featuredImage}
                alt={`Preview for ${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover"
                data-ai-hint="car"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            <div className="absolute top-4 left-4 p-2 bg-black/50 rounded-lg">
                <Logo className="h-8 w-8 text-white"/>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h3>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-semibold bg-accent text-accent-foreground px-3 py-1 rounded-md">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(vehicle.price)}</p>
                    <p className="text-sm">{vehicle.year} &bull; {new Intl.NumberFormat('pt-BR').format(vehicle.mileage)} km</p>
                </div>
            </div>
        </div>
    </div>
  )
}
