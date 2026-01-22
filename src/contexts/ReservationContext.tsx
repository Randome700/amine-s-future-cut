import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  cancelReservation: (id: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  getWaitTime: (barber: string) => number;
  hasActiveReservation: (phone: string) => boolean;
  isBarberBusyAt: (barber: string, dateTime: Date, duration: number) => boolean;
  getAvailableBarberAt: (dateTime: Date, duration: number) => string | null;
  isPhoneBanned: (phone: string) => Promise<boolean>;
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

  // Cleanup expired reservations (30 min after service ends or end of day)
  const cleanupExpiredReservations = useCallback(async () => {
    const now = new Date();
    
    // Get all reservations
    const { data: allReservations, error } = await supabase
      .from('reservations')
      .select('*');
    
    if (error) {
      console.error('Error fetching reservations for cleanup:', error);
      return;
    }

    const idsToDelete: string[] = [];
    
    for (const r of allReservations || []) {
      const reservationDate = new Date(r.reservation_date);
      const serviceEndTime = new Date(reservationDate.getTime() + r.total_time * 60000);
      const deleteAfterTime = new Date(serviceEndTime.getTime() + 30 * 60000); // 30 min after service ends
      
      // Delete if 30 min after service ends (for confirmed, completed, or pending reservations)
      if (now >= deleteAfterTime) {
        idsToDelete.push(r.id);
        continue; // Skip other checks if already marked for deletion
      }
      
      // Also delete if reservation date was from a previous day (end of day cleanup)
      const reservationDay = new Date(reservationDate);
      reservationDay.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (reservationDay < today) {
        idsToDelete.push(r.id);
      }
    }

    // Remove duplicates
    const uniqueIds = [...new Set(idsToDelete)];

    if (uniqueIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .in('id', uniqueIds);
      
      if (deleteError) {
        console.error('Error deleting expired reservations:', deleteError);
      } else {
        console.log(`Cleaned up ${uniqueIds.length} expired reservations`);
        // Refetch to update UI immediately
        fetchReservations();
      }
    }
  }, []);

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

  // Set up realtime subscription and cleanup interval
  useEffect(() => {
    fetchReservations();
    cleanupExpiredReservations(); // Run cleanup on mount

    // Run cleanup every minute
    const cleanupInterval = setInterval(() => {
      cleanupExpiredReservations();
    }, 60000);

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
      clearInterval(cleanupInterval);
      supabase.removeChannel(channel);
    };
  }, [cleanupExpiredReservations]);

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

  // Ban system removed - always return false
  const isPhoneBanned = async (_phone: string): Promise<boolean> => {
    return false;
  };

  // Cancel reservation with shifting (ban system removed)
  const cancelReservation = async (id: string, _phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get the reservation to be cancelled
      const reservationToCancel = reservations.find((r) => r.id === id);
      if (!reservationToCancel) {
        return { success: false, error: 'not_found' };
      }

      // Check if the reservation is in the future
      const now = new Date();
      if (reservationToCancel.date <= now) {
        return { success: false, error: 'past_reservation' };
      }

      const cancelledServiceTime = reservationToCancel.totalTime;
      const barber = reservationToCancel.barber;
      const cancelledDate = reservationToCancel.date;

      // Delete the cancelled reservation
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting reservation:', deleteError);
        return { success: false, error: 'delete_error' };
      }

      // Shift all later reservations for the same barber on the same day earlier
      const sameDayReservations = reservations.filter((r) => {
        if (r.id === id) return false;
        if (r.barber !== barber) return false;
        if (r.status === 'cancelled' || r.status === 'noshow') return false;
        
        const rDate = new Date(r.date);
        const cancelDate = new Date(cancelledDate);
        
        // Same day check
        return rDate.toDateString() === cancelDate.toDateString() && rDate > cancelledDate;
      });

      // Sort by date ascending
      sameDayReservations.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Shift each reservation earlier by the cancelled service time
      for (const r of sameDayReservations) {
        const newDate = new Date(r.date.getTime() - cancelledServiceTime * 60000);
        
        await supabase
          .from('reservations')
          .update({ reservation_date: newDate.toISOString() })
          .eq('id', r.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      return { success: false, error: 'unknown_error' };
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

  // Check if a barber has a conflicting reservation at the given time
  const isBarberBusyAt = (barber: string, dateTime: Date, duration: number): boolean => {
    const requestedStart = dateTime.getTime();
    const requestedEnd = requestedStart + duration * 60000;

    return reservations.some((r) => {
      if (r.barber !== barber) return false;
      if (r.status === 'cancelled' || r.status === 'noshow') return false;

      const reservationStart = r.date.getTime();
      const reservationEnd = reservationStart + r.totalTime * 60000;

      // Check for overlap
      return requestedStart < reservationEnd && requestedEnd > reservationStart;
    });
  };

  // Find an available barber at the given time, returns null if all are busy
  const getAvailableBarberAt = (dateTime: Date, duration: number): string | null => {
    for (const barber of barbers) {
      if (!isBarberBusyAt(barber, dateTime, duration)) {
        return barber;
      }
    }
    return null;
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        chairs,
        addReservation,
        updateReservationStatus,
        cancelReservation,
        getWaitTime,
        hasActiveReservation,
        isBarberBusyAt,
        getAvailableBarberAt,
        isPhoneBanned,
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
