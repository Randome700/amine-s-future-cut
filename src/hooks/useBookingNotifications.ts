import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { notificationSoundUrl } from '@/utils/notificationSound';

interface Reservation {
  id: string;
  client_name: string;
  services: string[];
  reservation_date: string;
  status: string;
  barber: string;
}

export const useBookingNotifications = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Initialize audio element with generated sound
  useEffect(() => {
    audioRef.current = new Audio(notificationSoundUrl);
    audioRef.current.volume = 0.7;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    }
  }, [soundEnabled]);

  const sendWhatsAppNotification = useCallback(async (
    type: 'new_booking' | 'cancellation',
    reservation: Reservation
  ) => {
    try {
      const reservationDate = new Date(reservation.reservation_date);
      const dateStr = format(reservationDate, 'dd/MM/yyyy');
      const timeStr = format(reservationDate, 'HH:mm');

      const { error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          type,
          client_name: reservation.client_name,
          services: reservation.services,
          date: dateStr,
          time: timeStr,
        },
      });

      if (error) {
        console.error('WhatsApp notification error:', error);
      } else {
        console.log('WhatsApp notification sent successfully');
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    console.log('Setting up realtime subscription for booking notifications...');
    
    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
        },
        async (payload) => {
          console.log('New reservation detected:', payload);
          const newReservation = payload.new as Reservation;
          
          // Play sound
          playNotificationSound();
          
          // Show toast
          toast({
            title: '✂️ New Booking!',
            description: `${newReservation.client_name} booked ${newReservation.services.join(', ')}`,
          });
          
          // Send WhatsApp notification
          await sendWhatsAppNotification('new_booking', newReservation);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
        },
        async (payload) => {
          const updatedReservation = payload.new as Reservation;
          const oldReservation = payload.old as Reservation;
          
          // Check if status changed to cancelled
          if (updatedReservation.status === 'cancelled' && oldReservation.status !== 'cancelled') {
            console.log('Reservation cancelled:', payload);
            
            // Play sound
            playNotificationSound();
            
            // Show toast
            toast({
              title: '❌ Booking Cancelled',
              description: `${updatedReservation.client_name} cancelled their reservation`,
              variant: 'destructive',
            });
            
            // Send WhatsApp notification
            await sendWhatsAppNotification('cancellation', updatedReservation);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reservations',
        },
        async (payload) => {
          console.log('Reservation deleted:', payload);
          const deletedReservation = payload.old as Reservation;
          
          // Play sound
          playNotificationSound();
          
          // Show toast
          toast({
            title: '❌ Booking Cancelled',
            description: `Reservation for ${deletedReservation.client_name} was removed`,
            variant: 'destructive',
          });
          
          // Send WhatsApp notification for deletion
          await sendWhatsAppNotification('cancellation', deletedReservation);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [playNotificationSound, sendWhatsAppNotification, toast]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev: boolean) => !prev);
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playNotificationSound,
  };
};
