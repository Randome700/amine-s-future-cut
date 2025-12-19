import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Reservation {
  id: string;
  phone: string;
  barber: string;
  services: string[];
  date: Date;
  totalTime: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'noshow' | 'completed';
  chair: number;
}

export interface ChairStatus {
  id: number;
  barber: string;
  status: 'available' | 'busy';
  currentReservation?: Reservation;
  busyUntil?: Date;
}

interface ReservationContextType {
  reservations: Reservation[];
  chairs: ChairStatus[];
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  updateReservationStatus: (id: string, status: Reservation['status']) => void;
  getWaitTime: (barber: string) => number;
  hasActiveReservation: (phone: string) => boolean;
}

const barbers = ['Amine', 'Motez', 'Rayan', 'Anas'];

const initialChairs: ChairStatus[] = barbers.map((barber, index) => ({
  id: index + 1,
  barber,
  status: Math.random() > 0.5 ? 'busy' : 'available',
  busyUntil: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 60 * 60 * 1000) : undefined,
}));

// Simulated initial reservations
const initialReservations: Reservation[] = [
  {
    id: '1',
    phone: '+21612345678',
    barber: 'Amine',
    services: ['haircut', 'beard'],
    date: new Date(Date.now() + 30 * 60 * 1000),
    totalTime: 50,
    totalPrice: 15,
    status: 'confirmed',
    chair: 1,
  },
  {
    id: '2',
    phone: '+21698765432',
    barber: 'Motez',
    services: ['haircut'],
    date: new Date(Date.now() + 60 * 60 * 1000),
    totalTime: 30,
    totalPrice: 10,
    status: 'pending',
    chair: 2,
  },
  {
    id: '3',
    phone: '+21655555555',
    barber: 'Rayan',
    services: ['styling'],
    date: new Date(Date.now() + 15 * 60 * 1000),
    totalTime: 15,
    totalPrice: 7,
    status: 'confirmed',
    chair: 3,
  },
];

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [chairs, setChairs] = useState<ChairStatus[]>(initialChairs);

  const addReservation = (reservation: Omit<Reservation, 'id'>) => {
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now().toString(),
    };
    setReservations(prev => [...prev, newReservation]);
    
    // Update chair status
    setChairs(prev => prev.map(chair => 
      chair.id === reservation.chair 
        ? { ...chair, status: 'busy' as const, busyUntil: new Date(reservation.date.getTime() + reservation.totalTime * 60 * 1000) }
        : chair
    ));
  };

  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => 
      r.id === id ? { ...r, status } : r
    ));
  };

  const getWaitTime = (barber: string): number => {
    const barberReservations = reservations.filter(
      r => r.barber === barber && r.status !== 'cancelled' && r.status !== 'noshow'
    );
    
    if (barberReservations.length === 0) return 0;
    
    const totalTime = barberReservations.reduce((acc, r) => {
      if (r.date > new Date()) {
        return acc + r.totalTime;
      }
      return acc;
    }, 0);
    
    return totalTime;
  };

  const hasActiveReservation = (phone: string): boolean => {
    return reservations.some(
      r => r.phone === phone && (r.status === 'pending' || r.status === 'confirmed')
    );
  };

  return (
    <ReservationContext.Provider value={{
      reservations,
      chairs,
      addReservation,
      updateReservationStatus,
      getWaitTime,
      hasActiveReservation,
    }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
