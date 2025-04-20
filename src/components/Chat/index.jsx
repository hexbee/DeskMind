import React, { useState } from "react";
import SideBar from "./SideBar";
import Conversation from "./Conversation";
import ApiKeyModal from "../Common/ApiKeyModal";
import { getItem } from "../../utils/localStorage";
import { API_KEY_NAME } from "../../constants";
import Landing from "../Common/Landing";

const Chat = () => {
  const apiKey = getItem(API_KEY_NAME);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(!apiKey);
  const [showSidebar, setShowSidebar] = useState(true);
  const [channelId, setChannelId] = useState(null);

  if (!apiKey) {
    return <Landing />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800">
      <div 
        className="transition-all duration-300 ease-in-out relative"
        style={{ 
          width: showSidebar ? '250px' : '0',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <div
          className="h-full w-[250px]"
          style={{
            transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
            opacity: showSidebar ? '1' : '0'
          }}
        >
          <SideBar
            isModalOpen={isApiKeyModalOpen}
            setIsModalOpen={setIsApiKeyModalOpen}
            setChannelId={setChannelId}
            channelId={channelId}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
          />
        </div>
      </div>
      <div 
        className="flex-1 overflow-hidden transition-all duration-300 ease-in-out"
      >
        <Conversation
          channelId={channelId}
          setChannelId={setChannelId}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
        />
      </div>
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isModalOpen={isApiKeyModalOpen}
          setIsModalOpen={setIsApiKeyModalOpen}
        />
      )}
    </div>
  );
};

export default Chat;
