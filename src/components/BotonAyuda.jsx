import React, { useState, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function BotonAyuda({ contexto }) {
    const [instruccionesNavegador, setInstruccionesNavegador] = useState(null);

    useEffect(() => {
        const detectarNavegador = () => {
            const ua = navigator.userAgent.toLowerCase();

            if (/iphone|ipad|ipod/.test(ua)) {
                return (
                    <>
                        <b>🍎 En tu iPhone / iPad:</b><br />
                        Apple requiere que la app esté en tu inicio para enviarte alertas.<br /><br />
                        1. Tocá el ícono de <b>Compartir</b> (el cuadradito con la flecha).<br />
                        2. Seleccioná <b>"Agregar a inicio"</b>.<br />
                        3. Abrí la app desde el nuevo ícono en tu pantalla, iniciá sesión y ¡listo!
                    </>
                );
            }
            if (/android/.test(ua)) {
                return (
                    <>
                        <b>🤖 En tu Android:</b><br /><br />
                        1. Tocá el <b>candadito</b> a la izquierda de la barra web de arriba.<br />
                        2. Entrá a <b>Permisos</b> o <b>Configuración del sitio</b>.<br />
                        3. Buscá "Notificaciones" y cambialo a <b>Permitir</b>.
                    </>
                );
            }
            if (ua.includes('edg')) {
                return (
                    <>
                        <b>🌊 En Microsoft Edge:</b><br /><br />
                        1. Hacé clic en el <b>candadito</b> en la barra de direcciones.<br />
                        2. Seleccioná <b>Permisos para este sitio</b>.<br />
                        3. En la lista, poné "Notificaciones" en <b>Permitir</b>.
                    </>
                );
            }

            // La regla de Brave TIENE que ir antes que la de Chrome
            if (navigator.brave || ua.includes('brave')) {
                return (
                    <>
                        <b>🦁 En Brave:</b><br />
                        Brave bloquea el motor de notificaciones por privacidad.<br /><br />
                        1. Escribí <b>brave://settings/privacy</b> en la barra superior.<br />
                        2. Activá la opción <b>"Usar los servicios de Google para la mensajería push"</b>.<br />
                        3. Hacé clic en el <b>candadito</b> y poné Notificaciones en <b>Permitir</b>.<br />
                        4. Recargá la página.
                    </>
                );
            }

            if (ua.includes('chrome')) {
                return (
                    <>
                        <b>🌐 En Google Chrome:</b><br /><br />
                        1. Hacé clic en el ícono de <b>Configuración</b> (candadito) a la izquierda de la dirección web.<br />
                        2. Buscá "Notificaciones" y activá el interruptor a <b>Permitir</b>.<br />
                        3. Recargá la página.
                    </>
                );
            }
            if (ua.includes('safari')) {
                return (
                    <>
                        <b>🧭 En Safari (Mac):</b><br /><br />
                        1. En la barra de arriba, andá a <b>Safari &gt; Configuración</b>.<br />
                        2. Hacé clic en la pestaña <b>Sitios web</b> y elegí <b>Notificaciones</b> en la izquierda.<br />
                        3. Buscá esta página y cambiala a <b>Permitir</b>.
                    </>
                );
            }
            if (ua.includes('firefox')) {
                return (
                    <>
                        <b>🦊 En Firefox:</b><br /><br />
                        1. Hacé clic en el candadito en la barra de direcciones.<br />
                        2. Eliminá el bloqueo de notificaciones o andá a los ajustes para <b>Permitir</b>.
                    </>
                );
            }

            return (
                <>
                    <b>🌐 En tu navegador:</b><br /><br />
                    1. Hacé clic en el ícono a la izquierda de la barra de direcciones de arriba.<br />
                    2. Buscá "Notificaciones" y cambialo a <b>Permitir</b>.<br />
                    3. Recargá la página.
                </>
            );
        };

        setInstruccionesNavegador(detectarNavegador());
    }, []);

    const explicaciones = {
        ingesta: {
            titulo: "Centro de Ingesta",
            texto: "En esta pantalla podés cargar la información al sistema:\n\n• PDFs (Una póliza): Arrastrá el PDF, la IA lo lee, te deja revisar los datos y lo guardás.\n\n• Excel/CSV (Masivo): Subí el archivo entero que te da la aseguradora. El sistema carga todos los clientes juntos en la base de datos de una sola pasada."
        },
        dashboard: {
            titulo: "Panel de Control",
            texto: "Acá tenés el resumen de todo tu negocio. Los gráficos se arman solos en base a las pólizas que marcás como 'Vigentes'.\n\nSi ves pólizas a vencer, podés usar el botón de WhatsApp para avisarle al cliente con un mensaje automático."
        },
        clientes: {
            titulo: "Gestión de Clientes",
            texto: "Buscá a cualquier cliente por DNI o Nombre. Entrando a su perfil vas a ver su historial de pólizas y si debe algo o está al día."
        },
        dashboard_cliente: {
            titulo: "Tu Centro de Seguros",
            texto: "¡Bienvenido a tu panel personal! Acá podés:\n\n• Ver tus pólizas: Revisá qué tenés asegurado y cuándo vence.\n\n• Estado de Pago: Si ves el escudo verde, estás al día. Si está en rojo, contactate con tu productor.\n\n• Emergencias: Tenés los botones de asistencia mecánica a mano para llamar directo."
        },
        default: {
            titulo: "Ayuda de Hermes",
            texto: "Si tenés algún problema con esta pantalla, recargá la página o contactate con el soporte técnico."
        }
    };

    const contenido = explicaciones[contexto] || explicaciones.default;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    className="fixed bottom-24 right-6 w-12 h-12 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-500 hover:scale-110 transition-all z-50 ring-4 ring-yellow-400/20"
                    aria-label="Ayuda"
                >
                    <HelpCircle className="w-6 h-6" />
                </button>
            </SheetTrigger>

            <SheetContent side="right" className="bg-background border-l-4 border-l-yellow-400 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <HelpCircle className="w-5 h-5 text-yellow-500" />
                        {contenido.titulo}
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {contenido.texto}
                </div>

                <div className="mt-8 p-4 bg-muted/50 border rounded-xl">
                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
                        <Info className="w-4 h-4 text-emerald-500" />
                        ¿No te llegan las notificaciones?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {instruccionesNavegador}
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}