'use server';

import { getAdminDb } from '@/firebase/admin';
import { getValidToken } from '@/actions/mercadolivre';

/**
 * Posts an answer to a Mercado Livre question.
 * Marks the corresponding /leads doc as contacted on success.
 */
export async function answerMLQuestion(
  leadId:       string,
  dealershipId: string,
  questionId:   string,
  text:         string,
): Promise<{ success: boolean; error?: string }> {
  if (!text.trim()) return { success: false, error: 'Resposta vazia.' };

  const token = await getValidToken(dealershipId);
  if (!token) return { success: false, error: 'ML não conectado.' };

  const res = await fetch('https://api.mercadolibre.com/answers', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question_id: Number(questionId),
      text:        text.trim(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: `HTTP ${res.status}: ${err.slice(0, 200)}` };
  }

  const db = getAdminDb();
  await db.doc(`leads/${leadId}`).update({
    status:        'contacted',
    contactedAt:   new Date(),
    answer:        text.trim(),
  });

  return { success: true };
}
