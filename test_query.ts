import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT 
      difficulty, 
      stack_elem AS "techStack", 
      domain, 
      COUNT(*) as count 
    FROM "Idea", UNNEST("recommendedStack") AS stack_elem 
    GROUP BY difficulty, "techStack", domain 
    ORDER BY count DESC 
    LIMIT 10
  `;
  console.log(result);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
