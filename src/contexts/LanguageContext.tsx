import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.reservation': 'Réservation',
    'nav.shop': 'Boutique',
    'nav.dashboard': 'Dashboard',
    
    // Home
    'home.hero.title': 'Amine Barbershop',
    'home.hero.subtitle': 'L\'art de la coiffure masculine',
    'home.hero.cta': 'Réserver maintenant',
    'home.hours': 'Horaires d\'ouverture',
    'home.hours.value': '7/7 — 09:00 → 22:00',
    'home.barbers': 'Nos Barbiers',
    
    // Reservation
    'reservation.title': 'Réservation',
    'reservation.chairs': 'État des Chaises',
    'reservation.available': 'Disponible',
    'reservation.busy': 'Occupé',
    'reservation.services': 'Services',
    'reservation.haircut': 'Coupe de cheveux',
    'reservation.beard': 'Barbe',
    'reservation.hairbeard': 'Cheveux + Barbe',
    'reservation.styling': 'Coiffage',
    'reservation.protein': 'Protéine / Coloration',
    'reservation.private': 'Prix sur demande',
    'reservation.total': 'Total',
    'reservation.time': 'Temps estimé',
    'reservation.price': 'Prix',
    'reservation.selectBarber': 'Choisir un barbier',
    'reservation.selectDate': 'Date',
    'reservation.selectTime': 'Heure',
    'reservation.phone': 'Numéro de téléphone',
    'reservation.phonePlaceholder': '+216 XX XXX XXX',
    'reservation.clientName': 'Nom du client',
    'reservation.clientNamePlaceholder': 'Entrez votre nom',
    'reservation.submit': 'Confirmer la réservation',
    'reservation.wait': 'Temps d\'attente estimé',
    'reservation.minutes': 'min',
    'reservation.autoSwitch': 'Barbier auto-assigné (le vôtre est occupé)',
    'reservation.error.past': 'La date/heure ne peut pas être dans le passé',
    'reservation.error.soon': 'Réservez au moins 30 minutes à l\'avance',
    'reservation.error.closed': 'Hors des heures d\'ouverture (09:00-22:00)',
    'reservation.error.phone': 'Numéro tunisien invalide',
    'reservation.error.existing': 'Une réservation existe déjà pour ce numéro',
    'reservation.error.barberBusy': 'Ce barbier est déjà réservé à cette heure. Veuillez choisir un autre barbier ou une autre heure.',
    'reservation.error.allBusy': 'Tous les barbiers sont réservés à cette heure. Veuillez choisir une autre heure.',
    'reservation.error.banned': 'Vous êtes banni pendant 24h pour avoir annulé deux fois.',
    'reservation.success': 'Réservation confirmée !',
    
    // Cancellation
    'reservation.cancel.title': 'Annuler ma réservation',
    'reservation.cancel.warning': 'Attention : Vous ne pouvez annuler qu\'une seule fois. Une deuxième annulation entraînera un bannissement de 24h.',
    'reservation.cancel.confirm': 'Annuler',
    'reservation.cancel.success': 'Réservation annulée avec succès. Les autres réservations ont été avancées.',
    'reservation.cancel.notFound': 'Aucune réservation trouvée pour ce numéro.',
    'reservation.cancel.banned': 'Vous êtes banni pendant 24h pour avoir annulé deux fois.',
    'reservation.cancel.pastReservation': 'Vous ne pouvez pas annuler une réservation passée.',
    'reservation.cancel.error': 'Erreur lors de l\'annulation.',
    
    // Shop
    'shop.title': 'Boutique',
    'shop.coming': 'Bientôt disponible',
    'shop.comingDesc': 'Notre boutique en ligne arrive prochainement avec des produits premium pour hommes.',
    
    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.password': 'Mot de passe',
    'dashboard.enter': 'Entrer',
    'dashboard.reservations': 'Réservations',
    'dashboard.earnings': 'Revenus du jour',
    'dashboard.cancel': 'Annuler',
    'dashboard.noshow': 'Absent',
    'dashboard.chairs': 'État des Chaises',
    
    // Footer
    'footer.follow': 'Suivez-nous',
    'footer.contact': 'Contact',
    
    // Common
    'common.tnd': 'TND',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.reservation': 'الحجز',
    'nav.shop': 'المتجر',
    'nav.dashboard': 'لوحة التحكم',
    
    // Home
    'home.hero.title': 'أمين باربرشوب',
    'home.hero.subtitle': 'فن حلاقة الرجال',
    'home.hero.cta': 'احجز الآن',
    'home.hours': 'ساعات العمل',
    'home.hours.value': '7/7 — 09:00 ← 22:00',
    'home.barbers': 'حلاقونا',
    
    // Reservation
    'reservation.title': 'الحجز',
    'reservation.chairs': 'حالة الكراسي',
    'reservation.available': 'متاح',
    'reservation.busy': 'مشغول',
    'reservation.services': 'الخدمات',
    'reservation.haircut': 'قص الشعر',
    'reservation.beard': 'اللحية',
    'reservation.hairbeard': 'الشعر + اللحية',
    'reservation.styling': 'تصفيف',
    'reservation.protein': 'بروتين / صبغة',
    'reservation.private': 'السعر عند الطلب',
    'reservation.total': 'المجموع',
    'reservation.time': 'الوقت المقدر',
    'reservation.price': 'السعر',
    'reservation.selectBarber': 'اختر حلاقاً',
    'reservation.selectDate': 'التاريخ',
    'reservation.selectTime': 'الوقت',
    'reservation.phone': 'رقم الهاتف',
    'reservation.phonePlaceholder': '+216 XX XXX XXX',
    'reservation.clientName': 'اسم العميل',
    'reservation.clientNamePlaceholder': 'أدخل اسمك',
    'reservation.submit': 'تأكيد الحجز',
    'reservation.wait': 'وقت الانتظار المقدر',
    'reservation.minutes': 'دقيقة',
    'reservation.autoSwitch': 'تم تعيين حلاق آخر (حلاقك مشغول)',
    'reservation.error.past': 'لا يمكن أن يكون التاريخ/الوقت في الماضي',
    'reservation.error.soon': 'احجز قبل 30 دقيقة على الأقل',
    'reservation.error.closed': 'خارج ساعات العمل (09:00-22:00)',
    'reservation.error.phone': 'رقم تونسي غير صالح',
    'reservation.error.existing': 'يوجد حجز بهذا الرقم',
    'reservation.error.barberBusy': 'هذا الحلاق محجوز في هذا الوقت. يرجى اختيار حلاق آخر أو وقت آخر.',
    'reservation.error.allBusy': 'جميع الحلاقين محجوزون في هذا الوقت. يرجى اختيار وقت آخر.',
    'reservation.error.banned': 'تم حظرك لمدة 24 ساعة بسبب إلغاء حجزين.',
    'reservation.success': 'تم تأكيد الحجز!',
    
    // Cancellation
    'reservation.cancel.title': 'إلغاء حجزي',
    'reservation.cancel.warning': 'تحذير: يمكنك الإلغاء مرة واحدة فقط. الإلغاء الثاني سيؤدي إلى حظر لمدة 24 ساعة.',
    'reservation.cancel.confirm': 'إلغاء',
    'reservation.cancel.success': 'تم إلغاء الحجز بنجاح. تم تقديم الحجوزات الأخرى.',
    'reservation.cancel.notFound': 'لم يتم العثور على حجز بهذا الرقم.',
    'reservation.cancel.banned': 'تم حظرك لمدة 24 ساعة بسبب إلغاء حجزين.',
    'reservation.cancel.pastReservation': 'لا يمكنك إلغاء حجز سابق.',
    'reservation.cancel.error': 'خطأ أثناء الإلغاء.',
    
    // Shop
    'shop.title': 'المتجر',
    'shop.coming': 'قريباً',
    'shop.comingDesc': 'متجرنا الإلكتروني قادم قريباً مع منتجات فاخرة للرجال.',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.password': 'كلمة المرور',
    'dashboard.enter': 'دخول',
    'dashboard.reservations': 'الحجوزات',
    'dashboard.earnings': 'أرباح اليوم',
    'dashboard.cancel': 'إلغاء',
    'dashboard.noshow': 'غائب',
    'dashboard.chairs': 'حالة الكراسي',
    
    // Footer
    'footer.follow': 'تابعونا',
    'footer.contact': 'اتصل بنا',
    
    // Common
    'common.tnd': 'دينار',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
