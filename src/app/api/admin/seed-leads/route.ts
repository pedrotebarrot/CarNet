/**
 * Admin-only: seeds realistic test leads for a given dealership.
 * GET /api/admin/seed-leads?dealershipId=...
 *
 * Creates 4 leads spanning all the UX states the page needs to render:
 *   - OLX VIS lead (WhatsApp request)
 *   - ML VIS lead (phone call request)
 *   - ML Question (with inline reply UI)
 *   - Already-contacted lead (to test the "contacted" tab)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');
  if (!dealershipId) return NextResponse.json({ error: 'dealershipId required' }, { status: 400 });

  const db = getAdminDb();

  // Pick the first available vehicle to attach a couple of leads to
  const vSnap = await db.collection('vehicles')
    .where('dealershipId', '==', dealershipId)
    .where('status', '==', 'available')
    .limit(1)
    .get();
  const vehicleId = vSnap.empty ? null : vSnap.docs[0].id;
  const vehicle   = vSnap.empty ? null : vSnap.docs[0].data();
  const vehicleTitle = vehicle ? `${vehicle.make} ${vehicle.model}` : 'veículo';

  const now = Date.now();
  const minutes = (m: number) => new Date(now - m * 60_000);

  const leads = [
    {
      dealershipId,
      vehicleId,
      source:      'olx',
      sourceKind:  'vis_lead',
      name:        'Carlos Oliveira',
      email:       'carlos.oliveira@gmail.com',
      phone:       '5543991234567',
      message:     `Olá! Tenho interesse no ${vehicleTitle}. Ainda está disponível? Posso ir ver hoje à tarde?`,
      status:      'new',
      receivedAt:  minutes(8),
      olxAdId:     'TEST-OLX-001',
    },
    {
      dealershipId,
      vehicleId,
      source:      'mercadolivre',
      sourceKind:  'vis_lead',
      name:        'Mariana Souza',
      email:       'mariana.souza@hotmail.com',
      phone:       '5511987654321',
      message:     `Pode me ligar quando puder? Quero saber se aceita troca no meu Onix 2020.`,
      status:      'new',
      receivedAt:  minutes(45),
      mlLeadId:    'TEST-ML-VIS-001',
      mlItemId:    'MLB-TEST-001',
    },
    {
      dealershipId,
      vehicleId,
      source:      'mercadolivre',
      sourceKind:  'question',
      name:        'rafael.92',  // ML question style: nickname only
      email:       null,
      phone:       null,
      message:     'Esse carro tem revisões na concessionária? Quantos donos teve até agora?',
      status:      'new',
      receivedAt:  minutes(120),
      mlQuestionId: '99999000001',
      mlItemId:    'MLB-TEST-002',
    },
    {
      dealershipId,
      vehicleId:   null,
      source:      'olx',
      sourceKind:  'vis_lead',
      name:        'Patrícia Lima',
      email:       'patricia.lima@outlook.com',
      phone:       '5543988887777',
      message:     'Já passei aí ontem e fechamos o negócio. Obrigada!',
      status:      'contacted',
      receivedAt:  minutes(60 * 24),
      contactedAt: minutes(60 * 20),
      olxAdId:     'TEST-OLX-002',
    },
  ];

  const ids: string[] = [];
  for (const lead of leads) {
    const ref = await db.collection('leads').add(lead);
    ids.push(ref.id);
  }

  return NextResponse.json({
    ok: true,
    seeded: leads.length,
    leadIds: ids,
    vehicleUsed: vehicleId,
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');
  if (!dealershipId) return NextResponse.json({ error: 'dealershipId required' }, { status: 400 });

  const db = getAdminDb();
  // Remove only seeded test leads
  const snap = await db.collection('leads')
    .where('dealershipId', '==', dealershipId)
    .get();

  let deleted = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.olxAdId?.startsWith('TEST-') || data.mlLeadId?.startsWith('TEST-') || data.mlQuestionId === '99999000001') {
      await d.ref.delete();
      deleted++;
    }
  }

  return NextResponse.json({ ok: true, deleted });
}
