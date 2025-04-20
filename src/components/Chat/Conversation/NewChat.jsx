import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

const NewChat = () => (
  <div className="relative w-full flex flex-col h-full">
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-1">
          <Text className="text-purple_lighter text-2xl text-center">
            Welcome to DeskMind
          </Text>
          <Text className="text-purple_lighter text-center">
            Your powerful assistant with the ability to use tools
          </Text>
        </div>
        <div className="border rounded-xl border-purple_dark">
          <ul className="p-2">
            <li>- Use your own API key</li>
            <li>- Conversations are stored locally</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default NewChat;
