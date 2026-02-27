import { NextRequest } from 'next/server';
import { requireAuth, authError } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const headers = [
      'societe',
      'gerant',
      'email',
      'telephone',
      'siret',
      'adresse',
      'ville',
      'code_postal',
      'contrat',
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths for better readability
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_clients.xlsx"',
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/clients/template error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
