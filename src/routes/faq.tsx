import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Calendar,
  Clock,
  CreditCard,
  Truck,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const WHATSAPP_NUMBER = "526181169706";
const WHATSAPP_MSG =
  "¡Hola! Tengo una duda sobre los arreglos florales 🌻 (ya leí las preguntas frecuentes)";

export const Route = createFileRoute("/faq")({
  component: FAQ,
  head: () => ({
    meta: [
      { title: "Preguntas Frecuentes - Florería Girasoles" },
      {
        name: "description",
        content:
          "Resuelve tus dudas: tiempos de entrega, anticipación de pedidos, métodos de pago, cancelaciones y más en Florería Girasoles.",
      },
      { property: "og:title", content: "Preguntas Frecuentes - Florería Girasoles" },
      {
        property: "og:description",
        content: "Toda la información que necesitas antes de hacer tu pedido floral.",
      },
    ],
  }),
});

const sections: {
  icon: typeof Calendar;
  title: string;
  color: string;
  items: { q: string; a: string }[];
}[] = [
  {
    icon: Calendar,
    title: "Anticipación y Pedidos",
    color: "text-primary",
    items: [
      {
        q: "¿Con cuánta anticipación debo realizar mi pedido?",
        a: "Todos los pedidos deben realizarse con al menos 10 días de anticipación a la fecha de entrega. Esto nos permite asegurar la frescura de las flores, conseguir las variedades exactas y prepararte un arreglo perfecto.",
      },
      {
        q: "¿Qué pasa si necesito un pedido urgente (menos de 10 días)?",
        a: "Aceptamos pedidos urgentes sujetos a disponibilidad, pero se aplica un cargo extra por urgencia. El monto exacto depende del tipo de arreglo y la fecha. Contáctanos por WhatsApp para confirmar disponibilidad y costo.",
      },
      {
        q: "¿Puedo apartar mi pedido para una fecha específica?",
        a: "Sí. Te recomendamos apartar con la mayor anticipación posible, especialmente para fechas de alta demanda como 14 de febrero, 10 de mayo, XV años y bodas.",
      },
      {
        q: "¿Cómo confirmo que mi pedido está apartado?",
        a: "Una vez que realizas el pedido en línea o por WhatsApp, recibirás una confirmación. El pedido se considera apartado cuando se realiza el anticipo correspondiente.",
      },
    ],
  },
  {
    icon: Truck,
    title: "Entregas",
    color: "text-accent",
    items: [
      {
        q: "¿A qué zonas entregan?",
        a: "Realizamos entregas en toda la ciudad de Durango. Para zonas fuera de la ciudad, consúltanos previamente por WhatsApp para confirmar disponibilidad y costo de envío.",
      },
      {
        q: "¿Cuál es el horario de entrega?",
        a: "Las entregas se realizan de lunes a sábado de 9:00 am a 7:00 pm. Puedes solicitar un horario específico al hacer tu pedido y haremos lo posible por cumplirlo.",
      },
      {
        q: "¿Tiene costo el envío?",
        a: "El costo de envío depende de la zona de entrega dentro de Durango. Te confirmaremos el monto exacto al momento de procesar tu pedido.",
      },
      {
        q: "¿Puedo recoger mi pedido en la florería?",
        a: "¡Claro! Puedes recoger tu arreglo sin costo adicional. Coordinamos contigo el horario exacto de recolección.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Pagos",
    color: "text-primary",
    items: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos efectivo, transferencia bancaria (SPEI), y depósito. Para pedidos grandes solicitamos un anticipo del 50% para apartar la fecha y el resto al momento de la entrega.",
      },
      {
        q: "¿Necesito pagar todo por adelantado?",
        a: "Para pedidos pequeños (un arreglo individual) puede pagarse contra entrega. Para pedidos grandes (bodas, XV, eventos), pedimos un anticipo del 50% para apartar la fecha.",
      },
      {
        q: "¿Emiten factura?",
        a: "Sí, emitimos factura electrónica. Solicítala al momento de hacer tu pedido proporcionando tus datos fiscales.",
      },
    ],
  },
  {
    icon: RefreshCw,
    title: "Cambios y Cancelaciones",
    color: "text-accent",
    items: [
      {
        q: "¿Puedo cancelar mi pedido?",
        a: "Las cancelaciones con más de 7 días de anticipación se reembolsan al 100%. Entre 3 y 7 días, se reembolsa el 50%. Con menos de 3 días, no aplica reembolso debido a que ya se compraron las flores.",
      },
      {
        q: "¿Puedo hacer cambios a mi pedido?",
        a: "Sí, puedes modificar tu pedido siempre y cuando lo solicites con al menos 5 días de anticipación a la fecha de entrega y la modificación esté disponible.",
      },
      {
        q: "¿Qué pasa si no estoy satisfecho con mi arreglo?",
        a: "Tu satisfacción es nuestra prioridad. Si hay algún problema con tu arreglo, contáctanos en las primeras 24 horas y buscaremos una solución (reposición, ajuste o reembolso parcial según el caso).",
      },
    ],
  },
  {
    icon: Sparkles,
    title: "Productos y Personalización",
    color: "text-primary",
    items: [
      {
        q: "¿Puedo personalizar un arreglo?",
        a: "¡Por supuesto! Trabajamos arreglos a la medida. Contáctanos por WhatsApp con tu idea (colores, flores favoritas, presupuesto) y te enviamos una propuesta.",
      },
      {
        q: "¿Manejan eventos grandes (bodas, XV años)?",
        a: "Sí, nos especializamos en eventos. Para estos casos te recomendamos contactarnos con al menos 1 mes de anticipación para diseñar todo a detalle.",
      },
      {
        q: "¿Las flores son frescas?",
        a: "Trabajamos solo con flores frescas seleccionadas el mismo día o el día anterior a tu entrega. Garantizamos calidad en cada arreglo.",
      },
      {
        q: "¿Cuánto duran las flores?",
        a: "La duración depende del tipo de flor y los cuidados, pero en promedio nuestros arreglos lucen frescos entre 5 y 10 días siguiendo nuestras recomendaciones de cuidado (cambio de agua, lugar fresco, lejos del sol directo).",
      },
    ],
  },
];

