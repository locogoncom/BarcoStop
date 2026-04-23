export type UserRole = 'patron' | 'viajero';
export type SkillLevel = 'principiante' | 'intermedio' | 'experto';

export interface UserSkill {
  name: string;
  level: SkillLevel;
}

export interface Rating {
  rating: number;
  comment?: string;
  ratedBy: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  skills?: UserSkill[];
  boatName?: string;
  boatType?: string;
  ratings?: Rating[];
  averageRating?: number;
  createdAt: number;
}

export interface TripRoute {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  estimatedDuration?: string;
}

export interface Trip {
  id: string;
  patronId: string;
  route: TripRoute;
  description: string;
  availableSeats: number;
  cost: number;
  requiredSkills?: UserSkill[];
  createdAt: number;
  updatedAt: number;
}

export interface Reservation {
  id: string;
  tripId: string;
  travelerId: string;
  patronId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  text: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: number;
}

export interface TripTracking {
  id: string;
  tripId: string;
  travelerId: string;
  status: 'started' | 'in_progress' | 'completed';
  currentPosition?: string;
  sharedWith: string[];
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  invitedEmail: string;
  status: 'pending' | 'accepted';
  createdAt: number;
}
