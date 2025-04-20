import React, { useState } from "react";
import { Modal, Typography, Input, Button } from "antd";
import { getItem, setItem } from "../../utils/localStorage";
import { API_KEY_NAME } from "../../constants";

const { Title, Text } = Typography;

const ApiKeyModal = ({ isModalOpen, setIsModalOpen }) => {
  const [apiKey, setApiKey] = useState(getItem(API_KEY_NAME) || "");

  const handleOk = () => {
    setItem(API_KEY_NAME, apiKey);
    window.location.reload();
  };

  const handleCancel = () => {
    if (!apiKey) {
      return setIsModalOpen(true);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setItem(API_KEY_NAME, "");
    window.location.reload();
  };

  return (
    <Modal
      className="modal-style"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Button
          danger
          onClick={handleDelete}
          disabled={!apiKey}
          className="bg-white border-red-500 text-red-500 hover:bg-red-50 rounded-md"
        >
          Delete
        </Button>,
        <Button
          key="submit"
          onClick={handleOk}
          disabled={!apiKey}
          type="primary"
          className="bg-accent hover:bg-accent_hover text-white rounded-md"
        >
          Submit
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Title level={3} className="text-gray-800">Settings</Title>
        <Text className="text-gray-600">
          API key
        </Text>
        <div className="mt-2">
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key"
            type="password"
            className="bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-accent text-gray-800 py-2 px-4 rounded-md w-full"
            size="large"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ApiKeyModal;
