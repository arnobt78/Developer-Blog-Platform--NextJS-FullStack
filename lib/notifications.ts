import { prisma } from "./prisma";

interface CreateNotificationParams {
  userId: string;
  type: string;
  postId?: string;
  commentId?: string;
  fromUserId?: string;
  message: string;
}

export async function createNotification({
  userId,
  type,
  postId,
  commentId,
  fromUserId,
  message,
}: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        postId,
        commentId,
        fromUserId,
        message,
      },
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}
