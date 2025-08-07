import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    producto: [
      { name: 'Características', href: '/features' },
      { name: 'Precios', href: '/pricing' },
      { name: 'Roadmap', href: '/roadmap' },
      { name: 'Integraciones', href: '/integrations' }
    ],
    empresa: [
      { name: 'Acerca de', href: '/about' },
      { name: 'Contacto', href: '/contact' },
      { name: 'Nuestra historia', href: '/about/story' },

    ],
    recursos: [
      { name: 'Documentación', href: '/docs' },
      { name: 'Estado del Servicio', href: '/health' },
      { name: 'Centro de Ayuda', href: '/help' },
      { name: 'Comunidad', href: '/community' }
    ],
    legal: [
      { name: 'Privacidad', href: '/privacy' },
      { name: 'Términos', href: '/terms' },
      { name: 'Seguridad', href: '/security' }
    ]
  };

  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/bookflow',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'GitHub',
      href: 'https://github.com/bookflow',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/bookingflow_cl/',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12.017 0C8.396 0 7.989.013 6.77.072 5.554.131 4.728.333 3.999.63a6.09 6.09 0 0 0-2.188 1.425 6.09 6.09 0 0 0-1.425 2.188C.333 4.728.131 5.554.072 6.77.013 7.989 0 8.396 0 12.017c0 3.624.013 4.09.072 5.311.059 1.217.256 2.043.558 2.765.298.729.687 1.365 1.425 2.106.741.741 1.377 1.127 2.106 1.425.722.298 1.548.456 2.765.558 1.217.058 1.689.072 5.311.072 3.624 0 4.09-.015 5.311-.072 1.217-.102 2.043-.259 2.765-.558a6.09 6.09 0 0 0 2.106-1.425 6.09 6.09 0 0 0 1.425-2.106c.298-.722.456-1.548.558-2.765.058-1.22.072-1.687.072-5.311 0-3.621-.015-4.028-.072-5.311-.102-1.217-.259-2.043-.558-2.765a6.09 6.09 0 0 0-1.425-2.188A6.09 6.09 0 0 0 18.322.63C17.6.333 16.774.131 15.557.072 14.336.013 13.93 0 10.309 0h1.717z" clipRule="evenodd" />
          <path d="M12.017 5.838a6.179 6.179 0 1 0 0 12.358 6.179 6.179 0 0 0 0-12.358zM12.017 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.624-10.845a1.441 1.441 0 1 0 0 2.882 1.441 1.441 0 0 0 0-2.882z" />
        </svg>
      )
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-white to-gray-50 border-t border-gray-200 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.01)_25%,transparent_25%),linear-gradient(-45deg,rgba(0,0,0,0.01)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(0,0,0,0.01)_75%),linear-gradient(-45deg,transparent_75%,rgba(0,0,0,0.01)_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-radial from-blue-100/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-radial from-purple-100/20 to-transparent rounded-full blur-3xl"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand section */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            {/* Logo and brand */}
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center"
              >
                <span className="text-white font-bold text-lg">B</span>
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  BookFlow
                </h3>
                <p className="text-xs text-gray-500 font-medium">Gestión inteligente de citas</p>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 leading-relaxed max-w-sm">
              Transformamos la gestión de citas con tecnología inteligente. 
              Simplifica tu negocio, optimiza tu tiempo y crece sin límites.
            </p>

            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Newsletter
              </h4>
              <motion.form 
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex gap-2 max-w-sm"
              >
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2 bg-white/80 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  aria-label="Email para newsletter"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Suscribirse"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>
              </motion.form>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Síguenos:</span>
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md transition-all duration-200"
                    aria-label={`Síguenos en ${social.name}`}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Links sections */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-6">
            {Object.entries(footerLinks).map(([category, links], index) => (
              <motion.div key={category} variants={itemVariants}>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 capitalize flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  {category === 'producto' ? 'Producto' :
                   category === 'empresa' ? 'Empresa' :
                   category === 'recursos' ? 'Recursos' : 'Legal'}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm leading-relaxed hover:translate-x-1 transform transition-transform inline-block"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <motion.div
          variants={itemVariants}
          className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-500">
            <p>&copy; {currentYear} BookFlow. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Todos los sistemas operativos
              </span>
              <span className="hidden md:block text-gray-300">•</span>
              <span>Hecho con ❤️ en Chile</span>
            </div>
          </div>

        </motion.div>

        {/* Back to top button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-12 h-12 bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-xl transition-all duration-300 z-50"
          aria-label="Volver arriba"
        >
          <motion.svg
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </motion.svg>
        </motion.button>
      </motion.div>

      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "BookFlow",
            "description": "Plataforma inteligente de gestión de citas para negocios modernos",
            "url": "https://bookflow.cl",
            "logo": "https://bookflow.cl/logo.png",
            "foundingDate": "2024",
            "founders": [
              {
                "@type": "Person",
                "name": "BookFlow Team"
              }
            ],
            "sameAs": [
              "https://twitter.com/bookflow",
              "https://linkedin.com/company/bookflow",
              "https://github.com/bookflow",
              "https://instagram.com/bookflow"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["Spanish", "English"]
            },
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "CL"
            }
          })
        }}
      />
    </footer>
  );
};

export default Footer;