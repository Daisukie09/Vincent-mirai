const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Converted by ChatGPT",
  description: "AI Chat using GPT4o API",
  commandCategory: "ai",
  usages: "[prompt]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");

  if (!prompt) return api.sendMessage("Please enter a prompt.", threadID, messageID);

  api.sendMessage("please wait...", threadID, async (err, info) => {
    if (err) return;

    try {
      const url = `${global.NashBot.JOSHUA}api/gpt4o-latest?ask=${encodeURIComponent(prompt)}&uid=1&imageUrl=&apikey=609efa09-3ed5-4132-8d03-d6f8ca11b527`;
      const res = await axios.get(url);

      const reply = res.data.response || "❌ No response received.";
      api.editMessage(reply, info.messageID);
    } catch (e) {
      api.editMessage("❌ Failed to get response.", info.messageID);
    }
  }, messageID);
};
    
