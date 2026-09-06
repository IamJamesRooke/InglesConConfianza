import "dotenv/config";
import { CURRICULUM_TOPICS } from "./src/lib/curriculum/topics";
import { prisma } from "./src/lib/database/prisma";
async function main() {
  const big: {slug:string,label:string,collection:string,count:number}[] = [];
  for (const topic of CURRICULUM_TOPICS) {
    for (const btn of topic.facetButtons || []) {
      const count = await prisma.curriculumConcept.count({ where: { curriculumRole: { not: "trash" }, collections: { some: { collectionName: btn.collection } } } });
      if (count > 20) big.push({ slug: topic.slug, label: btn.label, collection: btn.collection, count });
    }
  }
  big.sort((a,b)=>b.count-a.count);
  for (const b of big) console.log(`${b.count}\t${b.slug}\t${b.collection}\t${b.label}`);
  console.log("total over 20:", big.length);
}
main().then(()=>prisma.$disconnect());
