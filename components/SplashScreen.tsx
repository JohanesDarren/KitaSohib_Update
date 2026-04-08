import React from 'react';
import { motion } from 'framer-motion';
import { SohibCharacter } from './SohibCharacter';

export const SplashScreen: React.FC = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 via-blue-500 to-teal-400 text-white overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50, transition: { duration: 0.5, ease: "easeInOut" } }}
    >
      {/* Decorative Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1], 
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full blur-3xl opacity-10"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-teal-300 rounded-full blur-3xl opacity-10"
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1.5 
          }}
          className="mb-8 p-6 bg-white/20 backdrop-blur-md rounded-full shadow-2xl border border-white/30"
        >
          {/* Using the Mascot with a happy mood */}
          <SohibCharacter mood={5} className="w-32 h-32 drop-shadow-lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-md">
            KitaSohib<span className="text-teal-200">.</span>
          </h1>
          <motion.div 
            className="h-1 w-16 bg-white/50 mx-auto rounded-full mb-4"
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ delay: 1, duration: 0.8 }}
          />
          <p className="text-white/90 font-medium text-sm tracking-widest uppercase">
            Teman Cerita Kamu
          </p>
        </motion.div>
      </div>

      {/* Loading Indicator */}
      <motion.div 
        className="absolute bottom-12 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 bg-white rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};
