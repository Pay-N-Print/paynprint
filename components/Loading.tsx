// import { motion } from "framer-motion";
// import Robot from "../components/Robot";
// export default function Loading({ text }: { text: string }) {
//   return (
//     <div
//       className="w-screen h-screen flex items-center justify-center bg-[
// #F7F5EF]"
//     >
//       <motion.div
//         className="absolute inset-0"
//         style={{
//           backgroundImage:
//             "radial-gradient(circle at 50% 50%, #1F2A4410 0%, transparent 50%)",
//         }}
//         animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
//         transition={{ duration: 2, repeat: Infinity }}
//       />
//       <div
//         className="relative flex flex-col items-center justify-center"
//         style={{ width: "650px", height: "350px" }}
//       >
//         <Robot size="small" />
//         {/* Spinner */}
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//           className="mb-6"
//         >
//           <div className="relative">
//             <div
//               className="w-20 h-20 border-4 border-[
// #1F2A44]/20 rounded-full"
//             />
//             <div
//               className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-[
// #FFBF00] rounded-full"
//             />
//           </div>
//         </motion.div>
//         {/* Text */}
//         <motion.h2
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-2xl font-bold text-[
// #1F2A44] mb-2 font-cormorant"
//         >
//           {text}
//         </motion.h2>
//         {/* Loading Dots */}
//         <div className="flex gap-2 mt-4">
//           {[0, 1, 2].map((i) => (
//             <motion.div
//               key={i}
//               className="w-3 h-3 bg-[
// #FFBF00] rounded-full"
//               animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
//               transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { motion } from "framer-motion";
import Robot from "./Robot";

export default function Loading({ text }: { text: string }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#F7F5EF]"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {/* Background animation */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #1F2A4410 0%, transparent 50%)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      {/* Content container - responsive */}
      <div className="relative flex flex-col items-center justify-center max-w-162.5 w-full px-4">
        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-6"
          aria-hidden="true"
        >
          <div className="relative">
            <div className="w-30 h-30 border-4 border-[#1F2A44]/20 rounded-full" />
            <div className="absolute inset-0 w-30 h-30 border-4 border-transparent border-t-[#FFBF00] rounded-full" />
          </div>
        </motion.div>
        <div className="absolute top-5">
          <Robot size="small" />
        </div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl flex font-bold text-[#1F2A44] mb-2 font-cormorant text-center"
        >
          {text}
          <div className="flex gap-2 mt-5 ml-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 bg-[#FFBF00] rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.h2>

        {/* Loading Dots */}
      </div>

      {/* Screen reader text */}
      <span className="sr-only">{text}</span>
    </div>
  );
}
