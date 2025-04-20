import React, { useState, useRef, useEffect } from "react";
import { TbMessages, TbDotsVertical, TbPinned, TbPinnedOff } from "react-icons/tb";
import { Button, Typography, Input, Modal } from "antd";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import dbOperations from "../db";
import { toast } from "react-toastify";

const ChannelItem = ({ channel, isActive, onClick, fetchChannels, setChannelId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [channelName, setChannelName] = useState(channel.name);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const channelRef = useRef(null);
  const { updateChannel, deleteChannel: deleteConversation, toggleChannelPin } = dbOperations;

  // Focus input field when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Add click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && 
          menuRef.current && 
          !menuRef.current.contains(event.target) &&
          channelRef.current &&
          !channelRef.current.contains(event.target)) {
        setShowMenu(false);
        setIsHovering(false); // Hide three dots button when closing menu
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Add simple listener for menu close state
  useEffect(() => {
    if (showMenu === false) {
      // Delay hiding the three dots button to ensure menu is fully closed
      setTimeout(() => {
        setIsHovering(false);
      }, 100);
    }
  }, [showMenu]);

  // Listen for scroll events to update menu position
  useEffect(() => {
    if (showMenu) {
      const handleScroll = () => {
        setMenuPosition(calculateMenuPosition());
      };
      
      // Get all possible scroll containers
      const scrollContainers = [
        document,
        document.querySelector('.overflow-y-auto'),
        channelRef.current?.closest('.overflow-y-auto')
      ].filter(Boolean);
      
      // Add scroll event listeners
      scrollContainers.forEach(container => {
        container.addEventListener('scroll', handleScroll);
      });
      
      return () => {
        // Remove scroll event listeners
        scrollContainers.forEach(container => {
          container.removeEventListener('scroll', handleScroll);
        });
      };
    }
  }, [showMenu]);

  // Add global click event handler
  useEffect(() => {
    const handleGlobalClick = (event) => {
      // If click is outside menu and channel item, hide hover state
      if (!channelRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsHovering(false);
        if (showMenu) {
          setShowMenu(false);
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [showMenu]);

  // Calculate menu position based on available space
  const calculateMenuPosition = () => {
    if (channelRef.current) {
      const rect = channelRef.current.getBoundingClientRect();
      
      // Check if there's enough space below
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 80; // Approximate menu height
      
      if (spaceBelow < menuHeight + 10) {
        // Not enough space below, show above
        return {
          left: rect.right - 120,
          top: rect.top - menuHeight - 5,
          position: 'top'
        };
      } else {
        // Enough space below, show underneath
        return {
          left: rect.right - 120,
          top: rect.bottom + 5,
          position: 'bottom'
        };
      }
    }
    return null;
  };

  const handleRename = async () => {
    if (channelName.trim() === '') {
      return;
    }
    
    try {
      await updateChannel(channel.id, channelName);
      setIsEditing(false);
      fetchChannels();
      toast.success("Channel renamed successfully");
    } catch (err) {
      toast.error("Error renaming channel");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConversation(channel.id);
      setChannelId(null);
      fetchChannels();
      toast.success("Channel deleted successfully");
    } catch (err) {
      toast.error("Error deleting channel");
    }
    setIsDeleteModalVisible(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setChannelName(channel.name);
    }
  };

  const handleTogglePin = async () => {
    try {
      const isPinned = await toggleChannelPin(channel.id);
      fetchChannels();
      toast.success(isPinned ? "Channel pinned" : "Channel unpinned");
    } catch (err) {
      console.error("Pin operation failed:", err);
      toast.error("Failed to update pin status. Please try again");
    }
  };

  return (
    <div 
      ref={channelRef}
      className={`relative border rounded-lg border-gray-300 hover:border-gray-400 w-full ${
        isActive ? "bg-gray-100" : "bg-white"
      } ${!isEditing ? "cursor-pointer" : ""}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        // Hide three dots button if mouse leaves and menu is not showing
        if (!showMenu) {
          setIsHovering(false);
        }
      }}
    >
      <div className={`flex items-center p-2 ${!isEditing ? "cursor-pointer" : ""}`} onClick={isEditing ? undefined : onClick}>
        {channel.pinned && (
          <TbPinned size="12" className="absolute -left-1 -top-1 text-blue-500 bg-white rounded-full" />
        )}
        <TbMessages size="14" className="mr-2 flex-shrink-0 text-gray-600" />
        
        {isEditing ? (
          <Input
            ref={inputRef}
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-grow"
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex-grow overflow-hidden relative max-w-[170px]">
            <Typography 
              className="text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis pr-6"
              title={channel.name}
            >
              {channel.name}
            </Typography>
            <div 
              className="absolute right-0 top-0 h-full w-12" 
              style={{ 
                background: isActive 
                  ? 'linear-gradient(to right, rgba(243,244,246,0), rgba(243,244,246,1) 70%)' 
                  : 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1) 70%)',
                pointerEvents: 'none'  
              }}
            ></div>
          </div>
        )}
        
        {isHovering && !isEditing && (
          <Button
            type="text"
            size="small"
            icon={<TbDotsVertical size="16" />}
            className="text-gray-500 hover:text-gray-700 ml-1 z-10 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              
              if (!showMenu) {
                // Calculate initial position
                const initialPosition = calculateMenuPosition();
                setMenuPosition(initialPosition);
                
                // Check if scrolling is needed to ensure menu visibility
                const needsScrolling = initialPosition && initialPosition.position === 'top';
                
                // If menu needs to display at top, scroll to center first
                if (needsScrolling) {
                  channelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  
                  // Recalculate position after scrolling
                  setTimeout(() => {
                    setMenuPosition(calculateMenuPosition());
                  }, 100);
                }
                
                setShowMenu(true);
              } else {
                setShowMenu(false);
              }
            }}
          />
        )}
      </div>
      
      {showMenu && menuPosition && (
        <div 
          ref={menuRef}
          className={`fixed py-1 bg-white rounded-md shadow-lg border border-gray-200 ${menuPosition.position === 'top' ? 'menu-top' : 'menu-bottom'}`}
          style={{ 
            zIndex: 9999, 
            width: '120px',
            left: `${menuPosition.left}px`,
            top: `${menuPosition.top}px`,
            transition: 'top 0.2s ease, opacity 0.1s ease',
            animation: 'fadeIn 0.1s ease'
          }}
        >
          <Button 
            type="text" 
            block 
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            icon={channel.pinned ? <TbPinnedOff size="14" className="mr-2" /> : <TbPinned size="14" className="mr-2" />}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              setIsHovering(false);
              handleTogglePin();
            }}
          >
            {channel.pinned ? "Unpin" : "Pin"}
          </Button>
          <Button 
            type="text" 
            block 
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            icon={<FiEdit2 size="14" className="mr-2" />}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              setIsEditing(true);
              setIsHovering(false); // Hide three dots icon
            }}
          >
            Rename
          </Button>
          <Button 
            type="text" 
            block
            danger
            className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-100"
            icon={<FiTrash2 size="14" className="mr-2" />}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              setIsDeleteModalVisible(true);
              setIsHovering(false); // Hide three dots icon
            }}
          >
            Delete
          </Button>
        </div>
      )}

      <Modal
        title="Delete Confirmation"
        open={isDeleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ChannelItem; 