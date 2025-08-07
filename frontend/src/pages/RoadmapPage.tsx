import RoadmapHero from '@/components/roadmap/RoadmapHero';
import RoadmapTimeline from '@/components/roadmap/RoadmapTimeline';

const RoadmapPage = () => {
  // BookFlow Roadmap 2025 - Hoja de ruta temporal real
  const roadmapSteps = [
    {
      id: 1,
      title: "Sistema de Pagos",
      description: "Integración completa con procesadores de pago y sistema de suscripción simple. Gestión económica y eficiente de pagos para todos los negocios.",
      timeframe: "Mayo 2025",
      quarter: "Q1 2025",
      isCompleted: true,
      clientRequirement: "500+ reservas mensuales",
      features: [
        "Integración Oneclick",
        "Único Plan económico",
        "Reportes de ingresos en tiempo real",
        "Gestión de reembolsos",
        "Dashboard financiero"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 2,
      title: "Plataforma Web Core v1.0",
      description: "Sistema completo de gestión de citas web con dashboard administrativo, reservas online, notificaciones automatizadas y gestión de clientes.",
      timeframe: "Junio 2025",
      quarter: "Q1 2025",
      isCompleted: true,
      clientRequirement: "Disponible para todos",
      features: [
        "Dashboard administrativo completo",
        "Sistema de reservas online",
        "Notificaciones por email", 
        "Gestión de clientes y servicios",
        "Calendario integrado",
        "Reportes básicos"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 3,
      title: "Notificaciones WhatsApp Business",
      description: "Integración con WhatsApp Business API para confirmaciones, recordatorios y notificaciones automatizadas. Comunicación directa y efectiva con los clientes a través de su canal preferido.",
      timeframe: "Julio 2025",
      quarter: "Q2 2025",
      isActive: true,
      clientRequirement: "100+ clientes activos",
      features: [
        "WhatsApp Business API integrada",
        "Confirmaciones automáticas de citas",
        "Recordatorios 24h y 2h antes",
        "Notificaciones de cambios/cancelaciones",
        "Templates personalizables",
        "Métricas de entrega y lectura"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 4,
      title: "Aplicación Móvil iOS & Android",
      description: "Apps nativas para iOS y Android con funcionalidades completas. Notificaciones push, gestión offline, sincronización en tiempo real y experiencia optimizada para móvil.",
      timeframe: "Agosto 2025",
      quarter: "Q2 2025",
      isUpcoming: true,
      clientRequirement: "1,000+ usuarios registrados",
      features: [
        "App nativa iOS (Swift)",
        "App nativa Android (Kotlin)",
        "Notificaciones push inteligentes",
        "Modo offline con sincronización",
        "Geolocalización y navegación",
        "Cámara para documentos"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 5,
      title: "IA Predictiva & Automatización",
      description: "Sistema de inteligencia artificial para predicción de no-shows, optimización automática de horarios, recomendaciones personalizadas y detección de patrones de comportamiento.",
      timeframe: "Septiembre 2025",
      quarter: "Q2 2025",
      isUpcoming: true,
      clientRequirement: "5,000+ citas históricas",
      features: [
        "Predicción de no-shows con ML",
        "Optimización automática de agenda",
        "Recomendaciones de servicios",
        "Análisis predictivo de demanda",
        "Chatbot con NLP avanzado",
        "Detección de anomalías"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 6,
      title: "API Pública & Integraciones",
      description: "API RESTful completa para desarrolladores externos. SDK para múltiples lenguajes, webhooks, documentación interactiva y marketplace de integraciones con herramientas populares.",
      timeframe: "Octubre 2025",
      quarter: "Q3 2025",
      isUpcoming: true,
      clientRequirement: "50+ negocios activos",
      features: [
        "API REST v2.0 documentada",
        "SDK para JavaScript, Python, PHP",
        "Webhooks en tiempo real",
        "Documentación interactiva",
        "Rate limiting inteligente",
        "Marketplace de integraciones"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 7,
      title: "Marketing Automation Suite",
      description: "Herramientas avanzadas de marketing digital: email campaigns, segmentación de clientes, programas de fidelización, análisis de ROI y integración con redes sociales.",
      timeframe: "Noviembre 2025",
      quarter: "Q3 2025",
      isUpcoming: true,
      clientRequirement: "2,000+ clientes en base de datos",
      features: [
        "Email marketing automation",
        "Segmentación avanzada de clientes",
        "Programas de fidelización",
        "Campañas en redes sociales",
        "A/B testing integrado",
        "Analytics de marketing"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 8,
      title: "Business Intelligence & Analytics",
      description: "Dashboard ejecutivo con métricas avanzadas, reportes personalizables, análisis de tendencias, forecasting y KPIs en tiempo real para toma de decisiones estratégicas.",
      timeframe: "Enero 2026",
      quarter: "Q4 2025",
      isUpcoming: true,
      clientRequirement: "10,000+ transacciones",
      features: [
        "Dashboard ejecutivo avanzado",
        "Reportes personalizables",
        "Análisis de tendencias",
        "Forecasting con IA",
        "KPIs en tiempo real",
        "Exportación a múltiples formatos"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 9,
      title: "Expansión Internacional",
      description: "Soporte multi-idioma, múltiples monedas, adaptación a regulaciones locales, integración con proveedores de pago internacionales y customización regional.",
      timeframe: "Marzo 2026",
      quarter: "Q1 2026",
      isUpcoming: true,
      clientRequirement: "100+ negocios en Chile",
      features: [
        "Soporte multi-idioma (EN, PT, FR)",
        "Múltiples monedas",
        "Compliance regional",
        "Pagos internacionales",
        "Localización de UI/UX",
        "Soporte de husos horarios"
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <RoadmapHero />

      {/* Timeline Section */}
      <RoadmapTimeline steps={roadmapSteps} />

    </div>
  );
};

export default RoadmapPage;