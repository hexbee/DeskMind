import React from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { Button } from "antd";

const SideBarButton = ({ setShowSidebar, showSidebar }) => (
  <Button
    type="default"
    className="border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 z-50"
    onClick={() => setShowSidebar(!showSidebar)}
  >
    <AiOutlineMenu />
  </Button>
);

export default SideBarButton;
