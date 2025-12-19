import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingBag, Sparkles } from 'lucide-react';

const placeholderProducts = [
  { id: 1, name: 'Premium Hair Wax', price: 25 },
  { id: 2, name: 'Beard Oil', price: 18 },
  { id: 3, name: 'Styling Gel', price: 15 },
  { id: 4, name: 'Shampoo Pro', price: 22 },
  { id: 5, name: 'Aftershave Balm', price: 20 },
  { id: 6, name: 'Hair Serum', price: 30 },
];

const ShopPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              {t('shop.title')}
            </h1>
          </div>

          {/* Coming Soon Banner */}
          <div className="glass-card p-12 rounded-2xl text-center mb-12 animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('shop.coming')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('shop.comingDesc')}
            </p>
          </div>

          {/* Disabled Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {placeholderProducts.map((product, index) => (
              <div 
                key={product.id}
                className="glass-card p-6 rounded-2xl opacity-50 cursor-not-allowed animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-square bg-muted/30 rounded-xl mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <p className="text-muted-foreground">{product.price} TND</p>
                <button 
                  disabled 
                  className="w-full mt-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm cursor-not-allowed"
                >
                  {t('shop.coming')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
