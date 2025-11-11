import { useState, useEffect } from 'react';
import { 
  User, Bell, Eye, Shield, Heart, Settings as SettingsIcon,
  ChevronRight, ChevronLeft, Coffee, Zap, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/AuthContext';
import { 
  useUpdateUser, 
  useChangePassword,
  useGetNotificationSettings,
  useUpdateNotificationSettings 
} from '@/lib/react-query/queries';

type SettingsTab = 'account' | 'privacy' | 'notifications' | 'preferences' | 'security';

const Settings = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Privacy Settings
  const [showEmail, setShowEmail] = useState(user.showEmail || false);
  const [showPhone, setShowPhone] = useState(user.showPhone || false);
  const [showLocation, setShowLocation] = useState(user.showLocation !== undefined ? user.showLocation : true);
  const [showDateOfBirth, setShowDateOfBirth] = useState(user.showDateOfBirth || false);
  
  // Preferences
  const [openToCoffeeChat, setOpenToCoffeeChat] = useState(user.preferences?.openToCoffeeChat ?? true);
  const [openToCollaboration, setOpenToCollaboration] = useState(user.preferences?.openToCollaboration ?? true);
  
  // Notification Settings
  const { data: notifSettings, isLoading: isLoadingNotif } = useGetNotificationSettings();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [vibeRequestNotif, setVibeRequestNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(true);
  const [followNotif, setFollowNotif] = useState(true);
  const [likeNotif, setLikeNotif] = useState(false);
  const [commentNotif, setCommentNotif] = useState(true);
  
  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutateAsync: changePassword } = useChangePassword();
  const { mutateAsync: updateNotificationSettings } = useUpdateNotificationSettings();

  // Load notification settings
  useEffect(() => {
    if (notifSettings) {
      setEmailNotifications(notifSettings.emailNotifications ?? true);
      setPushNotifications(notifSettings.pushNotifications ?? true);
      setVibeRequestNotif(notifSettings.vibeRequestNotif ?? true);
      setMessageNotif(notifSettings.messageNotif ?? true);
      setFollowNotif(notifSettings.followNotif ?? true);
      setLikeNotif(notifSettings.likeNotif ?? false);
      setCommentNotif(notifSettings.commentNotif ?? true);
    }
  }, [notifSettings]);

  const handleSavePrivacy = async () => {
    setIsLoading(true);
    try {
      await updateUser({
        userId: user.id,
        name: user.name,
        bio: user.bio,
        file: [],
        showEmail,
        showPhone,
        showLocation,
        showDateOfBirth,
      });
      
      toast({
        title: 'Privacy settings updated',
        description: 'Your privacy preferences have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to update privacy settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await updateUser({
        userId: user.id,
        name: user.name,
        bio: user.bio,
        file: [],
        preferences: {
          openToCoffeeChat,
          openToCollaboration,
        },
      });
      
      toast({
        title: 'Preferences updated',
        description: 'Your preferences have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to update preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await updateNotificationSettings({
        emailNotifications,
        pushNotifications,
        vibeRequestNotif,
        messageNotif,
        followNotif,
        likeNotif,
        commentNotif,
      });
      
      toast({
        title: 'Notification settings saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to update notification settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to change password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Heart },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-light-1 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-light-1">Email</p>
                      <p className="text-sm text-light-3">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.isEmailVerified 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-orange-500/20 text-orange-500'
                    }`}>
                      {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-light-1">Username</p>
                      <p className="text-sm text-light-3">@{user.username}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-light-1 mb-2">Account Stats</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-light-4">Level</p>
                          <p className="text-lg font-bold text-primary-500">{user.level || 1}</p>
                        </div>
                        <div>
                          <p className="text-xs text-light-4">Energy</p>
                          <p className="text-lg font-bold text-green-500">{user.energy || 100}</p>
                        </div>
                        <div>
                          <p className="text-xs text-light-4">Peeps</p>
                          <p className="text-lg font-bold text-pink-500">{user.peeps?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-light-4">Followers</p>
                          <p className="text-lg font-bold text-blue-500">{user.followers?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-light-1 mb-2">Privacy Settings</h3>
              <p className="text-sm text-light-3 mb-6">Control what information is visible on your profile</p>
              
              <div className="space-y-4">
                {[
                  { label: 'Show Email', desc: 'Display your email on your profile', state: showEmail, setState: setShowEmail },
                  { label: 'Show Phone', desc: 'Display your phone number on your profile', state: showPhone, setState: setShowPhone },
                  { label: 'Show Location', desc: 'Display your location on your profile', state: showLocation, setState: setShowLocation },
                  { label: 'Show Date of Birth', desc: 'Display your birthday on your profile', state: showDateOfBirth, setState: setShowDateOfBirth },
                ].map((item) => (
                  <div key={item.label} className="glass-card p-3 md:p-4 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-light-1 truncate">{item.label}</p>
                      <p className="text-xs text-light-4 line-clamp-2">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.setState(!item.state)}
                      className={`relative flex-shrink-0 w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors ${
                        item.state ? 'bg-primary-500' : 'bg-dark-4'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        item.state ? 'translate-x-5 sm:translate-x-6' : ''
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSavePrivacy}
                disabled={isLoading}
                className="w-full mt-6 bg-primary-500 hover:bg-primary-600"
              >
                {isLoading ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-light-1 mb-2">Notification Preferences</h3>
              <p className="text-sm text-light-3 mb-6">Choose what notifications you want to receive</p>
              
              <div className="space-y-4">
                <div className="glass-card p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-light-1 mb-4">General</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Email Notifications', desc: 'Receive notifications via email', state: emailNotifications, setState: setEmailNotifications },
                      { label: 'Push Notifications', desc: 'Receive push notifications', state: pushNotifications, setState: setPushNotifications },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-light-1 truncate">{item.label}</p>
                          <p className="text-xs text-light-4 line-clamp-2">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => item.setState(!item.state)}
                          className={`relative flex-shrink-0 w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors ${
                            item.state ? 'bg-primary-500' : 'bg-dark-4'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            item.state ? 'translate-x-5 sm:translate-x-6' : ''
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-light-1 mb-4">Activity</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Vibe Requests', desc: 'New vibe requests', state: vibeRequestNotif, setState: setVibeRequestNotif },
                      { label: 'Messages', desc: 'New messages', state: messageNotif, setState: setMessageNotif },
                      { label: 'New Followers', desc: 'When someone follows you', state: followNotif, setState: setFollowNotif },
                      { label: 'Likes', desc: 'When someone likes your post', state: likeNotif, setState: setLikeNotif },
                      { label: 'Comments', desc: 'When someone comments on your post', state: commentNotif, setState: setCommentNotif },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-light-1 truncate">{item.label}</p>
                          <p className="text-xs text-light-4 line-clamp-2">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => item.setState(!item.state)}
                          className={`relative flex-shrink-0 w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors ${
                            item.state ? 'bg-primary-500' : 'bg-dark-4'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            item.state ? 'translate-x-5 sm:translate-x-6' : ''
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={isLoading || isLoadingNotif}
                className="w-full mt-6 bg-primary-500 hover:bg-primary-600"
              >
                {isLoading ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-light-1 mb-2">Vibe Preferences</h3>
              <p className="text-sm text-light-3 mb-6">Customize your experience on Peep</p>
              
              <div className="space-y-4">
                <div className="glass-card p-3 md:p-4 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                      <Coffee className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-light-1 truncate">Open to Coffee Chats</p>
                      <p className="text-xs text-light-4 line-clamp-2">Let others know you're available for coffee chats</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenToCoffeeChat(!openToCoffeeChat)}
                    className={`relative flex-shrink-0 w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors ${
                      openToCoffeeChat ? 'bg-primary-500' : 'bg-dark-4'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      openToCoffeeChat ? 'translate-x-5 sm:translate-x-6' : ''
                    }`} />
                  </button>
                </div>

                <div className="glass-card p-3 md:p-4 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-light-1 truncate">Open to Collaboration</p>
                      <p className="text-xs text-light-4 line-clamp-2">Show you're interested in collaborating on projects</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenToCollaboration(!openToCollaboration)}
                    className={`relative flex-shrink-0 w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors ${
                      openToCollaboration ? 'bg-primary-500' : 'bg-dark-4'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      openToCollaboration ? 'translate-x-5 sm:translate-x-6' : ''
                    }`} />
                  </button>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Heart className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-light-1">Current Mood</p>
                      <p className="text-xs text-light-4">Your current vibe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-primary-500/20 text-primary-500 rounded-full text-sm capitalize">
                      {user.currentMood || 'neutral'}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={isLoading}
                className="w-full mt-6 bg-primary-500 hover:bg-primary-600"
              >
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-light-1 mb-2">Security Settings</h3>
              <p className="text-sm text-light-3 mb-6">Manage your account security</p>
              
              <div className="space-y-4">
                <div className="glass-card p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-light-1 mb-4">Change Password</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-light-4 mb-1 block">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-4 border border-dark-4 rounded-lg text-light-1 text-sm focus:outline-none focus:border-primary-500"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-light-4 mb-1 block">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-4 border border-dark-4 rounded-lg text-light-1 text-sm focus:outline-none focus:border-primary-500"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-light-4 mb-1 block">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-4 border border-dark-4 rounded-lg text-light-1 text-sm focus:outline-none focus:border-primary-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full bg-primary-500 hover:bg-primary-600"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-light-1 mb-3">Two-Factor Authentication</h4>
                  <p className="text-xs text-light-4 mb-4">Add an extra layer of security to your account</p>
                  <Button
                    variant="outline"
                    className="w-full bg-dark-4 hover:bg-dark-3 border-dark-4"
                    disabled
                  >
                    Enable 2FA (Coming Soon)
                  </Button>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-light-1 mb-3">Active Sessions</h4>
                  <p className="text-xs text-light-4 mb-4">Manage devices where you're logged in</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-dark-4 rounded-lg">
                      <div>
                        <p className="text-sm text-light-1">Current Device</p>
                        <p className="text-xs text-light-4">Last active: Now</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {activeTab && (
            <button
              onClick={() => setActiveTab(null)}
              className="md:hidden p-2 hover:bg-dark-4 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <SettingsIcon className="w-8 h-8" />
          <h2 className="h3-bold md:h2-bold">Settings</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-6 max-w-6xl">
          {/* Sidebar Tabs - Hidden on mobile when a tab is selected */}
          <div className={`w-full md:w-64 flex-shrink-0 ${activeTab ? 'hidden md:block' : 'block'}`}>
            <div className="glass-card rounded-xl p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-light-3 hover:bg-dark-4 hover:text-light-1'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto ${isActive ? '' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area - Slides in on mobile */}
          <div className={`flex-1 ${!activeTab ? 'hidden md:block' : 'block'} ${
            activeTab ? 'animate-slide-in-right' : ''
          }`}>
            {activeTab ? (
              <div className="glass-card rounded-xl p-6">
                {renderTabContent()}
              </div>
            ) : (
              <div className="hidden md:flex glass-card rounded-xl p-12 items-center justify-center">
                <div className="text-center">
                  <SettingsIcon className="w-16 h-16 mx-auto mb-4 text-light-4" />
                  <p className="text-light-3">Select a setting category to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

