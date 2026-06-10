import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReservation } from '@/contexts/ReservationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Users, Scissors, ArrowRight, MapPin, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const barbers = [
  { name: 'Amine', role: 'Master Barber', image: '👨‍🦱' },
  { name: 'Rayan', role: 'Senior Stylist', image: '👨‍🦰' },
  { name: 'Anas', role: 'Barber', image: '🧑‍🦱' },
];

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { reservations, cancelReservation } = useReservation();
  const [cancelPhone, setCancelPhone] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleBarberClick = (barberName: string) => {
    navigate(`/reservation?barber=${encodeURIComponent(barberName)}`);
  };

  const handleCancelReservation = async () => {
    if (!cancelPhone.trim()) {
      toast.error(t('reservation.cancel.phoneRequired'));
      return;
    }

    const reservation = reservations.find(
      (r) => r.phone === cancelPhone && (r.status === 'pending' || r.status === 'confirmed')
    );

    if (!reservation) {
      toast.error(t('reservation.cancel.notFound'));
      return;
    }

    setIsCancelling(true);
    const result = await cancelReservation(reservation.id, cancelPhone);
    setIsCancelling(false);

    if (result.success) {
      toast.success(t('reservation.cancel.success'));
      setCancelPhone('');
    } else if (result.error === 'banned') {
      toast.error(t('reservation.cancel.banned'));
    } else {
      toast.error(t('reservation.cancel.error'));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="animate-scale-in">
              <img 
                src="https://i.ibb.co/gb8QqfN6/Chat-GPT-Image-Dec-17-2025-07-01-22-PM.png" 
                alt="Amine Barbershop" 
                className="h-32 w-32 mx-auto rounded-full object-cover glow-box animate-pulse-glow"
              />
            </div>

            {/* Title */}
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="gradient-text">{t('home.hero.title')}</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                {t('home.hero.subtitle')}
              </p>
            </div>

            {/* CTA Button */}
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/reservation">
                <Button size="lg" className="btn-primary-glow text-lg px-8 py-6 rounded-full group">
                  {t('home.hero.cta')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Opening Hours */}
            <div className="animate-slide-up pt-8" style={{ animationDelay: '0.6s' }}>
              <div className="glass-card inline-flex items-center gap-3 px-6 py-4 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('home.hours')}</p>
                  <p className="font-medium">{t('home.hours.value')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Cancel Reservation Section */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto glass-card p-6 rounded-2xl animate-slide-up">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                {t('reservation.cancel.title')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{t('reservation.cancel.description')}</p>
            </div>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder={t('reservation.phone')}
                value={cancelPhone}
                onChange={(e) => setCancelPhone(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCancelReservation}
                disabled={isCancelling}
                variant="destructive"
                className="whitespace-nowrap"
              >
                {isCancelling ? '...' : t('reservation.cancel.button')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Barbers Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.barbers')}</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>3 {t('home.barbers').toLowerCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {barbers.map((barber, index) => (
              <button 
                key={barber.name}
                onClick={() => handleBarberClick(barber.name)}
                className="glass-card-hover p-6 rounded-2xl text-center animate-slide-up cursor-pointer hover:border-primary/50 hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{barber.image}</div>
                <h3 className="font-semibold text-lg">{barber.name}</h3>
                <p className="text-sm text-muted-foreground">{barber.role}</p>
                <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('home.hero.cta')} →
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.location')}</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Nabeul Dar chaaban el fehri</span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-2 rounded-2xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3200.5!2d10.747759620785171!3d36.46693700447472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDI4JzAxLjAiTiAxMMKwNDQnNTIuMCJF!5e0!3m2!1sen!2stn!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Amine Barbershop Location"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Scissors, title: 'Expert Cuts', desc: 'Precision styling by masters' },
              { icon: Clock, title: 'Quick Service', desc: 'Respect your time' },
              { icon: Users, title: '4 Barbers', desc: 'Minimal wait times' },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="glass-card p-8 rounded-2xl text-center group hover:border-primary/30 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
