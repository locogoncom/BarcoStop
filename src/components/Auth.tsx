import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { userAPI, mapUser } from '../utils/api';

interface AuthProps {
  onRegister: (user: User) => void;
  onLogin?: (userId: string) => void;
}

export function Auth({ onRegister }: AuthProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viajero');
  const [boatName, setBoatName] = useState('');
  const [boatType, setBoatType] = useState('');
  const [bio, setBio] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    userAPI.getAll().then((response) => {
      setUsers(response.data.map(mapUser));
    }).catch((err) => console.error('Error fetching users:', err));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u) => u.email === email);
    if (!user) {
      alert('Usuario no encontrado. Por favor, verifica tu email o crea una cuenta.');
      return;
    }
    onRegister(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newUser: any = {
      name: name.trim(),
      email: email.trim(),
      role,
      ...(role === 'patron' && { boatName, boatType }),
      bio: bio.trim() || undefined,
    };

    onRegister(newUser);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)
        `,
      }}
    >
      {/* Animated background waves */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="text-center py-6 bg-gradient-to-b from-blue-50 to-white">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-4xl">⚓</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">BarcoStop</h1>
          </div>
          <p className="text-gray-600 text-sm mt-3">Comparte viajes en barco, conoce gente</p>
          <p className="text-xs text-gray-500 mt-2">La comunidad de navegantes</p>
        </CardHeader>

        <CardContent>
          {!isLogin ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Eres...?
                </label>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="viajero">Viajero</option>
                  <option value="patron">Patrón (Propietario de barco)</option>
                </Select>
              </div>

              {role === 'patron' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del barco
                    </label>
                    <Input
                      type="text"
                      value={boatName}
                      onChange={(e) => setBoatName(e.target.value)}
                      placeholder="Ej: María del Mar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de barco
                    </label>
                    <Select value={boatType} onChange={(e) => setBoatType(e.target.value)}>
                      <option value="">Selecciona un tipo</option>
                      <option value="velero">Velero</option>
                      <option value="motonave">Motonave</option>
                      <option value="catamarán">Catamarán</option>
                      <option value="lancha">Lancha</option>
                      <option value="otro">Otro</option>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía (opcional)
                </label>
                <Input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos sobre ti"
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                🚀 Crear cuenta
              </Button>

              <p className="text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setEmail('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                🔓 Iniciar sesión
              </Button>

              <p className="text-center text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setEmail('');
                    setName('');
                    setRole('viajero');
                    setBoatName('');
                    setBoatType('');
                    setBio('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
            ⚓ Únete a navegantes del mundo  <br />
            🌊 Comparte aventuras • Conoce gente • Viaja diferente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
