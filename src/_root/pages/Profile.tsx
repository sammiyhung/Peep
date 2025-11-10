import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Zap, Award, Coffee, Users, MessageCircle, UserPlus, UserMinus, ChevronDown } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';

import { Button } from "@/components/ui";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserById } from "@/lib/react-query/queries";
import { MasonryGrid, Loader, ImageViewer } from "@/components/shared";
import { followUser, requestCoffeeChat, sendCollaborationRequest } from "@/lib/api/api";
import { useToast } from "@/components/ui/use-toast";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import Followers from "./Followers";
import Following from "./Following";
import About from "./About";

interface StabBlockProps {
  value: string | number;
  label: string;
}

interface BadgeType {
  icon: any;
  label: string;
  color: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const VibeIndicator = ({ mood }: { mood: string }) => {
  const moodColors: Record<string, string> = {
    happy: "bg-yellow-500",
    inspired: "bg-purple-500",
    chill: "bg-blue-500",
    focused: "bg-green-500",
    creative: "bg-pink-500",
  };
  
  return (
    <div className="flex items-center gap-2 bg-dark-3 px-3 py-1.5 rounded-full">
      <div className={`w-2 h-2 rounded-full ${moodColors[mood.toLowerCase()] || 'bg-gray-500'} animate-pulse`} />
      <span className="text-xs text-light-3 capitalize">{mood}</span>
    </div>
  );
};

const Badge = ({ icon: Icon, label, color }: { icon: any, label: string, color: string }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${color} bg-opacity-20 border border-opacity-30`}>
    <Icon className={`w-3.5 h-3.5 ${color.replace('bg-', 'text-')}`} />
    <span className="text-xs font-medium text-light-2">{label}</span>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: currentUser, refetch } = useGetUserById(id || "");
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      setFollowersCount(currentUser.followers?.length || 0);
      setFollowingCount(currentUser.following?.length || 0);
      setIsFollowing(currentUser.followers?.includes(user.id) || false);
    }
  }, [currentUser, user.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  
  // Extract data from currentUser (now coming from backend)
  const peepEnergy = currentUser.energy || 100;
  const authenticityScore = currentUser.authenticityScore || 50;
  const currentMood = currentUser.currentMood || "neutral";
  const badges = currentUser.badges || [];
  
  const handleFollow = async () => {
    try {
      setIsLoadingAction(true);
      const response = await followUser(currentUser._id);
      setIsFollowing(response.isFollowing);
      setFollowersCount(response.followersCount);
      toast({
        title: response.message,
      });
      
      // Invalidate queries to update all components
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USER_BY_ID] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_CURRENT_USER] });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to follow user",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  
  const handleCoffeeChat = async () => {
    try {
      setIsLoadingAction(true);
      await requestCoffeeChat(currentUser._id);
      toast({
        title: "Coffee Chat Requested! ☕",
        description: "You'll be matched for a 10-minute chat soon!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to request coffee chat",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  
  const handleCollaborate = async () => {
    try {
      setIsLoadingAction(true);
      await sendCollaborationRequest(currentUser._id, "New Project", "Let's collaborate!");
      toast({
        title: "Collaboration Request Sent! 🤝",
        description: "They'll receive your request soon!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send collaboration request",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        {/* Back Button - Separate from main layout */}
        <button 
          onClick={() => {
            if (location.state?.from) {
              navigate(location.state.from);
            } else {
              navigate('/');
            }
          }} 
          className="flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-light-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <p className="text-light-3 small-medium">Back</p>
        </button>

        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={
              currentUser.imageUrl || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
            onClick={() => currentUser.imageUrl && setShowImageViewer(true)}
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full gap-3">
              <div className="flex items-center justify-center xl:justify-start gap-3 flex-wrap">
                <h1 className="text-center xl:text-left h3-bold md:h1-semibold">
                  {currentUser.name}
                </h1>
                <VibeIndicator mood={currentMood} />
              </div>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser.username}
              </p>
              
              {/* Peep Energy & Authenticity Score */}
              <div className="flex gap-4 items-center justify-center xl:justify-start flex-wrap mt-2">
                <div className="flex items-center gap-2 bg-dark-3 px-3 py-1.5 rounded-lg">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-light-1">{peepEnergy}</span>
                  <span className="text-xs text-light-3">Energy</span>
                </div>
                <div className="flex items-center gap-2 bg-dark-3 px-3 py-1.5 rounded-lg">
                  <Award className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-light-1">{authenticityScore}%</span>
                  <span className="text-xs text-light-3">Authentic</span>
                </div>
              </div>
              
              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex gap-2 items-center justify-center xl:justify-start flex-wrap mt-2">
                  {badges.map((badge: BadgeType, index: number) => (
                    <Badge key={index} icon={badge.icon} label={badge.label} color={badge.color} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-8 mt-6 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={currentUser.posts?.length || 0} label="Posts" />
              <StatBlock value={followersCount} label="Followers" />
              <StatBlock value={followingCount} label="Following" />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-5 max-w-screen-sm">
              {currentUser.bio}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-3 xl:items-end">
            {/* Own Profile Actions */}
            <div className={`${user.id !== currentUser._id && "hidden"} w-full xl:w-auto`}>
              <Link
                to={`/update-profile/${currentUser._id}`}
                className="h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg hover:bg-dark-3 transition w-full xl:w-auto">
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            </div>
            
            {/* Other User Actions */}
            <div className={`${user.id === id && "hidden"} flex flex-col gap-2 w-full xl:w-auto xl:min-w-[240px]`}>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="shad-button_primary px-5 flex items-center gap-2 flex-1"
                  onClick={() => navigate(`/chat/${currentUser._id}`)}
                  disabled={isLoadingAction}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={`px-5 flex items-center gap-2 flex-1 ${
                    isFollowing 
                      ? 'bg-dark-3 border-dark-3 hover:bg-dark-4' 
                      : 'bg-primary-500 border-primary-500 hover:bg-primary-600 text-white'
                  }`}
                  onClick={handleFollow}
                  disabled={isLoadingAction}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="px-5 flex items-center gap-2 bg-dark-4 border-dark-4 hover:bg-dark-3 w-full"
                onClick={handleCoffeeChat}
                disabled={isLoadingAction}
              >
                <Coffee className="w-4 h-4" />
                Coffee Chat
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="px-5 flex items-center gap-2 bg-dark-4 border-dark-4 hover:bg-dark-3 w-full"
                onClick={handleCollaborate}
                disabled={isLoadingAction}
              >
                <Users className="w-4 h-4" />
                Collaborate
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Tabs - Hidden on small screens */}
        <div className="hidden md:flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${
              pathname === `/profile/${id}` && "!bg-dark-3"
            }`}>
            <Zap className="w-5 h-5" />
            <span className="tab-text">About</span>
          </Link>
          <Link
            to={`/profile/${id}/posts`}
            className={`profile-tab ${
              pathname === `/profile/${id}/posts` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            <span className="tab-text">Posts</span>
          </Link>
          <Link
            to={`/profile/${id}/followers`}
            className={`profile-tab ${
              pathname === `/profile/${id}/followers` && "!bg-dark-3"
            }`}>
            <Users className="w-5 h-5" />
            <span className="tab-text">Followers</span>
          </Link>
          <Link
            to={`/profile/${id}/following`}
            className={`profile-tab rounded-r-lg ${
              pathname === `/profile/${id}/following` && "!bg-dark-3"
            }`}>
            <UserPlus className="w-5 h-5" />
            <span className="tab-text">Following</span>
          </Link>
        </div>

        {/* Mobile Dropdown - Visible only on small screens */}
        <div className="md:hidden w-full max-w-5xl relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between bg-dark-2 px-4 py-3 rounded-lg text-light-1 hover:bg-dark-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              {pathname === `/profile/${id}` && (
                <>
                  <Zap className="w-5 h-5" />
                  <span>About</span>
                </>
              )}
              {pathname === `/profile/${id}/posts` && (
                <>
                  <img src={"/assets/icons/posts.svg"} alt="posts" width={20} height={20} />
                  <span>Posts</span>
                </>
              )}
              {pathname === `/profile/${id}/followers` && (
                <>
                  <Users className="w-5 h-5" />
                  <span>Followers</span>
                </>
              )}
              {pathname === `/profile/${id}/following` && (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Following</span>
                </>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-dark-3 rounded-lg border border-dark-4 shadow-lg z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <Link
                to={`/profile/${id}`}
                onClick={() => setShowDropdown(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-dark-4 transition-colors ${
                  pathname === `/profile/${id}` ? 'bg-dark-4 text-primary-500' : 'text-light-1'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>About</span>
              </Link>
              <Link
                to={`/profile/${id}/posts`}
                onClick={() => setShowDropdown(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-dark-4 transition-colors ${
                  pathname === `/profile/${id}/posts` ? 'bg-dark-4 text-primary-500' : 'text-light-1'
                }`}
              >
                <img src={"/assets/icons/posts.svg"} alt="posts" width={20} height={20} />
                <span>Posts</span>
              </Link>
              <Link
                to={`/profile/${id}/followers`}
                onClick={() => setShowDropdown(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-dark-4 transition-colors ${
                  pathname === `/profile/${id}/followers` ? 'bg-dark-4 text-primary-500' : 'text-light-1'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Followers</span>
              </Link>
              <Link
                to={`/profile/${id}/following`}
                onClick={() => setShowDropdown(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-dark-4 transition-colors ${
                  pathname === `/profile/${id}/following` ? 'bg-dark-4 text-primary-500' : 'text-light-1'
                }`}
              >
                <UserPlus className="w-5 h-5" />
                <span>Following</span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col w-full">
          <Routes>
            <Route index element={<About />} />
            <Route
              path="/posts"
              element={
                currentUser.posts && currentUser.posts.length > 0 ? (
                  <MasonryGrid posts={currentUser.posts} showUser={false} />
                ) : (
                  <p className="text-light-4 text-center mt-10 w-full">No posts yet</p>
                )
              }
            />
            <Route path="/followers" element={<Followers />} />
            <Route path="/following" element={<Following />} />
          </Routes>
          <Outlet />
        </div>
      </div>

      {/* Image Viewer Overlay */}
      {showImageViewer && currentUser.imageUrl && (
        <ImageViewer
          imageUrl={currentUser.imageUrl}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </div>
  );
};

export default Profile;