function FAQ() {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-12 sm:py-20">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider mb-4">
              <HelpCircle className="h-3.5 w-3.5" />
              Información importante
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
              Preguntas <span className="text-primary">Frecuentes</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Resuelve todas tus dudas antes de hacer tu pedido. Si no encuentras lo que buscas, escríbenos por WhatsApp.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Highlight: Anticipación */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-primary/5 p-5 sm:p-7 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-accent/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-foreground mb-2">
                Pedidos con 10 días de anticipación
              </h2>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                Para garantizar la <strong>frescura</strong> de las flores y la <strong>calidad</strong> del arreglo,
                todos los pedidos deben realizarse con <strong>mínimo 10 días de anticipación</strong> a la fecha de entrega.
                Pedidos urgentes (menos de 10 días) están sujetos a disponibilidad y aplica un{" "}
                <strong className="text-accent">cargo extra por urgencia</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 sm:space-y-12">
        {sections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: sIdx * 0.05 }}
          >
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-card border border-border flex items-center justify-center ${section.color}`}>
                <section.icon className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {section.title}
              </h2>
            </div>
            <Accordion type="single" collapsible className="space-y-2 sm:space-y-3">
              {section.items.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`${sIdx}-${i}`}
                  className="border border-border rounded-xl bg-card px-4 sm:px-5 data-[state=open]:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-foreground hover:no-underline py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border p-6 sm:p-10 text-center"
        >
          <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/15 items-center justify-center mb-4">
            <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">
            ¿No encontraste tu respuesta?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-md mx-auto">
            Estamos para ayudarte. Escríbenos por WhatsApp y te respondemos lo antes posible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#25D366] text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <MessageCircle className="h-5 w-5 fill-white" />
              Escríbenos por WhatsApp
            </a>
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border bg-card text-foreground font-semibold hover:bg-muted/50 transition-all"
            >
              <Clock className="h-5 w-5" />
              Ver catálogo
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
