import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "526181169706";
const MESSAGE = "¡Hola! Me interesa un arreglo floral 🌻";

const WhatsAppButton = () => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] text-white px-5 py-3.5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group safe-bottom"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <MessageCircle className="h-6 w-6 fill-white" />
      <span className="hidden sm:inline text-sm font-semibold">¡Escríbenos!</span>
      
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/30 pointer-events-none" />
    </motion.a>
  );
};

export default WhatsAppButton;
