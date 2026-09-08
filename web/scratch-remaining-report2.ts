import "dotenv/config";
import { CURRICULUM_TOPICS } from "./src/lib/curriculum/topics";
import { prisma } from "./src/lib/database/prisma";
async function main() {
  const results: {slug:string,count:number}[] = [];
  for (const topic of CURRICULUM_TOPICS) {
    let n = 0;
    for (const btn of topic.facetButtons || []) {
      const count = await prisma.curriculumConcept.count({ where: { curriculumRole: { not: "Trash" }, collections: { some: { collectionName: topic.baseCollection } }, AND: [{collections:{some:{collectionName:btn.collection}}}] } });
      if (count > 20) n++;
    }
    if (n>0) results.push({slug: topic.slug, count: n});
  }
  for (const r of results) console.log(r.slug, r.count);
}
main().then(()=>prisma.$disconnect());
