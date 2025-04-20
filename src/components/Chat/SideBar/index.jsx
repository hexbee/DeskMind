import React from "react";
import Header from "./Header";
import Channels from "./Channels";
import Footer from "./Footer";

const SideBar = ({
  isModalOpen,
  setIsModalOpen,
  channelId,
  setChannelId,
  showSidebar,
  setShowSidebar,
}) => (
  <div className="border-r border-gray-300 h-full">
    <div
      className="grid grid-rows-[auto,1fr,auto] h-screen overflow-visible"
      style={{ width: '250px', zIndex: 10 }}
    >
      <div className="border-b border-gray-300">
        <Header
          setChannelId={setChannelId}
          setShowSidebar={setShowSidebar}
          showSidebar={showSidebar}
        />
      </div>
      <div className="h-full overflow-y-auto pb-24">
        <Channels setChannelId={setChannelId} channelId={channelId} />
      </div>
      <div className="border-t border-gray-300 self-end absolute bottom-0 w-full bg-white">
        <Footer isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      </div>
    </div>
  </div>
);

export default SideBar;
