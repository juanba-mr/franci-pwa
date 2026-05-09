import React from 'react';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5491112345678'; // Replace with Franci's actual number
const WHATSAPP_MESSAGE = 'Hola Franci, te contacto desde la app de Hermes Asesores.';

export default function WhatsAppFAB() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-5 w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center z-50 active:scale-90 transition-transform duration-150"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </a>
  );
}