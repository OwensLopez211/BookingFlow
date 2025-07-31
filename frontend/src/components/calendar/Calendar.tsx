import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  appointments?: { [key: string]: number };
}

export const Calendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onDateSelect, 
  appointments = {} 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = new Date(year, month, -i);
      days.push({
        date: prevDay,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const today = new Date();
      const isToday = currentDay.toDateString() === today.toDateString();
      const isSelected = currentDay.toDateString() === selectedDate.toDateString();

      days.push({
        date: currentDay,
        isCurrentMonth: true,
        isToday,
        isSelected,
      });
    }

    // Next month's days
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDay = new Date(year, month + 1, day);
      days.push({
        date: nextDay,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const getAppointmentCount = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return appointments[dateKey] || 0;
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            Hoy
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-1 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - Takes available height */}
      <div className="flex-1 grid grid-cols-7 gap-1 content-start min-h-[280px] lg:min-h-0">
        {days.slice(0, 35).map((day, index) => {
          const appointmentCount = getAppointmentCount(day.date);
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(day.date)}
              className={`
                relative p-1 h-8 text-xs font-medium rounded-md transition-all duration-200 group
                ${day.isCurrentMonth
                  ? day.isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : day.isToday
                    ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-600'
                    : 'text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 hover:bg-gray-50'
                }
              `}
            >
              <span className="relative z-10">{day.date.getDate()}</span>
              
              {/* Appointment indicator */}
              {appointmentCount > 0 && day.isCurrentMonth && (
                <div className={`
                  absolute bottom-0.5 left-1/2 transform -translate-x-1/2 
                  w-1 h-1 rounded-full
                  ${day.isSelected ? 'bg-white' : 'bg-blue-500'}
                `} />
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Legend */}
      <div className="flex items-center justify-center space-x-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <div className="w-2 h-2 bg-blue-100 rounded-full border border-blue-600"></div>
          <span>Hoy</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <div className="w-2 h-0.5 bg-blue-500 rounded-full"></div>
          <span>Con citas</span>
        </div>
      </div>
    </div>
  );
};