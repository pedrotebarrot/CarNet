'use client';

import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Upload, Loader2, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';

type ParsedVehicle = {
  plate: string;
  make: string;
  model: string;
  year: number;
  modelYear: number;
  color: string;
  doors: number;
  fuel: string;
  transmission: string;
  mileage: number;
  price: number;
  isValid: boolean;
  errors: string[];
};

export function BulkImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedVehicle[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success'>('idle');
  
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userData } = useDoc(userDocRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData([]);
      setImportStatus('idle');
    }
  };

  const processFile = () => {
    if (!file) return;

    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedVehicles: ParsedVehicle[] = results.data.map((row: any) => {
          const errors: string[] = [];
          
          const plate = row.placa?.trim() || row.plate?.trim() || '';
          if (!plate || plate.length !== 7) errors.push('Placa inválida');

          const make = row.marca?.trim() || row.make?.trim() || '';
          if (!make) errors.push('Marca obrigatória');

          const model = row.modelo?.trim() || row.model?.trim() || '';
          if (!model) errors.push('Modelo obrigatório');

          const year = parseInt(row.ano || row.year) || 0;
          if (year < 1900) errors.push('Ano inválido');

          const modelYear = parseInt(row.ano_modelo || row.modelYear || row.ano || row.year) || 0;
          if (modelYear < 1900) errors.push('Ano modelo inválido');

          const color = row.cor?.trim() || row.color?.trim() || 'Não informada';
          const doors = parseInt(row.portas || row.doors) || 4;
          const fuel = row.combustivel?.trim() || row.fuel?.trim() || 'Flex';
          const transmission = row.cambio?.trim() || row.transmission?.trim() || 'Automático';
          
          // Mileage cleanup
          const rawMileage = row.quilometragem || row.km || row.mileage || '0';
          const mileage = parseInt(String(rawMileage).replace(/\D/g, '')) || 0;

          // Price cleanup
          const rawPrice = row.preco || row.price || row.valor || '0';
          let rawStr = String(rawPrice).trim();
          
          if (rawStr.includes(',')) {
            // Se tem vírgula, consideramos como separador decimal (ex: 65.000,00)
            rawStr = rawStr.replace(/\./g, '').replace(',', '.');
          } else {
            // Se não tem vírgula, mas tem ponto, verificamos se o ponto é milhar ou decimal
            const parts = rawStr.split('.');
            if (parts.length > 1 && parts[parts.length - 1].length !== 2) {
              // Ex: 65.000 (3 dígitos após o ponto) -> é milhar, removemos
              rawStr = rawStr.replace(/\./g, '');
            }
          }
          
          const normalizedPrice = rawStr.replace(/[^0-9.]/g, '');
          const price = Math.round(parseFloat(normalizedPrice) * 100) || 0;
          if (price <= 0) errors.push('Preço inválido');

          return {
            plate,
            make,
            model,
            year,
            modelYear,
            color,
            doors,
            fuel,
            transmission,
            mileage,
            price,
            isValid: errors.length === 0,
            errors
          };
        });

        setParsedData(parsedVehicles);
        setIsParsing(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast({ title: "Erro", description: "Falha ao ler o arquivo CSV.", variant: "destructive" });
        setIsParsing(false);
      }
    });
  };

  const handleImport = async () => {
    if (!userData?.dealershipId) {
      toast({ title: "Erro", description: "Revenda não identificada.", variant: "destructive" });
      return;
    }

    const validVehicles = parsedData.filter(v => v.isValid);
    if (validVehicles.length === 0) {
      toast({ title: "Atenção", description: "Nenhum veículo válido para importar." });
      return;
    }

    setIsImporting(true);
    let successCount = 0;

    try {
      for (const vehicle of validVehicles) {
        const plateEnding = vehicle.plate.slice(-1);
        
        await addDoc(collection(firestore, 'vehicles'), {
          plate: vehicle.plate,
          plateEnding: plateEnding,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          modelYear: vehicle.modelYear,
          color: vehicle.color,
          doors: vehicle.doors,
          fuel: vehicle.fuel,
          transmission: vehicle.transmission,
          mileage: vehicle.mileage,
          price: vehicle.price,
          status: 'available',
          description: '',
          images: [], // Images added later
          dealershipId: userData.dealershipId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        successCount++;
      }

      setImportStatus('success');
      toast({ title: "Sucesso!", description: `${successCount} veículos importados com sucesso.` });
    } catch (error: any) {
      console.error("Error importing vehicles:", error);
      toast({ title: "Erro na importação", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  if (importStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h2 className="text-xl font-bold">Importação Concluída</h2>
        <p className="text-muted-foreground text-center">
          Os veículos foram adicionados ao seu estoque. <br/>
          <strong>Lembre-se:</strong> Você precisará editar cada veículo para adicionar as fotos.
        </p>
        <Button onClick={() => { setFile(null); setParsedData([]); setImportStatus('idle'); }}>
          Importar mais
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Dica de formato CSV</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
            const template = 'placa,marca,modelo,ano,ano_modelo,cor,portas,combustivel,cambio,km,preco\nABC1D23,Chevrolet,Onix LT 1.0,2022,2022,Branco,4,Flex,Manual,15000,65000';
            const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'planilha_modelo_veiculos.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}>
            <Download className="h-3 w-3 mr-1" />
            Baixar Modelo
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          A planilha deve ter as seguintes colunas na primeira linha: <br/>
          <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">placa, marca, modelo, ano, ano_modelo, cor, portas, combustivel, cambio, km, preco</code>
        </AlertDescription>
      </Alert>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="csv">Arquivo CSV</Label>
        <div className="flex gap-2">
          <Input id="csv" type="file" accept=".csv" onChange={handleFileChange} />
          <Button type="button" onClick={processFile} disabled={!file || isParsing}>
            {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ler Planilha'}
          </Button>
        </div>
      </div>

      {parsedData.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow key={idx} className={!row.isValid ? "bg-red-50/50" : ""}>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1 text-red-500" title={row.errors.join(', ')}>
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">Erro</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.plate}</TableCell>
                      <TableCell>{row.make} {row.model}</TableCell>
                      <TableCell>{row.year}/{row.modelYear}</TableCell>
                      <TableCell>R$ {(row.price / 100).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-4 border-t flex items-center justify-between bg-muted/30">
              <div className="text-sm">
                <strong>{parsedData.filter(r => r.isValid).length}</strong> válidos,{' '}
                <strong className="text-red-500">{parsedData.filter(r => !r.isValid).length}</strong> com erro.
              </div>
              <Button onClick={handleImport} disabled={isImporting || parsedData.filter(r => r.isValid).length === 0}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Confirmar Importação
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
