import { PrismaClient } from '@prisma/client';
import { ProtocolName } from '../src/recommendation/matching/protocol-name.enum';

const prisma = new PrismaClient();

const PROTOCOLS = [
  {
    name: ProtocolName.PhysiologicalSigh,
    duration_seconds: 60,
    instruction_text:
      'Double inhale through the nose, long exhale through the mouth. Repeat for 60 seconds.',
    animation_type: 'breathing_circle',
  },
  {
    name: ProtocolName.BoxBreathing,
    duration_seconds: 240,
    instruction_text:
      'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat for 4 minutes.',
    animation_type: 'box_square',
  },
];

async function main() {
  for (const protocol of PROTOCOLS) {
    await prisma.protocol.upsert({
      where: { name: protocol.name },
      create: protocol,
      update: {},
    });
  }
  console.log('Seed completed: protocols upserted.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
