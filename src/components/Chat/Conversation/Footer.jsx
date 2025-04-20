import React, { useState } from "react";
import { Input, Button, Switch } from "antd";
import dbOperations from "../db";
import { toast } from "react-toastify";
import gpt from "../useGPT";
import { FiSend } from "react-icons/fi";
import { CiRedo } from "react-icons/ci";

const { TextArea } = Input;

const Footer = ({
  message,
  setMessage,
  channelId,
  setChannelId,
  sanitizedConversation,
  setSanitizedConversation,
  setIsLoadingResponse,
  isLoadingResponse,
  fetchMessages,
}) => {
  const { insertChannel, insertMessage, updateMessage } = dbOperations;
  const { getCompletion, getCompletionStream } = gpt;
  const [useStream, setUseStream] = useState(true); // 默认使用Streaming
  const [streamingContent, setStreamingContent] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    setIsLoadingResponse(true);
    let id = channelId;
    if (message.trim() === "") return;
    if (!id) {
      try {
        id = await insertChannel(message.substring(0, 100));
        setChannelId(id);
      } catch (err) {
        toast.error("Error creating channel");
      }
    }
    const messages = [
      ...sanitizedConversation,
      { content: message, role: "user" },
    ];

    // 立即添加用户消息到对话
    setSanitizedConversation(messages);
    setMessage("");

    try {
      // 保存用户消息到数据库
      await insertMessage(id, message, true);

      if (useStream) {
        // 添加一个临时的空AI回复消息，用于流式显示
        const tempMessages = [
          ...messages,
          { content: "", role: "system", isStreaming: true }
        ];
        setSanitizedConversation(tempMessages);
        setStreamingContent("");

        // 使用流式API
        await getCompletionStream(
          messages,
          id,
          // 每次收到新块时调用
          (chunk, fullContent, messageId) => {
            setStreamingContent(fullContent);
            const updatedMessages = [
              ...messages,
              { content: fullContent, role: "system", isStreaming: true }
            ];
            setSanitizedConversation(updatedMessages);
          },
          // 完成时调用
          (fullContent, messageId) => {
            // 保留最终的消息内容
            if (fullContent) {
              const finalMessages = [
                ...messages,
                { content: fullContent, role: "system" }
              ];
              setSanitizedConversation(finalMessages);
              setStreamingContent("");

              // 这里不立即fetchMessages，避免消息闪烁
              // 延迟一段时间后再刷新，确保数据库操作完成
              setTimeout(() => {
                fetchMessages(id);
              }, 500);
            }
          }
        );
      } else {
        // 使用非流式API
        const gptResponse = await getCompletion(messages, id);
        if (gptResponse) {
          const updatedMessages = [
            ...messages,
            { content: gptResponse, role: "system" },
          ];
          setSanitizedConversation(updatedMessages);

          // 延迟刷新消息
          setTimeout(() => {
            fetchMessages(id);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error in chat:", err);
      toast.error("Error sending message");
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const regenerateResponse = async () => {
    setIsLoadingResponse(true);
    try {
      // 移除最后一条系统消息（如果存在）
      let messagesForRegeneration = [...sanitizedConversation];
      if (messagesForRegeneration.length > 0 &&
        messagesForRegeneration[messagesForRegeneration.length - 1].role === "system") {
        messagesForRegeneration.pop();
      }

      if (useStream) {
        // 添加一个临时的空消息，用于流式显示
        const tempMessages = [
          ...messagesForRegeneration,
          { content: "", role: "system", isStreaming: true }
        ];
        setSanitizedConversation(tempMessages);
        setStreamingContent("");

        // 使用流式API
        await getCompletionStream(
          messagesForRegeneration,
          channelId,
          // 每次收到新块时调用
          (chunk, fullContent, messageId) => {
            setStreamingContent(fullContent);
            const updatedMessages = [
              ...messagesForRegeneration,
              { content: fullContent, role: "system", isStreaming: true }
            ];
            setSanitizedConversation(updatedMessages);
          },
          // 完成时调用
          (fullContent, messageId) => {
            // 保留最终的消息内容
            if (fullContent) {
              const finalMessages = [
                ...messagesForRegeneration,
                { content: fullContent, role: "system" }
              ];
              setSanitizedConversation(finalMessages);
              setStreamingContent("");

              // 延迟刷新
              setTimeout(() => {
                fetchMessages(channelId);
              }, 500);
            }
          }
        );
      } else {
        // 使用非流式API
        const gptResponse = await getCompletion(messagesForRegeneration, channelId);
        if (gptResponse) {
          const updatedMessages = [
            ...messagesForRegeneration,
            { content: gptResponse, role: "system" },
          ];
          setSanitizedConversation(updatedMessages);

          // 延迟刷新
          setTimeout(() => {
            fetchMessages(channelId);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error regenerating:", err);
      toast.error("Error regenerating response");
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.keyCode == 13 && !e.shiftKey) {
      sendMessage(e);
      e.preventDefault();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full pt-2">
      {channelId && !isLoadingResponse && (
        <div className="px-3 pt-2 pb-3 text-center text-xs text-purple_dark md:px-4 md:pt-3 md:pb-6">
          <Button
            icon={<CiRedo size="14" />}
            type="secondary"
            size="large"
            onClick={regenerateResponse}
            className="border border-1 rounded-lg text-purple_lighter border-purple_dark hover:bg-purple_dark"
          >
            Regenerate response
          </Button>
        </div>
      )}
      <form className="stretch mx-2 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
        <div className="h-full">
          <div className="bg-purple_dark rounded-md border border-purple_darker flex">
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message."
              autoSize={{ minRows: 1, maxRows: 5 }}
              bordered={false}
              className="m-0 w-full resize-none border-0 bg-transparent p-2 text-purple_lighter"
              disabled={isLoadingResponse}
            />
            <Button
              disabled={isLoadingResponse || message?.trim().length === 0}
              onClick={sendMessage}
              type="text"
              className="mr-1"
              icon={
                <FiSend className="text-purple_lighter m-1 w-5 h-5 hover:text-purple_darker" />
              }
            />
          </div>
          <div className="flex items-center justify-end mt-2 mr-2">
            <span className="text-xs text-purple_lighter mr-2">Streaming</span>
            <Switch
              size="small"
              checked={useStream}
              onChange={setUseStream}
              className={useStream ? "bg-purple_dark" : ""}
            />
          </div>
        </div>
      </form>
      <div className="px-3 pt-2 pb-3 text-center text-xs text-purple_dark md:px-4 md:pt-3 md:pb-6">
        <span>DeskMind is powered by OpenAI's API</span>
      </div>
    </div>
  );
};

export default Footer;
