const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const stringsSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1; // exact match = perfect score

  if (s1.includes(s2) || s2.includes(s1)) return 0.8; // check if one contains the other

  // check how many words overlap
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const commonWords = words1.filter((w) => words2.includes(w));
  return commonWords.length / Math.max(words1.length, words2.length);
};

const dateSimilarity = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return 1; // same day or next day = perfect
  if (diffDays <= 3) return 0.8; // within 3 days = good
  if (diffDays <= 7) return 0.6; // within a week = decent
  if (diffDays <= 14) return 0.3; // within two weeks = weak
  return 0; // too far apart = no match
};

const calculateMatchScore = (lostItem, foundItem) => {
  if (lostItem.category !== foundItem.category) return 0; // different categories = no match

  const locationScore = stringsSimilarity(
    lostItem.location,
    foundItem.location
  );
  const dateScore = dateSimilarity(lostItem.date, foundItem.date);

  const score = locationScore * 0.6 + dateScore * 0.4; // weight location more than date

  return Math.round(score * 100) / 100; // round to 2 decimal places
};

// Run matching for a newly created lost item against all existing found items
const matchNewLostItem = async (lostItem) => {
  try {
    //gat all active found items in the same category
    const foundItems = await prisma.foundItem.findMany({
      where: {
        category: lostItem.category, // only same category
        status: 'ACTIVE', //only active items
      },
    });

    for (const foundItem of foundItems) {
      const score = calculateMatchScore(lostItem, foundItem);

      if (score >= 0.4) {
        //only create match if score is good enough
        const existingMatch = await prisma.match.findFirst({
          //check if this match already exists
          where: {
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
          },
        });

        if (!existingMatch) {
          //avoid duplicate matches
          await prisma.match.create({
            data: {
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
              score,
              status: 'PENDING',
            },
          });

          //update both items status to MATCHED
          await prisma.lostItem.update({
            where: { id: lostItem.id },
            data: { status: 'MATCHED' },
          });

          await prisma.foundItem.update({
            where: { id: foundItem.id },
            data: { status: 'MATCHED' },
          });

          //notify the owner of the lost item
          await prisma.notification.create({
            data: {
              userId: lostItem.userId,
              message: `A potential match has been found for your lost ${lostItem.title}!`,
            },
          });

          //notify the finder
          await prisma.notification.create({
            data: {
              userId: foundItem.userId,
              message: `Your found item ${foundItem.title} has been matched with a lost report!`,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Matching error (lost item):', error.message);
  }
};

//Run matching for a newly created found item against all existing lost items
const matchNewFoundItem = async (foundItem) => {
  try {
    //get all active lost items in the same category
    const lostItems = await prisma.lostItem.findMany({
      where: {
        category: foundItem.category, //only same category
        status: 'ACTIVE', //only active items
      },
    });

    for (const lostItem of lostItems) {
      const score = calculateMatchScore(lostItem, foundItem);

      if (score >= 0.4) {
        //only create match if score is good enough
        const existingMatch = await prisma.match.findFirst({
          where: {
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
          },
        });

        if (!existingMatch) {
          //avoid duplicate matches
          await prisma.match.create({
            data: {
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
              score,
              status: 'PENDING',
            },
          });

          await prisma.lostItem.update({
            where: { id: lostItem.id },
            data: { status: 'MATCHED' },
          });

          await prisma.foundItem.update({
            where: { id: foundItem.id },
            data: { status: 'MATCHED' },
          });

          //notify the owner of the lost item
          await prisma.notification.create({
            data: {
              userId: lostItem.userId,
              message: `A potential match was found for your lost ${lostItem.title}!`,
            },
          });

          //notify the finder
          await prisma.notification.create({
            data: {
              userId: foundItem.userId,
              message: `Your found item ${foundItem.title} has been matched with a lost report!`,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Matching error (found item):', error.message);
  }
};

module.exports = { matchNewLostItem, matchNewFoundItem };
