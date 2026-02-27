import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type MessageCallback = (message: any) => void;
type ReadCallback = (data: any) => void;
type TypingCallback = (data: any) => void;
type PresenceCallback = (users: number[]) => void;

interface ChatSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export function subscribeToChatChannel(
  userId: number,
  onMessage: MessageCallback,
  onRead: ReadCallback,
  onTyping: TypingCallback
): ChatSubscription {
  const channel = supabase.channel(`chat:${userId}`, {
    config: { broadcast: { self: false } },
  });

  channel
    .on('broadcast', { event: 'MessageSent' }, ({ payload }) => {
      onMessage(payload.message);
    })
    .on('broadcast', { event: 'MessageRead' }, ({ payload }) => {
      onRead(payload);
    })
    .on('broadcast', { event: 'UserTyping' }, ({ payload }) => {
      onTyping(payload);
    })
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export function subscribeToPresence(
  onSync: PresenceCallback,
  onJoin: (userId: number) => void,
  onLeave: (userId: number) => void
): ChatSubscription {
  const channel = supabase.channel('online-users', {
    config: { presence: { key: 'users' } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const userIds = Object.values(state)
        .flat()
        .map((p: any) => p.user_id)
        .filter(Boolean);
      onSync(userIds);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((p: any) => {
        if (p.user_id) onJoin(p.user_id);
      });
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((p: any) => {
        if (p.user_id) onLeave(p.user_id);
      });
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: 0, online_at: new Date().toISOString() });
      }
    });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export function trackPresence(channel: RealtimeChannel, userId: number) {
  channel.track({ user_id: userId, online_at: new Date().toISOString() });
}

export function broadcastTyping(receiverId: number, senderId: number) {
  // Use API endpoint instead of direct broadcast (server handles it)
  // This is called via the existing api.post('/messages/typing') pattern
}
