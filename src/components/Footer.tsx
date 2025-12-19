import React from 'react';
import { Instagram, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  const socialLinks = [
    { name: 'Taz', url: 'https://instagram.com/taz', handle: '@taz' },
    { name: 'Anas', url: 'https://instagram.com/anas', handle: '@anas' },
    { name: 'Amine', url: 'https://instagram.com/amine', handle: '@amine' },
  ];

  return (
    <footer className="border-t border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://i.ibb.co/gb8QqfN6/Chat-GPT-Image-Dec-17-2025-07-01-22-PM.png" 
                alt="Amine Barbershop" 
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">Amine Barbershop</h3>
                <p className="text-sm text-muted-foreground">7/7 — 09:00 → 22:00</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
              {t('footer.follow')}
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-300 text-sm"
                >
                  <Instagram className="h-4 w-4" />
                  <span>{link.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
              {t('footer.contact')}
            </h4>
            <a
              href="tel:+21621632832"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-300"
            >
              <Phone className="h-4 w-4" />
              <span>+216 21 632 832</span>
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Amine Barbershop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
