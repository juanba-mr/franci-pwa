import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFAB({ sucursal, nombreCliente, className }) {
  const numeroWhatsApp = sucursal?.telefono_whatsapp || "5491100000000";
  const textoMensaje = `Hola! Te contacto desde la aplicación Hermes Seguros. Mi nombre es ${nombreCliente || ''}. Quería hacer una consulta sobre mi cobertura.`;
  const urlWhatsapp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(textoMensaje)}`;

  return (
    <motion.a
      href={urlWhatsapp}
      target="_blank"
      rel="noopener noreferrer"
      // Le pasamos className acá para poder controlarlo desde el Dashboard
      className={`z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl hover:bg-[#20ba56] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 ${className}`}
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 50 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.3
      }}
      whileHover={{
        scale: 1.15,
        rotate: 5
      }}
      whileTap={{ scale: 0.95 }}
      title="Contactar a mi sucursal"
    >
      <MessageCircle className="h-8 w-8 fill-white text-[#25D366]" />

    </motion.a>
  );
}