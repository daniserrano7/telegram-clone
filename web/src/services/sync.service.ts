// import { db } from './db.service';
// import { apiService } from './api.service';
// import { Message } from '@shared/chat.dto';

// export class SyncService {
//   private static instance: SyncService;
//   private isOnline: boolean = navigator.onLine;

//   private constructor() {
//     window.addEventListener('online', this.handleOnline.bind(this));
//     window.addEventListener('offline', () => (this.isOnline = false));
//   }

//   static getInstance() {
//     if (!SyncService.instance) {
//       SyncService.instance = new SyncService();
//     }
//     return SyncService.instance;
//   }

//   private async handleOnline() {
//     this.isOnline = true;
//     await this.syncPendingMessages();
//   }

//   async syncPendingMessages() {
//     if (!this.isOnline) return;

//     const pendingMessages = await db.getPendingMessages();
//     for (const message of pendingMessages) {
//       try {
//         await apiService.sendMessage(message.chatId, message.content);
//         await db.messages.update(message.id!, { pending: false });
//       } catch (error) {
//         console.error('Failed to sync message:', error);
//       }
//     }
//   }
// }

// export const syncService = SyncService.getInstance();
