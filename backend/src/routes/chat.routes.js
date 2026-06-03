const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth.middleware');
const socketService = require('../services/socket.service');

const prisma = new PrismaClient();
const router = express.Router();

//POST /api/chat/create/:claimId - create a chat room when claim is approved
router.post('/create/:claimId', protect, async (req, res) => {
  const claimId = parseInt(req.prisma.claimId);

  try {
    //check if chat room already exists for this claim
    const existing = await prisma.chatRoom.findUnique({
      where: { claimId },
    });

    if (existing) {
      return res.json(existing); //return existing room
    }

    //get the claim with related items to find owner and finder
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        foundItem: { include: { user: true } }, //finder
        lostItem: { include: { user: true } }, //owner
      },
    });

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const ownerId = claim.lostItem?.userId; //person who lost the item
    const finderId = claim.foundItem?.userId; //person who found the item

    if (!ownerId || !finderId) {
      return res
        .status(400)
        .json({ message: 'Could not determine chat participants' });
    }

    //create the chat room
    const chatRoom = await prisma.chatRoom.create({
      data: {
        claimId,
        ownerId,
        finderId,
      },
    });

    res.status(201).json(chatRoom);
  } catch (error) {
    console.error('Create chat error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//GET /api/chat - get all chat rooms for logged in user
router.get('/', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { ownerId: userId }, //user is the owner
          { finderId: userId }, //user is the finder
        ],
        isActive: true,
      },
      include: {
        owner: { select: { id: true, name: true, points: true } },
        finder: { select: { id: true, name: true, points: true } },
        claim: {
          include: {
            lostItem: { select: { title: true, category: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, //get last message for preview
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    //add unread count for each room
    const roomWithUnread = await Promise.all(
      chatRooms.map(async (room) => {
        const unreadCount = await prisma.message.count({
          where: {
            chatRoomId: room.id,
            isRead: false,
            senderId: { not: userId }, //messages from the other person
          },
        });
        return { ...room, unreadCount };
      })
    );

    res.json(roomWithUnread);
  } catch (error) {
    console.error('Get chats error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//GET /api/chat/:id/messages - get all messages in a chat room
router.get('/:id/messages', protect, async (req, res) => {
  const chatRoomId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    //verify user is a participant
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!chatRoom) {
      res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.ownerId !== userId && chatRoom.finderId !== userId) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this chat' });
    }

    //get all messages
    const messages = await prisma.message.findMany({
      where: { chatRoomId },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    //mark all messages from the other person as read
    await prisma.message.updateMany({
      where: {
        chatRoomId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//POST /api/chat/:id/messages - send a message
router.post('/:id/messages', protect, async (req, res) => {
  const chatRoomId = parseInt(req.params.id);
  const userId = req.user.id;
  const { content } = req.body;

  try {
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    //verify user is a participant
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        owner: { select: { id: true, name: true } },
        finder: { select: { id: true, name: true } },
      },
    });

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    //create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        chatRoomId,
        senderId: userId,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    //determine recipient
    const recipientId =
      chatRoom.ownerId === userId ? chatRoom.finderId : chatRoom.ownerId;

    //emit real-time message to recipient
    socketService.notifyUser(recipientId, 'new_message', {
      chatRoomId,
      message,
    });

    //emit sender too so all their devices update
    socketService.notifyUser(userId, 'message_sent', {
      chatRoomId,
      message,
    });

    //create notification for recipient
    const senderName =
      chatRoom.ownerId === userId ? chatRoom.owner.name : chatRoom.finder.name;

    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        message: `💬 New message from ${senderName}`,
      },
    });

    //emit notification to recipient
    socketService.notifyUser(recipientId, 'new_notification', {
      id: notification.id,
      message: notification.message,
      isRead: false,
      createdAt: notification.createdAt,
      chatRoomId, //include chatRoomId so clicking goes to chat
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//PATCH /api/chat/:id/request-end - request to end chat
router.patch('/:id/request-end', protect, async (req, res) => {
  const chatRoomId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        owner: { select: { id: true, name: true } },
        finder: { select: { id: true, name: true } },
      },
    });

    if (!chatRoom)
      return res.status(404).json({ message: 'Chat room not found' });
    if (chatRoom.ownerId !== userId && chatRoom.finderId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    //save who requested to end
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { endRequestedBy: userId },
    });

    //notify the other participant
    const recipientId =
      chatRoom.ownerId === userId ? chatRoom.finderId : chatRoom.ownerId;
    const requesterName =
      chatRoom.ownerId === userId ? chatRoom.owner.name : chatRoom.finder.name;

    socketService.notifyUser(recipientId, 'end_chat_requested', {
      chatRoomId,
      requesterName,
    });

    res.json({ message: 'End chat request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//PATCH /api/chat/:id/confirm-end - confirm ending the chat (second person agrees)
router.patch('/:id/confirm-end', protect, async (req, res) => {
  const chatRoomId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!chatRoom)
      return res.status(404).json({ message: 'Chat room not found' });

    //make sure the confirmer is NOT the one who requested
    if (chatRoom.endRequestedBy === userId) {
      return res
        .status(400)
        .json({ message: 'You already requested to end this chat' });
    }

    if (!chatRoom.endRequestedBy) {
      return res.status(400).json({ message: 'No end request found' });
    }

    //both agreed - mark as inactive
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { isActive: false },
    });

    //notify the other participants
    socketService.notifyUser(chatRoom.ownerId, 'chat_ended', { chatRoomId });
    socketService.notifyUser(chatRoom.finderId, 'chat_ended', { chatRoomId });

    res.json({ message: 'Chat ended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
