const { PrismaClient } = require('@prisma/client');
const socketService = require('./socket.service');

const prisma = new PrismaClient();

const runExpiryJob = async () => {
  try {
    console.log('Running expiry job...');

    //calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    //find all ACTIVE lost item older than 30 days
    const expiredItems = await prisma.lostItem.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: thirtyDaysAgo }, //created more than 30 days ago
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (expiredItems.length === 0) {
      console.log('No items to expire.');
      return;
    }

    console.log(`Found ${expiredItems.length} items to expire.`);

    for (const item of expiredItems) {
      //update item status to EXPIRED
      await prisma.lostItem.update({
        where: { id: item.id },
        data: { status: 'EXPIRED' },
      });

      //notify the item owner
      const notification = await prisma.notification.create({
        data: {
          userId: item.userId,
          message: `Your lost item report "${item.title}" has expired after 30 days. Contact admin if you stil need help.`,
        },
      });

      //send real-time notification
      socketService.notifyUser(item.userId, 'new_notification', {
        id: notification.id,
        message: notification.message,
        isRead: false,
        createdAt: notification.createdAt,
      });

      //notify all admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            message: `Lost item "${item.title}" by ${item.user.name} has expired and is pending donation review.`,
          },
        });

        socketService.notifyUser(admin.id, 'new_notification', {
          id: adminNotification.id,
          message: adminNotification.message,
          isRead: false,
          createdAt: adminNotification.createdAt,
        });
      }
    }

    console.log(`Expiry job complete. ${expiredItems.length} items expired.`);
  } catch (error) {
    console.error('Expiry job error:', error.message);
  }
};

module.exports = { runExpiryJob };
