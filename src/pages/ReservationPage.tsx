import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReservation } from '@/contexts/ReservationContext';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ChairStatusDisplay from '@/components/ChairStatusDisplay';
import { CalendarIcon, Clock, Phone, AlertCircle, CheckCircle, User, XCircle, Info } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { fr, arSA } from 'date-fns/locale';

interface Service {
  id: string;
  labelKey: string;
  duration: number;
  price: number | null;
  isPricePrivate: boolean;
}

const services: Service[] = [
  { id: 'haircut', labelKey: 'reservation.haircut', duration: 30, price: 10, isPricePrivate: false },
  { id: 'beard', labelKey: 'reservation.beard', duration: 20, price: 5, isPricePrivate: false },
  { id: 'hairbeard', labelKey: 'reservation.hairbeard', duration: 45, price: 12, isPricePrivate: false },
  { id: 'styling', labelKey: 'reservation.styling', duration: 15, price: 7, isPricePrivate: false },
  { id: 'protein', labelKey: 'reservation.protein', duration: 90, price: null, isPricePrivate: true },
];

const barbers = ['Amine', 'Rayan', 'Anas', 'Chawki'];

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')); // 00..23
const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const ReservationPage = () => {
  const { t, language } = useLanguage();
  const { addReservation, hasActiveReservation, getWaitTime, chairs, isBarberBusyAt, getAvailableBarberAt, cancelReservation, reservations } = useReservation();
  const [searchParams] = useSearchParams();

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');
  const selectedTime = selectedHour && selectedMinute ? `${selectedHour}:${selectedMinute}` : '';
  const setSelectedTime = (val: string) => {
    if (!val) { setSelectedHour(''); setSelectedMinute(''); return; }
    const [h, m] = val.split(':');
    setSelectedHour(h || ''); setSelectedMinute(m || '');
  };
  const [phone, setPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [autoSwitchedBarber, setAutoSwitchedBarber] = useState<string>('');
  const [suggestedTime, setSuggestedTime] = useState<string | null>(null);
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelName, setCancelName] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Pre-select barber from URL parameter
  useEffect(() => {
    const barberParam = searchParams.get('barber');
    if (barberParam && barbers.includes(barberParam)) {
      setSelectedBarber(barberParam);
      toast.success(t('reservation.barberPreselected').replace('{barber}', barberParam));
    }
  }, [searchParams, t]);

  const { totalTime, totalPrice } = useMemo(() => {
    let time = 0;
    let price = 0;
    selectedServices.forEach((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        time += service.duration;
        if (service.price !== null) {
          price += service.price;
        }
      }
    });
    return { totalTime: time, totalPrice: price };
  }, [selectedServices]);

  const waitTime = useMemo(() => {
    if (!selectedBarber) return 0;
    return getWaitTime(selectedBarber);
  }, [selectedBarber, getWaitTime]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const validatePhone = (phoneNum: string): boolean => {
    // Tunisian phone validation: starts with +216 or 216, followed by 2x xxx xxx
    const cleanPhone = phoneNum.replace(/\s/g, '');
    const tunisianRegex = /^(\+?216)?[2-9]\d{7}$/;
    return tunisianRegex.test(cleanPhone);
  };

  const validateDateTime = (): string | null => {
    if (!selectedDate || !selectedTime) return null;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();

    if (dateTime < now) {
      return t('reservation.error.past');
    }

    return null;
  };


    return null;
  };

  // Find next available time slot for any barber
  const findNextAvailableTime = (startDateTime: Date, duration: number): { time: string; barber: string } | null => {
    const checkTime = new Date(startDateTime);
    
    // Check up to 4 hours ahead
    for (let i = 0; i < 16; i++) {
      const hours = checkTime.getHours();
      const minutes = checkTime.getMinutes();
      
      // Only check during opening hours
      if (hours >= 9 && hours < 22) {
        for (const barber of barbers) {
          if (!isBarberBusyAt(barber, checkTime, duration)) {
            return {
              time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
              barber
            };
          }
        }
      }
      
      // Add 30 minutes
      checkTime.setMinutes(checkTime.getMinutes() + 30);
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAutoSwitched(false);
    setAutoSwitchedBarber('');
    setSuggestedTime(null);

    // Validation
    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }

    if (!clientName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedBarber) {
      setError('Please select a barber');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time');
      return;
    }

    const dateTimeError = validateDateTime();
    if (dateTimeError) {
      setError(dateTimeError);
      return;
    }

    if (!validatePhone(phone)) {
      setError(t('reservation.error.phone'));
      return;
    }


    if (hasActiveReservation(phone)) {
      setError(t('reservation.error.existing'));
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);

    let finalBarber = selectedBarber;

    // Check if selected barber is busy at the requested time
    if (isBarberBusyAt(selectedBarber, dateTime, totalTime)) {
      // Try to find another available barber at this time
      const availableBarber = getAvailableBarberAt(dateTime, totalTime);
      
      if (availableBarber) {
        // Auto-assign to available barber
        finalBarber = availableBarber;
        setAutoSwitched(true);
        setAutoSwitchedBarber(availableBarber);
        toast.info(t('reservation.autoSwitch').replace('{barber}', availableBarber));
      } else {
        // All barbers are busy - suggest next available time
        const nextSlot = findNextAvailableTime(dateTime, totalTime);
        
        if (nextSlot) {
          setSuggestedTime(nextSlot.time);
          setError(t('reservation.error.allBusySuggestion').replace('{time}', nextSlot.time).replace('{barber}', nextSlot.barber));
        } else {
          setError(t('reservation.error.allBusy'));
        }
        return;
      }
    }

    const chairNumber = chairs.findIndex((c) => c.barber === finalBarber) + 1;

    addReservation({
      clientName: clientName.trim(),
      phone,
      barber: finalBarber,
      services: selectedServices,
      date: dateTime,
      totalTime,
      totalPrice,
      status: 'confirmed',
      chair: chairNumber,
    });

    toast.success(t('reservation.success'), {
      description: `${finalBarber} - ${format(dateTime, 'PPp', { locale: language === 'ar' ? arSA : fr })}`,
    });

    // Reset form
    setSelectedServices([]);
    setSelectedBarber('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setPhone('');
    setClientName('');
    setAutoSwitched(false);
    setAutoSwitchedBarber('');
  };

  const handleCancelReservation = async () => {
    setCancelError(null);

    if (!validatePhone(cancelPhone)) {
      setCancelError(t('reservation.error.phone'));
      return;
    }

    if (!cancelName.trim()) {
      setCancelError(t('reservation.cancel.nameRequired'));
      return;
    }

    // Find the reservation matching phone AND name
    const reservation = reservations.find(
      (r) =>
        r.phone === cancelPhone.trim() &&
        r.clientName.trim().toLowerCase() === cancelName.trim().toLowerCase() &&
        (r.status === 'pending' || r.status === 'confirmed')
    );

    if (!reservation) {
      setCancelError(t('reservation.cancel.notFound'));
      return;
    }

    const result = await cancelReservation(reservation.id, cancelPhone);

    if (result.success) {
      toast.success(t('reservation.cancel.success'));
      setCancelPhone('');
      setCancelName('');
      setShowCancelForm(false);
    } else {
      if (result.error === 'past_reservation') {
        setCancelError(t('reservation.cancel.pastReservation'));
      } else {
        setCancelError(t('reservation.cancel.error'));
      }
    }
  };

  const hasPrivateService = selectedServices.includes('protein');

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              {t('reservation.title')}
            </h1>
          </div>

          {/* Chair Status */}
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <ChairStatusDisplay />
          </div>

          {/* Cancel Reservation Section */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="glass-card p-4 rounded-xl">
              <Button
                variant="outline"
                onClick={() => setShowCancelForm(!showCancelForm)}
                className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
                {t('reservation.cancel.title')}
              </Button>
              
              {showCancelForm && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('reservation.cancel.warning')}
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      value={cancelPhone}
                      onChange={(e) => setCancelPhone(e.target.value)}
                      placeholder={t('reservation.phonePlaceholder')}
                    />
                    <Input
                      type="text"
                      value={cancelName}
                      onChange={(e) => setCancelName(e.target.value)}
                      placeholder={t('reservation.cancel.namePlaceholder')}
                    />
                    <Button
                      onClick={handleCancelReservation}
                      variant="destructive"
                      className="w-full"
                    >
                      {t('reservation.cancel.confirm')}
                    </Button>
                  </div>
                  {cancelError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{cancelError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Services Selection */}
            <div className="glass-card p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm">1</span>
                {t('reservation.services')}
              </h3>
              
              <div className="space-y-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                      selectedServices.includes(service.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div>
                        <p className="font-medium">{t(service.labelKey)}</p>
                      </div>

                    </div>
                    <span className="font-semibold">
                      {service.isPricePrivate
                        ? t('reservation.private')
                        : `${service.price} ${t('common.tnd')}`}
                    </span>
                  </label>
                ))}
              </div>

              {/* Totals */}
              {selectedServices.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-muted/50 space-y-2">
                  {!hasPrivateService && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('reservation.price')}</span>
                      <span className="font-semibold text-primary">{totalPrice} {t('common.tnd')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div className="glass-card p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Name */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm">2</span>
                    {t('reservation.clientName')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={t('reservation.clientNamePlaceholder')}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Barber Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm">3</span>
                    {t('reservation.selectBarber')}
                  </Label>
                  <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('reservation.selectBarber')} />
                    </SelectTrigger>
                    <SelectContent>
                      {barbers.map((barber) => {
                        const chair = chairs.find((c) => c.barber === barber);
                        return (
                          <SelectItem key={barber} value={barber}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{barber}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                chair?.status === 'available'
                                  ? 'bg-success/20 text-success'
                                  : 'bg-destructive/20 text-destructive'
                              }`}>
                                {chair?.status === 'available' ? '✓' : '●'}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {waitTime > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('reservation.wait')}: ~{waitTime} {t('reservation.minutes')}
                    </p>
                  )}
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm">4</span>
                    {t('reservation.selectDate')}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP', { locale: language === 'ar' ? arSA : fr })
                        ) : (
                          <span className="text-muted-foreground">{t('reservation.selectDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm">5</span>
                    {t('reservation.selectTime')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedHour} onValueChange={setSelectedHour}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('reservation.hour') || 'Heure'} />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((h) => (
                          <SelectItem key={h} value={h}>{h} h</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('reservation.minute') || 'Minute'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {minuteOptions.map((m) => (
                          <SelectItem key={m} value={m}>{m} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm">6</span>
                    {t('reservation.phone')}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('reservation.phonePlaceholder')}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Auto-switch Notice */}
                {autoSwitched && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{t('reservation.autoSwitch')}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full btn-primary-glow py-6 text-lg"
                  disabled={selectedServices.length === 0}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {t('reservation.submit')}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
