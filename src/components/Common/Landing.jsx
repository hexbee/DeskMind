import React, { useState } from "react";
import { Typography, Input, Button, Select } from "antd";
import { API_KEY_NAME, API_BASE_URL_NAME, DEFAULT_API_BASE_URL, MODEL_NAME, DEFAULT_MODEL, AVAILABLE_MODELS } from "../../constants";
import { setItem, getItem } from "../../utils/localStorage";
const { Text, Title } = Typography;

const Landing = () => {
  const [apiKey, setApiKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(getItem(API_BASE_URL_NAME) || "");
  const [model, setModel] = useState(getItem(MODEL_NAME) || DEFAULT_MODEL);

  const handleSubmit = () => {
    setItem(API_KEY_NAME, apiKey);
    if (apiBaseUrl && apiBaseUrl.trim() !== "") {
      setItem(API_BASE_URL_NAME, apiBaseUrl);
    } else {
      // 如果用户未设置自定义URL，则删除现有值以使用默认值
      localStorage.removeItem(API_BASE_URL_NAME);
    }

    if (model) {
      setItem(MODEL_NAME, model);
    } else {
      setItem(MODEL_NAME, DEFAULT_MODEL);
    }

    window.location.reload();
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <Title level={2} className="text-gray-800 text-center mb-8">Welcome to DeskMind</Title>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API Key"
              type="password"
              className="bg-gray-50 border-gray-300 hover:border-gray-400 focus:border-accent text-gray-800 py-2 px-4 rounded-md w-full"
              size="large"
            />
          </div>

          <div className="space-y-2">
            <Select
              value={model}
              onChange={(value) => setModel(value)}
              placeholder="Select model"
              style={{ width: '100%' }}
              options={AVAILABLE_MODELS}
              size="large"
              dropdownStyle={{
                background: '#ffffff',
                color: '#333333'
              }}
              className="bg-gray-50 text-gray-800 rounded-md border-gray-300 hover:border-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder={`API Base URL (Default: ${DEFAULT_API_BASE_URL})`}
              className="bg-gray-50 border-gray-300 hover:border-gray-400 focus:border-accent text-gray-800 py-2 px-4 rounded-md w-full"
              size="large"
            />
            <Text className="text-gray-500 text-xs opacity-70">(Optional) Custom API Endpoint</Text>
          </div>

          <Button
            key="submit"
            onClick={handleSubmit}
            disabled={!apiKey}
            type="primary"
            size="large"
            className="bg-accent hover:bg-accent_hover text-white w-full mt-6 h-12 rounded-md font-medium"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
