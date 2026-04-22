import { useState } from 'react';
import { User, UserSkill, SkillLevel } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { RatingStars } from './RatingStars';
import { Select } from './ui/Select';
import { LogOut, Share2 } from 'lucide-react';

const AVAILABLE_SKILLS = [
  'Navegante',
  'Cocinero',
  'Mecánico',
  'Ayudante general',
  'Marinero',
  'Capitán',
  'Enfermero',
  'Instructor de vela',
];

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
  onInviteClick: () => void;
}

export function Profile({
  user,
  onUpdate,
  onLogout,
  onInviteClick,
}: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [selectedSkills, setSelectedSkills] = useState<UserSkill[]>(user.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('principiante');

  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      const skill: UserSkill = {
        name: newSkillName.trim(),
        level: newSkillLevel,
      };
      setSelectedSkills([...selectedSkills, skill]);
      setNewSkillName('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedUser: User = {
      ...user,
      bio,
      skills: selectedSkills,
    };
    onUpdate(updatedUser);
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta y todos tus datos? Esta acción no se puede deshacer.')) {
      // Aquí deberías llamar al endpoint de borrado de cuenta (a implementar)
      // Por ahora, solo mostramos un mensaje
      alert('Funcionalidad de eliminación de cuenta próximamente.');
      // Si ya tienes la función, aquí puedes cerrar sesión o redirigir
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onInviteClick}
            className="flex items-center gap-2"
          >
            <Share2 size={18} />
            Invitar amigos
          </Button>
          <Button
            variant="destructive"
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            Salir
          </Button>
        </div>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center text-5xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                {user.role === 'patron' ? '⚓ Patrón' : '🚣 Viajero'}
              </p>

              {user.boatName && (
                <p className="text-sm font-medium text-blue-600 mt-2">
                  🚤 {user.boatName} {user.boatType && `(${user.boatType})`}
                </p>
              )}

              <div className="mt-3">
                <RatingStars rating={user.averageRating || 0} readonly />
                <p className="text-sm text-gray-600 mt-1">
                  {user.averageRating?.toFixed(1) || 'Sin valoraciones'} ★
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
              {user.bio && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Sobre mí</h3>
                  <p className="text-gray-600 text-sm">{user.bio}</p>
                </div>
              )}

              {user.skills && user.skills.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Habilidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <span
                        key={skill.name}
                        className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                      >
                        {skill.name}{' '}
                        <span className="text-xs">({skill.level})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="w-full"
                >
                  Editar perfil
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="w-full"
                >
                  Eliminar mi cuenta y datos
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Habilidades</h3>
                {selectedSkills.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {selectedSkills.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <span className="text-sm">
                          {skill.name} ({skill.level})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Select
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                  >
                    <option value="">Selecciona una habilidad</option>
                    {AVAILABLE_SKILLS.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="experto">Experto</option>
                  </Select>

                  <Button
                    type="button"
                    onClick={() => handleAddSkill()}
                    variant="outline"
                    className="w-full"
                  >
                    Agregar habilidad
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  Guardar cambios
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
