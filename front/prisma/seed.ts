import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  { name: 'Admin', email: 'admin@netstrategy.fr', password: 'password123', role: 'admin', pole: 'direction' },
  { name: 'Commercial', email: 'com@netstrategy.fr', password: 'password123', role: 'com', pole: 'com' },
  { name: 'Développeur', email: 'dev@netstrategy.fr', password: 'password123', role: 'dev', pole: 'dev' },
  { name: 'SEO Manager', email: 'seo@netstrategy.fr', password: 'password123', role: 'seo', pole: 'seo' },
  { name: 'Comptable', email: 'compta@netstrategy.fr', password: 'password123', role: 'comptabilite', pole: 'comptabilite' },
];

async function main() {
  console.log('Seeding database...');

  // Create users in Supabase Auth + Prisma
  for (const userData of USERS) {
    // Check if user already exists in Prisma
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      console.log(`User ${userData.email} already exists, skipping.`);
      continue;
    }

    // Create in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (authError) {
      console.error(`Error creating Supabase user ${userData.email}:`, authError.message);
      continue;
    }

    // Create in Prisma
    await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        pole: userData.pole,
      },
    });

    console.log(`Created user: ${userData.name} (${userData.email})`);
  }

  // Create test clients
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (admin) {
    const clientCount = await prisma.client.count();
    if (clientCount === 0) {
      await prisma.client.createMany({
        data: [
          {
            societe: 'TechCorp SAS',
            gerant: 'Jean Dupont',
            emails: (['contact@techcorp.fr']),
            telephones: (['+33 1 23 45 67 89']),
            contrat: 'Premium',
            couleurStatut: 'vert',
            descriptionGenerale: 'Client fidèle depuis 2023',
          },
          {
            societe: 'DesignStudio',
            gerant: 'Marie Martin',
            emails: (['hello@designstudio.fr']),
            telephones: (['+33 6 12 34 56 78']),
            contrat: 'Standard',
            couleurStatut: 'jaune',
          },
        ],
      });
      console.log('Created test clients');
    }

    // Create test prospects
    const prospectCount = await prisma.prospect.count();
    if (prospectCount === 0) {
      await prisma.prospect.createMany({
        data: [
          {
            societe: 'StartupXYZ',
            contact: 'Pierre Durand',
            emails: (['pierre@startupxyz.com']),
            telephones: (['+33 7 89 01 23 45']),
            statut: 'en_attente',
            score: 60,
            couleurStatut: 'vert',
          },
          {
            societe: 'BigRetail',
            contact: 'Sophie Leroy',
            emails: (['sophie@bigretail.fr']),
            telephones: ([]),
            statut: 'relance',
            score: 40,
            couleurStatut: 'jaune',
          },
        ],
      });
      console.log('Created test prospects');
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
