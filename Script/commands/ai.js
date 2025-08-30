const axios = require("axios");

if (!global.gptMemory) global.gptMemory = {}; // Store user conversation history

module.exports.config = {
  name: "gpt4",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Chat with GPT-4 via Zen API (with memory)",
  commandCategory: "ai",
  usages: "[prompt]",
  cooldowns: 5
};

async function askGPT4(prompt, senderID) {
  // Build conversation history
  const history = global.gptMemory[senderID] || [];
  history.push({ role: "user", content: prompt });

  // Combine history into a single string for the API
  const fullPrompt = history.map(h => `${h.role}: ${h.content}`).join("\n");

  const url = `https://zen-api.gleeze.com/api/gpt4?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderID}`;
  const res = await axios.get(url);
  const reply = res.data.response || res.data.message || "⚠️ No reply received.";

  // Save AI's response to history
  history.push({ role: "assistant", content: reply });
  global.gptMemory[senderID] = history;

  return reply;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("⚠️ Please enter a prompt.", threadID, messageID);

  api.sendMessage("[ GPT-4 ]\n\nPlease wait...", threadID, async (err, info) => {
    if (err) return;

    try {
      const reply = await askGPT4(prompt, senderID);
      api.editMessage(reply, info.messageID);

      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    } catch {
      api.editMessage("❌ Failed to get response.", info.messageID);
    }
  }, messageID);
};

module.exports.handleReply = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  if (!body) return;

  api.sendMessage("[ GPT-4 ]\n\nPlease wait...", threadID, async (err, info) => {
    if (err) return;

    try {
      const reply = await askGPT4(body, senderID);
      api.editMessage(reply, info.messageID);

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    } catch {
      api.editMessage("❌ Failed to get response.", info.messageID);
    }
  }, messageID);
};
