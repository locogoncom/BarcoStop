import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 'md',
  interactive = false,
  onRatingChange,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return { starSize: 14, fontSize: 12, spacing: 2 };
      case 'lg':
        return { starSize: 24, fontSize: 16, spacing: 6 };
      default:
        return { starSize: 18, fontSize: 14, spacing: 4 };
    }
  };

  const { starSize, fontSize, spacing } = getSizeConfig();
  const displayRating = hoverRating !== null ? hoverRating : rating;

  const renderStar = (index: number) => {
    const starRating = index + 1;
    const isFilled = starRating <= Math.floor(displayRating);
    const isHalf = starRating - 0.5 <= displayRating && displayRating < starRating;

    return (
      <TouchableOpacity
        key={index}
        disabled={!interactive}
        onPress={() => {
          if (interactive && onRatingChange) {
            onRatingChange(starRating);
            setHoverRating(null);
          }
        }}
        style={styles.starButton}
      >
        <Text style={[styles.star, { fontSize: starSize }]}>
          {isFilled ? '⭐' : isHalf ? '⭐' : '☆'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.starsContainer, { gap: spacing }]}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </View>
      {(reviewCount !== undefined || rating > 0) && (
        <Text style={[styles.ratingText, { fontSize }]}>
          {rating.toFixed(1)} {reviewCount !== undefined ? `(${reviewCount} reseñas)` : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  star: {
    color: '#0284c7',
  },
  ratingText: {
    color: '#64748b',
    fontWeight: '500',
  },
});
