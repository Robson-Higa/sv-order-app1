import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadUserProfile();
    } else if (user === null) {
      setLoading(false); // Não logado
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      // Se após 2 segundos não houver usuário, pare o loading
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Chame o endpoint correto
      const response = await apiService.getCurrentUser(); // novo método
      const userObj = response.user || response;
      if (userObj && userObj.uid) {
        setUserData(userObj);
        setAvatarPreview(userObj.avatarUrl || null);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
      toast.error('Erro ao carregar dados do perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result); // Base64 para preview
      };
      reader.readAsDataURL(file); // Converte para Base64
    }
  };

  const handleSave = async () => {
    console.log('handleSave foi chamado');

    if (!user?.uid) {
      console.error('Usuário não carregado');
      toast.error('Usuário não carregado');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: userData.name,
        phone: userData.phone,
        avatarBase64: avatarPreview || null, // Se imagem foi alterada
      };

      console.log('UID do usuário:', user.uid);
      console.log('Dados enviados:', payload);

      const response = await apiService.updateUser(user.uid, payload);
      console.log('Resposta da API:', response);

      toast.success('Perfil atualizado com sucesso!');
      setUserData({ ...userData, avatarUrl: avatarPreview }); // Atualiza o estado local
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-white">
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {userData && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Avatar" />
                  ) : (
                    <AvatarFallback>{userData?.name ? userData.name[0] : ''}</AvatarFallback>
                  )}
                </Avatar>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
              </div>

              {/* Campos */}
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300">Nome</label>
                  <Input
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300">Email</label>
                  <Input value={userData.email} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300">Telefone</label>
                  <Input
                    value={userData.phone || ''}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
