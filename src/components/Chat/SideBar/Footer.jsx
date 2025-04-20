import React from "react";
import { FiGithub } from "react-icons/fi";
import { Button } from "antd";

const Footer = ({ isModalOpen, setIsModalOpen }) => (
  <div className="flex space-x-2 m-2">
    <Button
      type="secondary"
      className="border border-1 rounded-lg text-purple_lighter border-purple_dark w-full hover:bg-purple_dark"
      onClick={() => setIsModalOpen(!isModalOpen)}
    >
      Settings
    </Button>
    <Button
      type="secondary"
      className="border border-1 rounded-lg text-purple_lighter border-purple_dark hover:bg-purple_dark"
      href="https://github.com/hexbee/DeskMind"
      target="_blank"
    >
      <FiGithub className="mt-1" />
    </Button>
  </div>
);

export default Footer;
