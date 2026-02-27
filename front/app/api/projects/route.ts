import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { projectSchema } from '@/lib/validation/schemas';

const projectIncludes = {
  client: { select: { id: true, societe: true, gerant: true } },
  manager: { select: { id: true, name: true } },
  tasks: true,
};

function formatProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    start_date: p.startDate,
    due_date: p.dueDate,
    budget: p.budget ? Number(p.budget) : null,
    progress: p.progress,
    client_id: p.clientId,
    user_id: p.userId,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    client: p.client ? { id: p.client.id, societe: p.client.societe, gerant: p.client.gerant } : null,
    manager: p.manager ? { id: p.manager.id, name: p.manager.name } : null,
    tasks_count: p.tasks?.length ?? p._count?.tasks ?? 0,
  };
}

const TEMPLATES: Record<string, string[]> = {
  ecommerce: ['Maquette', 'Développement front', 'Développement back', 'Tests', 'Mise en production'],
  seo: ['Audit SEO', 'Recherche mots-clés', 'Optimisation on-page', 'Création de contenu', 'Link building'],
  onboarding: ['Brief client', 'Configuration comptes', 'Formation équipe', 'Lancement'],
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = Number(clientId);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: projectIncludes,
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ data: projects.map(formatProject) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/projects error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: 'Validation error', errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { template, ...projectData } = parsed.data;

    const project = await prisma.project.create({
      data: {
        title: projectData.title,
        description: projectData.description ?? null,
        status: projectData.status,
        startDate: projectData.start_date ? new Date(projectData.start_date) : null,
        dueDate: projectData.due_date ? new Date(projectData.due_date) : null,
        clientId: projectData.client_id ?? null,
        budget: projectData.budget ?? null,
        progress: projectData.progress,
        userId: user.id,
      },
      include: projectIncludes,
    });

    // Create template tasks if template is provided
    if (template && TEMPLATES[template]) {
      const taskNames = TEMPLATES[template];
      await prisma.todo.createMany({
        data: taskNames.map((titre) => ({
          titre,
          statut: 'planifie',
          priorite: 'moyenne',
          pole: user.pole,
          userId: user.id,
          projectId: project.id,
        })),
      });

      // Re-fetch project with tasks
      const projectWithTasks = await prisma.project.findUnique({
        where: { id: project.id },
        include: projectIncludes,
      });

      await logAudit({
        userId: user.id,
        action: 'create',
        model: 'Project',
        modelId: project.id,
        newValues: { title: project.title, template },
      });

      return Response.json({ data: formatProject(projectWithTasks) }, { status: 201 });
    }

    await logAudit({
      userId: user.id,
      action: 'create',
      model: 'Project',
      modelId: project.id,
      newValues: { title: project.title },
    });

    return Response.json({ data: formatProject(project) }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/projects error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
