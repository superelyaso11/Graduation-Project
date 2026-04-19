const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

//POST /api/claims - submit a claim for a matched item
const createClaim = async (req, res) => {
  const { foundItemId, lostItemId, question, answer } = req.body;
  const claimantId = req.user.id; //logged-in user making the claim

  try {
    if (!answer || !question) {
      return res
        .status(400)
        .json({ message: 'Question and answer are required' });
    }

    //check if user already submitted a claim for this item
    const exisitingClaim = await prisma.claim.findFirst({
      where: {
        claimantId,
        lostItemId: lostItemId ? parseInt(lostItemId) : undefined,
        foundItemId: foundItemId ? parseInt(foundItemId) : undefined,
      },
    });

    if (exisitingClaim) {
      return res
        .status(400)
        .json({ message: 'You have already submitted a claim for this item' });
    }

    const claim = await prisma.claim.create({
      data: {
        question,
        answer,
        claimantId,
        foundItemId: foundItemId ? parseInt(foundItemId) : null,
        lostItemId: lostItemId ? parseInt(lostItemId) : null,
        status: 'PENDING',
      },
    });

    //notify the finder that someone submitted a claim
    if (foundItemId) {
      const foundItem = await prisma.foundItem.findUnique({
        where: { id: parseInt(foundItemId) },
      });

      if (foundItem) {
        await prisma.notification.create({
          data: {
            userId: foundItem.userId,
            message: `Someone submitted a claim for your found item. Review it now.`,
          },
        });
      }
    }

    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//GET /api/claims/my - get all claims submitted by logged-in user
const getMyClaims = async (req, res) => {
  const claimantId = req.user.id;

  try {
    const claims = await prisma.claim.findMany({
      where: { claimantId },
      include: {
        foundItem: true, //include found item details
        lostItem: true, //include lost item details
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//GET /api/claims/incoming - get all claims on finder's items
const getIncomingClaims = async (req, res) => {
  const userId = req.user.id;

  try {
    //find all found items belonging to this user
    const foundItems = await prisma.foundItem.findMany({
      where: { userId },
      select: { id: true },
    });

    const foundItemIds = foundItems.map((f) => f.id); //extract IDs

    //get all claims on those found items
    const claims = await prisma.claim.findMany({
      where: { foundItemId: { in: foundItemIds } },
      include: {
        claimant: {
          select: { id: true, name: true, email: true, points: true },
        },
        foundItem: true,
        lostItem: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//PATCH /api/claims/:id/approve - finder approves the claim
const approveClaim = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const claim = await prisma.claim.findUnique({
      where: { id: parseInt(id) },
      include: {
        foundItem: true,
        lostItem: true,
      },
    });

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    //only teh finder can approve
    if (claim.foundItem?.userId !== userId) {
      return res
        .status(403)
        .json({ message: 'Not authorized to approve this claim' });
    }

    //approve the claim
    const updated = await prisma.claim.update({
      where: { id: parseInt(id) },
      data: { status: 'APPROVED', isCorrect: true },
    });

    //update item statuses to RESOLVED
    if (claim.foundItemId) {
      await prisma.foundItem.update({
        where: { id: claim.foundItemId },
        data: { status: 'RESOLVED' },
      });
    }

    //reward the claimant with points
    await prisma.user.update({
      where: { id: claim.claimantId },
      data: { points: { increment: 10 } }, //+10 points for successful claim
    });

    //notify the claimant that thier claim was approved
    await prisma.notification.create({
      data: {
        userId: claim.claimantId,
        message: `Your claim was approved! Contact the finder to retrieve your item.`,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//PATCH /api/claims/:id/reject - finder rejects the claim
const rejectClaim = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const claim = await prisma.claim.findUnique({
      where: { id: parseInt(id) },
      include: { foundItem: true },
    });

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    //only the finder can reject
    if (claim.foundItem?.userId !== userId) {
      return res
        .status(403)
        .json({ message: 'Not authorized to reject this claim' });
    }

    const updated = await prisma.claim.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED', isCorrect: false },
    });

    //notify the claimant that their claim was rejected
    await prisma.notification.create({
      data: {
        userId: claim.claimantId,
        message: `Your claim was rejected. The finder did not verify your answer.`,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createClaim,
  getMyClaims,
  getIncomingClaims,
  approveClaim,
  rejectClaim,
};
