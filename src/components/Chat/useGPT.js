import OpenAI from "openai";
import { toast } from "react-toastify";
import { getItem } from "../../utils/localStorage";
import {
  API_KEY_NAME,
  API_BASE_URL_NAME,
  DEFAULT_API_BASE_URL,
  MODEL_NAME,
  DEFAULT_MODEL
} from "../../constants";
import dbOperations from "./db";

const openai = new OpenAI({
  apiKey: getItem(API_KEY_NAME),
  baseURL: getItem(API_BASE_URL_NAME) || DEFAULT_API_BASE_URL,
  dangerouslyAllowBrowser: true, // 允许在浏览器环境中使用API密钥（开发环境）
});
const { insertMessage, updateMessage } = dbOperations;

// 常规完成方法（不使用流）
const getCompletion = async (messages, channelId) => {
  try {
    const initialPrompt = {
      role: "system",
      content: "You are a helpful, honest, and harmless AI assistant. Please provide direct and clear responses, and follow the user's instructions.",
    };
    const completion = await openai.chat.completions.create({
      model: getItem(MODEL_NAME) || DEFAULT_MODEL,
      messages: [initialPrompt, ...messages],
    });
    const completionText = completion.choices[0].message.content;
    await insertMessage(channelId, completionText, false);
    return completionText;
  } catch (error) {
    console.error("OpenAI API error:", error);
    if (error.status === 401) {
      toast.error("Invalid API key");
    } else {
      toast.error(error.message || "Failed to get completion");
    }
    return null;
  }
};

// 流式完成方法
const getCompletionStream = async (messages, channelId, onChunk, onComplete) => {
  try {
    const initialPrompt = {
      role: "system",
      content: "You are a helpful, honest, and harmless AI assistant. Please provide direct and clear responses, and follow the user's instructions.",
    };

    // 创建一个临时消息ID用于流式更新
    const tempMessageId = `temp-${Date.now()}`;
    let fullContent = "";

    // 首先插入一个空消息，以便后续流式更新
    await insertMessage(channelId, "", false, tempMessageId);

    const stream = await openai.chat.completions.create({
      model: getItem(MODEL_NAME) || DEFAULT_MODEL,
      messages: [initialPrompt, ...messages],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullContent += content;

        // 调用回调函数处理每个新的文本块
        if (onChunk) {
          onChunk(content, fullContent, tempMessageId);
        }
      }
    }

    // 最后更新数据库中的完整消息
    try {
      // 使用updateMessage而不是insertMessage更新临时消息
      await updateMessage(tempMessageId, fullContent);

      // 完成后调用回调
      if (onComplete) {
        onComplete(fullContent, tempMessageId);
      }
    } catch (err) {
      console.error("Error updating message:", err);
      // 如果更新失败，尝试插入新消息
      await insertMessage(channelId, fullContent, false);
    }

    return fullContent;
  } catch (error) {
    console.error("OpenAI Stream API error:", error);
    if (error.status === 401) {
      toast.error("Invalid API key");
    } else {
      toast.error(error.message || "Failed to get streaming completion");
    }

    // 错误时调用完成回调
    if (onComplete) {
      onComplete("Error: " + (error.message || "Unknown error"), null);
    }

    return null;
  }
};

const gpt = {
  getCompletion,
  getCompletionStream,
};

export default gpt;
