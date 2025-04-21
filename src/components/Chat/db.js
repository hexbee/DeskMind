import { v4 as uuidv4 } from "uuid";

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("app-deskmind-db", 2);

    request.onerror = (event) => {
      reject(new Error("Failed to open the database"));
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // Create tables and indexes
      if (!db.objectStoreNames.contains("channels")) {
        const channelsStore = db.createObjectStore("channels", {
          keyPath: "id",
        });
        channelsStore.createIndex("created_at", "created_at", {
          unique: false,
        });
        channelsStore.createIndex("updated_at", "updated_at", {
          unique: false,
        });
        // Add pin index
        channelsStore.createIndex("pinned", "pinned", {
          unique: false,
        });
      } else if (oldVersion < 2) {
        // Add pinned field to existing channels
        const tx = event.target.transaction;
        const store = tx.objectStore("channels");
        
        // Add pinned index if it doesn't exist
        if (!store.indexNames.contains("pinned")) {
          store.createIndex("pinned", "pinned", { unique: false });
        }
      }

      if (!db.objectStoreNames.contains("messages")) {
        const messagesStore = db.createObjectStore("messages", {
          keyPath: "id",
        });
        messagesStore.createIndex("channel_id", "channel_id", {
          unique: false,
        });
        messagesStore.createIndex("created_at", "created_at", {
          unique: false,
        });
        messagesStore.createIndex("updated_at", "updated_at", {
          unique: false,
        });
      }
    };
  });
};

// Ensure all channels have pinned property
const ensureChannelsPinned = async () => {
  const db = await openDatabase();
  const tx = db.transaction("channels", "readwrite");
  const store = tx.objectStore("channels");
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      const channels = request.result;
      let updatedCount = 0;
      
      if (channels.length === 0) {
        resolve();
        return;
      }
      
      channels.forEach(channel => {
        if (!('pinned' in channel)) {
          channel.pinned = false;
          store.put(channel);
          updatedCount++;
        }
      });
      
      tx.oncomplete = () => {
        console.log(`Updated ${updatedCount} channels with pinned property`);
        resolve();
      };
      
      tx.onerror = (error) => {
        reject(error);
      };
    };
    
    request.onerror = (error) => {
      reject(error);
    };
  });
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const insertChannel = async (name) => {
  const db = await openDatabase();
  const tx = db.transaction("channels", "readwrite");
  const store = tx.objectStore("channels");
  const channel = {
    id: uuidv4(),
    name,
    pinned: false, // Default to unpinned
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  };

  store.add(channel);
  await tx.complete;

  return channel.id;
};

const insertMessage = async (channelId, message, user, customId = null) => {
  const db = await openDatabase();
  const tx = db.transaction("messages", "readwrite");
  const store = tx.objectStore("messages");
  const msg = {
    id: customId || uuidv4(),
    channel_id: channelId,
    message,
    user,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  };

  store.add(msg);
  await tx.complete;

  return msg.id;
};

const updateMessage = async (messageId, newMessage) => {
  const db = await openDatabase();
  const tx = db.transaction("messages", "readwrite");
  const store = tx.objectStore("messages");

  const request = store.get(messageId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const message = request.result;
      if (message) {
        message.message = newMessage;
        message.updated_at = getCurrentTimestamp();

        const updateRequest = store.put(message);

        updateRequest.onsuccess = () => {
          resolve(true);
        };

        updateRequest.onerror = () => {
          reject(new Error("Failed to update message"));
        };
      } else {
        reject(new Error("Message not found"));
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve message for update"));
    };
  });
};

const getMessagesByChannel = async (channelId) => {
  const db = await openDatabase();
  const tx = db.transaction("messages", "readonly");
  const store = tx.objectStore("messages");
  const index = store.index("channel_id");

  const request = index.getAll(channelId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const messages = request.result.sort((a, b) => {
        return new Date(a.updated_at) - new Date(b.updated_at);
      });
      resolve(messages);
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve messages by channel"));
    };

    tx.oncomplete = () => {
      const messages = request.result.sort((a, b) => {
        return new Date(a.updated_at) - new Date(b.updated_at);
      });
      resolve(messages);
    };
  });
};

const getChannels = async () => {
  const db = await openDatabase();
  const tx = db.transaction("channels", "readonly");
  const store = tx.objectStore("channels");

  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const channels = request.result.sort((a, b) => {
        // First sort by pinned status
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Then sort by update time
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      resolve(channels);
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve channels"));
    };

    tx.oncomplete = () => {
      const channels = request.result.sort((a, b) => {
        // First sort by pinned status
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Then sort by update time
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      resolve(channels);
    };
  });
};

const deleteChannel = async (channelId) => {
  const db = await openDatabase();
  const tx = db.transaction(["channels", "messages"], "readwrite");
  const channelsStore = tx.objectStore("channels");
  const messagesStore = tx.objectStore("messages");
  const indexedMessages = messagesStore.index("channel_id");
  const request = indexedMessages.openCursor(IDBKeyRange.only(channelId));

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      messagesStore.delete(cursor.primaryKey);
      cursor.continue();
    }
    channelsStore.delete(channelId);
  };

  await tx.complete;
};

const updateChannel = async (channelId, newName) => {
  const db = await openDatabase();
  const tx = db.transaction("channels", "readwrite");
  const store = tx.objectStore("channels");

  const request = store.get(channelId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const channel = request.result;
      if (channel) {
        channel.name = newName;
        channel.updated_at = getCurrentTimestamp();

        const updateRequest = store.put(channel);

        updateRequest.onsuccess = () => {
          resolve(true);
        };

        updateRequest.onerror = () => {
          reject(new Error("Failed to update channel"));
        };
      } else {
        reject(new Error("Channel not found"));
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve channel for update"));
    };
  });
};

const toggleChannelPin = async (channelId) => {
  try {
    // Ensure all channels have pinned property
    await ensureChannelsPinned();
    
    const db = await openDatabase();
    const tx = db.transaction("channels", "readwrite");
    const store = tx.objectStore("channels");

    return new Promise((resolve, reject) => {
      const request = store.get(channelId);
      
      request.onsuccess = () => {
        const channel = request.result;
        if (channel) {
          // Ensure pinned property exists
          if (!('pinned' in channel)) {
            channel.pinned = false;
          }
          
          // Toggle pin status
          channel.pinned = !channel.pinned;
          channel.updated_at = getCurrentTimestamp();

          const updateRequest = store.put(channel);

          updateRequest.onsuccess = () => {
            resolve(channel.pinned);
          };

          updateRequest.onerror = (event) => {
            console.error("Error updating channel pin status:", event);
            reject(new Error("Failed to update channel pin status"));
          };
        } else {
          reject(new Error("Channel not found"));
        }
      };

      request.onerror = (event) => {
        console.error("Error retrieving channel:", event);
        reject(new Error("Failed to retrieve channel for update"));
      };
    });
  } catch (error) {
    console.error("Toggle channel pin error:", error);
    throw error;
  }
};

const dbOperations = {
  insertChannel,
  insertMessage,
  updateMessage,
  getMessagesByChannel,
  getChannels,
  deleteChannel,
  updateChannel,
  toggleChannelPin,
  ensureChannelsPinned,
};

// Ensure channels have pinned property before exporting
ensureChannelsPinned().catch(console.error);

export default dbOperations;
