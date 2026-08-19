import express from 'express';
import { db } from '../db/index.js';
import { messages, users } from '../db/schema.js';
import { eq, or, and, desc, asc, sql } from 'drizzle-orm';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages - Retrieve messages (for donor: thread with admin; for admin: list of donor conversations)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'donor') {
      // Find admin user
      const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);

      // Fetch all messages involving this donor
      const messageList = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          recipientId: messages.recipientId,
          content: messages.content,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          senderFirstName: users.firstName,
          senderLastName: users.lastName,
          senderRole: users.role,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          or(
            eq(messages.senderId, user.id),
            eq(messages.recipientId, user.id)
          )
        )
        .orderBy(asc(messages.createdAt));

      // Mark unread messages sent to this donor as read
      await db
        .update(messages)
        .set({ isRead: true })
        .where(and(eq(messages.recipientId, user.id), eq(messages.isRead, false)));

      return res.json({
        success: true,
        isDonor: true,
        adminId: adminUser ? adminUser.id : null,
        messages: messageList,
      });
    } else {
      // Admin: retrieve conversations grouped by donor
      const donorList = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.role, 'donor'));

      // For each donor, find latest message and unread count
      const conversations = [];

      for (const donor of donorList) {
        const donorMessages = await db
          .select({
            id: messages.id,
            content: messages.content,
            createdAt: messages.createdAt,
            senderId: messages.senderId,
            isRead: messages.isRead,
          })
          .from(messages)
          .where(
            or(
              eq(messages.senderId, donor.id),
              eq(messages.recipientId, donor.id)
            )
          )
          .orderBy(desc(messages.createdAt));

        const unreadCount = donorMessages.filter(
          (m) => m.senderId === donor.id && !m.isRead
        ).length;

        if (donorMessages.length > 0) {
          conversations.push({
            donor,
            lastMessage: donorMessages[0],
            unreadCount,
            totalMessages: donorMessages.length,
          });
        } else {
          // Donor without messages yet
          conversations.push({
            donor,
            lastMessage: null,
            unreadCount: 0,
            totalMessages: 0,
          });
        }
      }

      // Sort conversations: those with unread messages first, then by latest message date
      conversations.sort((a, b) => {
        if (a.unreadCount !== b.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return res.json({
        success: true,
        isAdmin: true,
        conversations,
      });
    }
  } catch (err) {
    console.error('Error in GET /api/messages:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des messages.' });
  }
});

// GET /api/messages/conversation/:donorId (Admin only)
router.get('/conversation/:donorId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { donorId } = req.params;

    const [donor] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, donorId));

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donateur introuvable.' });
    }

    const messageList = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          eq(messages.senderId, donorId),
          eq(messages.recipientId, donorId)
        )
      )
      .orderBy(asc(messages.createdAt));

    // Mark messages sent by this donor as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, donorId), eq(messages.isRead, false)));

    return res.json({
      success: true,
      donor,
      messages: messageList,
    });
  } catch (err) {
    console.error('Error in GET /api/messages/conversation/:donorId:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/messages - Send a message
router.post('/', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { content, recipientId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Le contenu du message ne peut pas être vide.' });
    }

    let targetRecipientId = recipientId;

    if (user.role === 'donor') {
      // If donor, target recipient is the admin
      if (!targetRecipientId) {
        const [adminUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, 'admin'))
          .limit(1);

        targetRecipientId = adminUser ? adminUser.id : null;
      }
    } else {
      // Admin must specify recipient donor
      if (!targetRecipientId) {
        return res.status(400).json({ success: false, message: 'Veuillez sélectionner un destinataire.' });
      }
    }

    const [inserted] = await db
      .insert(messages)
      .values({
        senderId: user.id,
        recipientId: targetRecipientId,
        content: content.trim(),
        isRead: false,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: 'Message envoyé.',
      data: {
        id: inserted.id,
        senderId: inserted.senderId,
        recipientId: inserted.recipientId,
        content: inserted.content,
        isRead: inserted.isRead,
        createdAt: inserted.createdAt,
        senderFirstName: user.firstName,
        senderLastName: user.lastName,
        senderRole: user.role,
      },
    });
  } catch (err) {
    console.error('Error in POST /api/messages:', err);
    return res.status(500).json({ success: false, message: "Erreur lors de l'envoi du message." });
  }
});

// GET /api/messages/unread-count - Get total unread messages count
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    let unreadCount = 0;
    if (user.role === 'donor') {
      const result = await db
        .select({ count: sql`count(*)::int` })
        .from(messages)
        .where(and(eq(messages.recipientId, user.id), eq(messages.isRead, false)));
      unreadCount = result[0]?.count || 0;
    } else {
      // For admin: count unread messages from donors
      const result = await db
        .select({ count: sql`count(*)::int` })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(and(eq(users.role, 'donor'), eq(messages.isRead, false)));
      unreadCount = result[0]?.count || 0;
    }

    return res.json({ success: true, unreadCount });
  } catch (err) {
    console.error('Error in GET /api/messages/unread-count:', err);
    return res.status(500).json({ success: false, unreadCount: 0 });
  }
});

export default router;
