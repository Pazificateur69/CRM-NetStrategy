import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError, forbiddenError } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (user.role !== 'admin') {
      return forbiddenError('Only admins can import clients');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ message: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    if (!rows.length) {
      return Response.json({ message: 'No data found in file' }, { status: 400 });
    }

    let count = 0;

    for (const row of rows) {
      const societe = row.societe || row.Societe || row.SOCIETE;
      if (!societe) continue;

      const email = row.email || row.Email || row.EMAIL || '';
      const telephone = row.telephone || row.Telephone || row.TELEPHONE || '';

      await prisma.client.create({
        data: {
          societe: String(societe),
          gerant: row.gerant || row.Gerant || null,
          siret: row.siret || row.Siret || null,
          adresse: row.adresse || row.Adresse || null,
          ville: row.ville || row.Ville || null,
          codePostal: row.code_postal || row.Code_Postal || null,
          emails: email ? [String(email)] : [],
          telephones: telephone ? [String(telephone)] : [],
          contrat: row.contrat || row.Contrat || null,
        },
      });

      count++;
    }

    await logAudit({
      userId: user.id,
      action: 'import',
      model: 'Client',
      newValues: { count },
    });

    return Response.json({
      message: `${count} clients imported`,
      count,
    }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/clients/import error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
