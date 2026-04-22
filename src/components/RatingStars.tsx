import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function RatingStars({
  rating,
  onRate,
  size = 'md',
  readonly = false,
}: RatingStarsProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onRate?.(star)}
          disabled={readonly}
          className={`${sizeClass[size]} transition-colors ${
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          } ${!readonly && 'cursor-pointer hover:text-yellow-300'}`}
        >
          <Star size={24} />
        </button>
      ))}
    </div>
  );
}
