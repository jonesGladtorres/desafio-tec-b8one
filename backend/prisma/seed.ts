import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const exams = [
  {
    name: 'Hemograma completo',
    description: 'Avalia células sanguíneas e auxilia no diagnóstico geral.',
    preparationInstructions: 'Jejum não obrigatório.',
    durationInMinutes: 15,
    priceCents: 4500,
  },
  {
    name: 'Glicemia em jejum',
    description: 'Mede a concentração de glicose no sangue.',
    preparationInstructions: 'Jejum de 8 horas.',
    durationInMinutes: 10,
    priceCents: 2800,
  },
  {
    name: 'Colesterol total e frações',
    description: 'Analisa colesterol total, HDL, LDL e triglicerídeos.',
    preparationInstructions: 'Jejum conforme orientação médica.',
    durationInMinutes: 15,
    priceCents: 5200,
  },
  {
    name: 'TSH',
    description: 'Avalia a função da tireoide por meio do hormônio TSH.',
    preparationInstructions: 'Informar medicamentos em uso.',
    durationInMinutes: 10,
    priceCents: 4900,
  },
  {
    name: 'T4 livre',
    description: 'Complementa a avaliação da função tireoidiana.',
    preparationInstructions: 'Informar medicamentos em uso.',
    durationInMinutes: 10,
    priceCents: 4700,
  },
  {
    name: 'Urina tipo 1',
    description: 'Exame de urina para avaliar rins e trato urinário.',
    preparationInstructions:
      'Coletar preferencialmente a primeira urina da manhã.',
    durationInMinutes: 10,
    priceCents: 2600,
  },
  {
    name: 'Creatinina',
    description: 'Avalia função renal a partir da creatinina sanguínea.',
    preparationInstructions: 'Jejum não obrigatório.',
    durationInMinutes: 10,
    priceCents: 3300,
  },
  {
    name: 'Ureia',
    description: 'Auxilia na avaliação metabólica e renal.',
    preparationInstructions: 'Jejum não obrigatório.',
    durationInMinutes: 10,
    priceCents: 3100,
  },
  {
    name: 'PCR',
    description: 'Mede proteína C reativa, marcador inflamatório.',
    preparationInstructions: 'Jejum não obrigatório.',
    durationInMinutes: 10,
    priceCents: 4100,
  },
  {
    name: 'Vitamina D',
    description: 'Dosagem sanguínea de vitamina D.',
    preparationInstructions: 'Jejum não obrigatório.',
    durationInMinutes: 10,
    priceCents: 6900,
  },
];

async function main(): Promise<void> {
  const passwordHash = await hash('Password123!', 12);

  await prisma.user.upsert({
    where: {
      email: 'patient@example.com',
    },
    update: {
      name: 'Patient Demo',
      passwordHash,
    },
    create: {
      name: 'Patient Demo',
      email: 'patient@example.com',
      passwordHash,
    },
  });

  for (const exam of exams) {
    await prisma.exam.upsert({
      where: {
        name: exam.name,
      },
      update: exam,
      create: exam,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
