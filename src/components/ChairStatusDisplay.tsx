import React from 'react';
import { useReservation, ChairStatus as ChairStatusType } from '@/contexts/ReservationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from 'lucide-react';

interface ChairCardProps {
  chair: ChairStatusType;
}

const ChairCard = ({ chair }: ChairCardProps) => {
  const { t } = useLanguage();
  const isAvailable = chair.status === 'available';

  return (
    <div 
      className={`glass-card p-4 rounded-xl transition-all duration-300 ${
        isAvailable ? 'chair-available' : 'chair-busy'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAvailable ? 'bg-success/20' : 'bg-destructive/20'
          }`}>
            <User className={`h-4 w-4 ${isAvailable ? 'text-success' : 'text-destructive'}`} />
          </div>
          <span className="font-medium">{chair.barber}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isAvailable 
            ? 'bg-success/20 text-success' 
            : 'bg-destructive/20 text-destructive'
        }`}>
          {isAvailable ? t('reservation.available') : t('reservation.busy')}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {t('reservation.chairs')} #{chair.id}
      </div>
    </div>
  );
};

const ChairStatusDisplay = () => {
  const { chairs } = useReservation();
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('reservation.chairs')}</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {chairs.map((chair) => (
          <ChairCard key={chair.id} chair={chair} />
        ))}
      </div>
    </div>
  );
};

export default ChairStatusDisplay;
