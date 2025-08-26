"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RocketOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

export const loadingMessages = [
  "Analyzing your business details...",
  "Crafting compelling hooks...",
  "Optimizing for your target audience...",
  "Generating platform-specific variations...",
  "Adding emotional triggers...",
  "Finalizing your high-converting copy..."
];

export const LoadingAnimation = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => 
        prev === loadingMessages.length - 1 ? 0 : prev + 1
      );
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div 
        animate={{ 
          rotate: 360,
          transition: { 
            repeat: Infinity, 
            ease: "linear", 
            duration: 2 
          } 
        }}
        className="mb-6"
      >
        <RocketOutlined className="text-4xl text-blue-500" />
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={loadingMessages[currentMessageIndex]}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-lg font-medium mb-2 text-center"
        >
          {loadingMessages[currentMessageIndex]}
        </motion.div>
      </AnimatePresence>
      
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          transition: { repeat: Infinity, duration: 1.5 }
        }}
        className="mt-4 text-gray-500 text-sm"
      >
        This usually takes 10-30 seconds...
      </motion.div>
    </motion.div>
  );
};