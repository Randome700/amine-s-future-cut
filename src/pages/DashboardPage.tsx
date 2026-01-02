import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReservation } from '@/contexts/ReservationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Calendar, Clock, Phone, User, DollarSign, XCircle, UserX, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr, arSA } from 'date-fns/locale';
import ChairStatusDisplay from '@/components/ChairStatusDisplay';

// Format duration in human-readable hours/minutes
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
};

const DashboardPage = () => {
  const { t, language } = useLanguage();
  const { reservations, updateReservationStatus, loading, totalEarnings, todayEarnings } = useReservation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'amine.2026') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  // Sort reservations by date (earliest first) and filter out invalid dates
  const sortedReservations = [...reservations]
    .filter((r) => r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'noshow' && r.date instanceof Date && !isNaN(r.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 rounded-2xl max-w-sm w-full animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('dashboard.password')}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="text-center"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full btn-primary-glow">
              {t('dashboard.enter')}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-slide-up">
            <h1 className="text-3xl font-bold gradient-text">{t('dashboard.title')}</h1>
            
            {/* Earnings Cards */}
            <div className="flex gap-4">
              <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.earnings')}</p>
                  <p className="text-xl font-bold text-primary">{todayEarnings} TND</p>
                </div>
              </div>
              <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-success">{totalEarnings} TND</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chair Status */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <ChairStatusDisplay />
          </div>

          {/* Reservations */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('dashboard.reservations')}
              <span className="text-sm font-normal text-muted-foreground">
                ({sortedReservations.length})
              </span>
            </h2>

            <div className="space-y-4">
              {sortedReservations.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center text-muted-foreground">
                  No upcoming reservations
                </div>
              ) : (
                sortedReservations.map((reservation, index) => {
                  const isPast = reservation.date < new Date();
                  const timeUntil = Math.round((reservation.date.getTime() - Date.now()) / 60000);
                  
                  return (
                    <div 
                      key={reservation.id}
                      className={`glass-card p-6 rounded-xl animate-slide-up ${
                        isPast ? 'opacity-60' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Time indicator */}
                          <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                            timeUntil <= 15 && timeUntil > 0
                              ? 'bg-warning/20 text-warning'
                              : isPast
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            <span className="text-lg font-bold">
                              {format(reservation.date, 'HH:mm')}
                            </span>
                            <span className="text-xs">
                              {format(reservation.date, 'dd/MM', { locale: language === 'ar' ? arSA : fr })}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {/* Client Name */}
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{reservation.clientName}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                reservation.status === 'confirmed'
                                  ? 'bg-success/20 text-success'
                                  : reservation.status === 'pending'
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {reservation.status}
                              </span>
                            </div>
                            {/* Barber */}
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Barbier:</span>
                              <span className="font-medium">{reservation.barber}</span>
                            </div>
                            {/* Phone */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{reservation.phone}</span>
                            </div>
                            {/* Time & Price */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(reservation.totalTime)}</span>
                              <span>•</span>
                              <span className="text-primary font-medium">{reservation.totalPrice} TND</span>
                            </div>
                            {timeUntil > 0 && (
                              <p className="text-xs text-primary font-medium">
                                Dans {formatDuration(timeUntil)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('dashboard.cancel')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReservationStatus(reservation.id, 'noshow')}
                            className="text-warning hover:bg-warning/10"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            {t('dashboard.noshow')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;