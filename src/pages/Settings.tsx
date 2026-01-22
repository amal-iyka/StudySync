import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, GraduationCap, Calendar, Save, Loader2, Moon, Sun, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { AvatarGenerator, ProceduralAvatar, defaultAvatarConfig, AvatarConfig } from '@/components/avatar/ProceduralAvatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Json } from '@/integrations/supabase/types';

const branches = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Other'
];

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];

const ACCENT_COLOR_LABELS: Record<string, { label: string; color: string }> = {
  blue: { label: 'Blue', color: 'hsl(217 91% 60%)' },
  purple: { label: 'Purple', color: 'hsl(262 83% 58%)' },
  green: { label: 'Green', color: 'hsl(142 76% 36%)' },
  orange: { label: 'Orange', color: 'hsl(25 95% 53%)' },
  pink: { label: 'Pink', color: 'hsl(330 80% 60%)' },
  teal: { label: 'Teal', color: 'hsl(172 66% 50%)' },
};

export default function Settings() {
  const { user, profile, updateProfile, signOut, theme, toggleMode, setAccentColor, accentColors } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '',
    branch: '',
    year: ''
  });
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatarConfig);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        branch: profile.branch || '',
        year: profile.year || ''
      });
      if (profile.avatar_config && typeof profile.avatar_config === 'object') {
        setAvatarConfig(profile.avatar_config as unknown as AvatarConfig);
      }
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({
      full_name: formData.full_name,
      branch: formData.branch,
      year: formData.year,
      avatar_config: avatarConfig as unknown as Json
    });
    setIsSaving(false);
  };

  const handleSaveAvatar = async () => {
    await updateProfile({
      avatar_config: avatarConfig as unknown as Json
    });
    setIsAvatarDialogOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <button onClick={() => setIsAvatarDialogOpen(true)} className="group relative">
                {avatarConfig && avatarConfig.faceShape ? (
                  <ProceduralAvatar config={avatarConfig} size={80} />
                ) : (
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">Edit</span>
                </div>
              </button>
              <div>
                <p className="font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={formData.branch} onValueChange={(v) => handleChange('branch', v)}>
                    <SelectTrigger className="w-full">
                      <GraduationCap className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={formData.year} onValueChange={(v) => handleChange('year', v)}>
                    <SelectTrigger className="w-full">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how StudySync looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                {theme.mode === 'dark' ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              <Switch
                checked={theme.mode === 'dark'}
                onCheckedChange={toggleMode}
              />
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <Label>Accent Color</Label>
              </div>
              <div className="flex flex-wrap gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      theme.accent === color ? 'ring-2 ring-offset-2 ring-foreground' : ''
                    }`}
                    style={{ backgroundColor: ACCENT_COLOR_LABELS[color]?.color || 'hsl(217 91% 60%)' }}
                    title={ACCENT_COLOR_LABELS[color]?.label || color}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-foreground">Sign Out</p>
                <p className="text-sm text-muted-foreground">
                  Sign out from your account on this device
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Generator Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Avatar</DialogTitle>
          </DialogHeader>
          <AvatarGenerator value={avatarConfig} onChange={setAvatarConfig} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAvatar}>Save Avatar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
