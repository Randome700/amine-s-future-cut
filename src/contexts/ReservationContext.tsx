import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Reservation {
  id: string;
  clientName: string;
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
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservationStatus: (id: string, status: Reservation['status']) => Promise<void>;
  getWaitTime: (barber: string) => number;
  hasActiveReservation: (phone: string) => boolean;
  loading: boolean;
  totalEarnings: number;
  todayEarnings: number;
}

const barbers = ['Amine', 'Motez', 'Rayan', 'Anas'];

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate chair status based on current reservations
  const chairs: ChairStatus[] = barbers.map((barber, index) => {
    const now = new Date();
    const activeReservation = reservations.find(
      (r) => r.barber === barber && 
      r.status === 'confirmed' && 
      r.date <= now && 
      new Date(r.date.getTime() + r.totalTime * 60000) > now
    );
    
    return {
      id: index + 1,
      barber,
      status: activeReservation ? 'busy' : 'available',
      currentReservation: activeReservation,
      busyUntil: activeReservation 
        ? new Date(activeReservation.date.getTime() + activeReservation.totalTime * 60000)
        : undefined,
    };
  });

  // Calculate earnings
  const totalEarnings = reservations
    .filter((r) => r.status === 'confirmed' || r.status === 'completed')
    .reduce((acc, r) => acc + r.totalPrice, 0);

  const todayEarnings = reservations
    .filter((r) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reservationDate = new Date(r.date);
      reservationDate.setHours(0, 0, 0, 0);
      return reservationDate.getTime() === today.getTime() && 
             (r.status === 'confirmed' || r.status === 'completed');
    })
    .reduce((acc, r) => acc + r.totalPrice, 0);

  // Fetch reservations from database
  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: true });

      if (error) {
        console.error('Error fetching reservations:', error);
        return;
      }

      const mappedReservations: Reservation[] = (data || []).map((r) => ({
        id: r.id,
        clientName: r.client_name,
        phone: r.phone,
        barber: r.barber,
        services: r.services,
        date: new Date(r.reservation_date),
        totalTime: r.total_time,
        totalPrice: Number(r.total_price),
        status: r.status as Reservation['status'],
        chair: r.chair,
      }));

      setReservations(mappedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchReservations();

    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addReservation = async (reservation: Omit<Reservation, 'id'>) => {
    try {
      const { error } = await supabase.from('reservations').insert({
        client_name: reservation.clientName,
        phone: reservation.phone,
        barber: reservation.barber,
        services: reservation.services,
        reservation_date: reservation.date.toISOString(),
        total_time: reservation.totalTime,
        total_price: reservation.totalPrice,
        status: reservation.status,
        chair: reservation.chair,
      });

      if (error) {
        console.error('Error adding reservation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error adding reservation:', error);
      throw error;
    }
  };

  const updateReservationStatus = async (id: string, status: Reservation['status']) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Error updating reservation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  };

  const getWaitTime = (barber: string): number => {
    const now = new Date();
    const barberReservations = reservations.filter(
      (r) => r.barber === barber && 
      r.status !== 'cancelled' && 
      r.status !== 'noshow' &&
      r.date > now
    );

    if (barberReservations.length === 0) return 0;

    return barberReservations.reduce((acc, r) => acc + r.totalTime, 0);
  };

  const hasActiveReservation = (phone: string): boolean => {
    return reservations.some(
      (r) => r.phone === phone && (r.status === 'pending' || r.status === 'confirmed')
    );
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        chairs,
        addReservation,
        updateReservationStatus,
        getWaitTime,
        hasActiveReservation,
        loading,
        totalEarnings,
        todayEarnings,
      }}
    >
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