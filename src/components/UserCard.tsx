import React from 'react';
import { User } from '../types';
import { Card, CardContent } from './ui/Card';
import { RatingStars } from './RatingStars';
import { MapPin } from 'lucide-react';

interface UserCardProps {
  user: User;
  onClick?: () => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={handleClick}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{user.name}</h3>
            {user.role === 'patron' && user.boatName && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={14} />
                {user.boatName}
              </p>
            )}
            {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}

            <div className="mt-2">
              <RatingStars rating={user.averageRating || 0} readonly size="sm" />
              <p className="text-xs text-gray-500 mt-1">
                {user.averageRating?.toFixed(1) || 'Sin valoraciones'}
              </p>
            </div>
          </div>
        </div>

        {user.skills && user.skills.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Habilidades:</p>
            <div className="flex flex-wrap gap-1">
              {user.skills.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
