import React, { useEffect, useState } from "react";
import { Typography, Divider } from "antd";
import { TbPinned } from "react-icons/tb";
import dbOperations from "../db";
import ChannelItem from "./ChannelItem";
import { toast } from "react-toastify";

const Channels = ({ setChannelId, channelId }) => {
  const [channels, setChannels] = useState([]);
  const { getChannels, ensureChannelsPinned } = dbOperations;

  const fetchChannels = async () => {
    try {
      // Ensure all channels have the pinned property
      await ensureChannelsPinned();
      const channels = await getChannels();
      setChannels(channels);
    } catch (err) {
      console.error("Failed to load channels:", err);
      toast.error("Failed to load channels");
    }
  };
  
  useEffect(() => {
    fetchChannels();
  }, []);

  // Add periodic refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchChannels();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Separate pinned and unpinned channels
  const pinnedChannels = channels.filter(channel => channel.pinned);
  const unpinnedChannels = channels.filter(channel => !channel.pinned);

  return (
    <div className="m-2 space-y-3 overflow-hidden pb-16">
      {channels.length === 0 ? (
        <Typography className="text-gray-500 text-center text-sm p-2">
          No conversations yet
        </Typography>
      ) : (
        <>
          {pinnedChannels.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center px-1">
                {/* <TbPinned size="12" className="text-gray-500 mr-1" /> */}
                <Typography.Text className="text-xs text-gray-500 uppercase tracking-wider">
                  Pinned
                </Typography.Text>
              </div>
              {pinnedChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isActive={channel.id === channelId}
                  onClick={() => setChannelId(channel.id)}
                  fetchChannels={fetchChannels}
                  setChannelId={setChannelId}
                />
              ))}
            </div>
          )}
          
          {pinnedChannels.length > 0 && unpinnedChannels.length > 0 && (
            <Divider className="my-3" style={{ marginTop: '12px', marginBottom: '12px' }} />
          )}
          
          {unpinnedChannels.length > 0 && (
            <div className="space-y-2">
              {pinnedChannels.length > 0 && (
                <Typography.Text className="text-xs text-gray-500 uppercase tracking-wider px-1">
                  All Channels
                </Typography.Text>
              )}
              {unpinnedChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isActive={channel.id === channelId}
                  onClick={() => setChannelId(channel.id)}
                  fetchChannels={fetchChannels}
                  setChannelId={setChannelId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Channels;
