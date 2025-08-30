const axios = require("axios");

if (!global.gptMemory) global.gptMemory = {};

module.exports.config = {
  name: "gpt4",
  version: "1.2.0",
  permission: 0,
  credits: "ChatGPT",
  description: "Chat with GPT-4 (with memory)",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "gpt4 <question>",
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

async function askGPT4(prompt, senderID) {
  const history = global.gptMemory[senderID] || [];
  history.push({ role: "user", content: prompt });

  const fullPrompt = history.map(h => `${h.role}: ${h.content}`).join("\n");
  const url = `https://zen-api.gleeze.com/api/gpt4?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderID}`;

  const res = await axios.get(url);
  const reply = res.data.response || res.data.message || "⚠️ No reply received.";

  history.push({ role: "assistant", content: reply });
  global.gptMemory[senderID] = history;

  return reply;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const question = args.join(" ");

  if (!question) {
    return api.sendMessage(
      "❌ Please enter a question.",
      threadID,
      messageID
    );
  }

  api.sendMessage("[ GPT-4 ]\n\nPlease wait...", threadID, async (err, info) => {
    if (err) return;

    try {
      const reply = await askGPT4(question, senderID);
      api.editMessage(reply, info.messageID);

      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    } catch (error) {
      console.error("❌ GPT-4 Error:", error?.response?.data || error.message || error);
      api.editMessage("❌ Error retrieving response.", info.messageID);
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
    } catch (error) {
      console.error("❌ GPT-4 Error:", error?.response?.data || error.message || error);
      api.editMessage("❌ Error retrieving response.", info.messageID);
    }
  }, messageID);
};
