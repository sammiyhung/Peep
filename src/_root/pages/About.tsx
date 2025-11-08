import { useParams } from "react-router-dom";
import { useGetUserById } from "@/lib/react-query/queries";
import { Loader } from "@/components/shared";
import { MapPin, Briefcase, Calendar, Globe, Phone, Mail, Heart, Sparkles, Zap } from "lucide-react";

const About = () => {
  const { id } = useParams();
  const { data: currentUser, isLoading } = useGetUserById(id || "");

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (!currentUser) {
    return <p className="text-light-3 text-center">User not found</p>;
  }

  const InfoItem = ({ icon: Icon, label, value, show = true }: any) => {
    if (!value || !show) return null;
    return (
      <div className="flex items-start gap-3 p-3 glass-card rounded-lg hover:bg-dark-4 transition-all duration-300">
        <Icon className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-light-3 mb-1">{label}</p>
          <p className="text-sm text-light-1 break-words">{value}</p>
        </div>
      </div>
    );
  };

  // Format interests - handle both array and string
  const formatInterests = (interests: any) => {
    if (!interests) return null;
    if (Array.isArray(interests)) {
      return interests.length > 0 ? interests.join(', ') : null;
    }
    return interests;
  };

  // Format date of birth
  const formatDateOfBirth = (dateString: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString; // Return original if error
    }
  };

  const formattedInterests = formatInterests(currentUser.interests);
  const formattedDateOfBirth = formatDateOfBirth(currentUser.dateOfBirth);

  const hasAnyInfo = currentUser.location || currentUser.dateOfBirth || currentUser.email || currentUser.phone || currentUser.website || currentUser.gender || currentUser.occupation || currentUser.company || currentUser.skills || formattedInterests;

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl animate-fade-in">
      {/* About Me Section */}
      {currentUser.aboutMe && (
        <div className="glass-card p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-500" />
            About Me
          </h3>
          <p className="text-light-2 leading-relaxed text-sm">{currentUser.aboutMe}</p>
        </div>
      )}

      {/* Current Vibe */}
      {currentUser.currentMood && (
        <div className="glass-card p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-bold mb-2">Current Vibe</h3>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
            <span className="text-2xl">✨</span>
            <span className="text-light-1 font-medium capitalize">{currentUser.currentMood}</span>
          </div>
        </div>
      )}

      {/* All Information */}
      {hasAnyInfo && (
        <div className="glass-card p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-bold mb-3">Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoItem 
              icon={MapPin} 
              label="Location" 
              value={currentUser.location} 
              show={currentUser.showLocation !== false} 
            />
            <InfoItem 
              icon={Calendar} 
              label="Date of Birth" 
              value={formattedDateOfBirth} 
              show={currentUser.showDateOfBirth === true} 
            />
            <InfoItem 
              icon={Mail} 
              label="Email" 
              value={currentUser.email} 
              show={currentUser.showEmail === true} 
            />
            <InfoItem 
              icon={Phone} 
              label="Phone" 
              value={currentUser.phone} 
              show={currentUser.showPhone === true} 
            />
            <InfoItem 
              icon={Globe} 
              label="Website" 
              value={currentUser.website} 
            />
            {currentUser.gender && (
              <div className="flex items-start gap-3 p-3 glass-card rounded-lg hover:bg-dark-4 transition-all duration-300">
                <span className="text-lg mt-0.5">👤</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-light-3 mb-1">Gender</p>
                  <p className="text-sm text-light-1">{currentUser.gender}</p>
                </div>
              </div>
            )}
            <InfoItem 
              icon={Briefcase} 
              label="Occupation" 
              value={currentUser.occupation} 
            />
            <InfoItem 
              icon={Briefcase} 
              label="Company" 
              value={currentUser.company} 
            />
          </div>
          
          {currentUser.skills && (
            <div className="mt-3 p-3 glass-card rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary-500" />
                <p className="text-xs text-light-3">Skills</p>
              </div>
              <p className="text-sm text-light-1 leading-relaxed">{currentUser.skills}</p>
            </div>
          )}
          
          {formattedInterests && (
            <div className="mt-3 p-3 glass-card rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-primary-500" />
                <p className="text-xs text-light-3">Interests</p>
              </div>
              <p className="text-sm text-light-1 leading-relaxed">{formattedInterests}</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!currentUser.aboutMe && !hasAnyInfo && !currentUser.currentMood && (
        <div className="glass-card p-12 rounded-xl text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-dark-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-light-4" />
            </div>
            <div>
              <h3 className="h3-bold mb-2">No info yet</h3>
              <p className="text-light-3">
                This Peep hasn't shared their story yet. Check back later!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
