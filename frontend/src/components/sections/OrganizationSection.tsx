import React from 'react';
import RotatingText from '@/components/ui/RotatingText';

export const OrganizationSection: React.FC = () => {
  const businessTypes = [
    'barbería',
    'salón de belleza', 
    'consultorio',
    'spa',
    'clínica',
    'centro médico',
    'estudio de tatuajes',
    'gimnasio',
    'centro de estética'
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100 lg:relative lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Organizamos la agenda de tu{' '}
          <RotatingText
            texts={businessTypes}
            mainClassName="px-3 py-1 bg-blue-500 text-white overflow-hidden rounded-lg inline-flex"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          BookFlow se adapta a cualquier tipo de negocio que maneje citas y reservas. 
          Simplifica tu gestión diaria con nuestro sistema intuitivo y potente.
        </p>
      </div>
    </section>
  );
};