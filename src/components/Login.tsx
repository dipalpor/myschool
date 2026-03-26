import React, { useState } from 'react';
import { GraduationCap, Lock, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, login } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(id, password);
    if (result.success) {
      toast.success('Login successful!');
      navigate('/');
    } else {
      setError(result.message || 'Invalid credentials');
      toast.error(result.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My School ERP</h1>
          <p className="mt-2 text-gray-600">Administrative Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-sm font-bold text-gray-700 block mb-1">Admin ID</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="Enter ID"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-sm font-bold text-gray-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
          >
            Sign In
          </button>
          
        </form>
      </div>
    </div>
  );
};
