import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Textarea, Input, Button } from "@/components/ui";
import { ProfileUploader, Loader } from "@/components/shared";
import { api } from "@/lib/api/config";

import { ProfileValidation } from "@/lib/validation";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserById, useUpdateUser } from "@/lib/react-query/queries";
import useDebounce from "@/hooks/useDebounce";

const UpdateProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, setUser } = useUserContext();
  
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [selectedMood, setSelectedMood] = useState("Inspired");
  const [activeSection, setActiveSection] = useState<'basic' | 'personal' | 'professional' | 'privacy'>('basic');
  
  const moods = ["Happy", "Inspired", "Chill", "Focused", "Creative", "Energetic"];
  
  // Queries - fetch user data first
  const { data: currentUser } = useGetUserById(id || "");
  const { mutateAsync: updateUser, isLoading: isLoadingUpdate } =
    useUpdateUser();

  // Initialize form with currentUser data
  const form = useForm<z.infer<typeof ProfileValidation>>({
    resolver: zodResolver(ProfileValidation),
    defaultValues: {
      file: [],
      name: currentUser?.name || "",
      username: currentUser?.username || "",
      email: currentUser?.email || "",
      bio: currentUser?.bio || "",
      aboutMe: currentUser?.aboutMe || "",
      dateOfBirth: currentUser?.dateOfBirth || "",
      gender: currentUser?.gender || "",
      location: currentUser?.location || "",
      website: currentUser?.website || "",
      phone: currentUser?.phone || "",
      occupation: currentUser?.occupation || "",
      company: currentUser?.company || "",
      skills: currentUser?.skills || "",
      interests: currentUser?.interests || "",
      showEmail: currentUser?.showEmail ?? false,
      showPhone: currentUser?.showPhone ?? false,
      showLocation: currentUser?.showLocation ?? true,
      showDateOfBirth: currentUser?.showDateOfBirth ?? false,
    },
    mode: "onSubmit",
  });

  const watchedUsername = form.watch("username");
  const debouncedUsername = useDebounce(watchedUsername, 500);
  
  // Track if form has changes
  const { isDirty } = form.formState;
  
  // Normalize mood comparison (backend stores lowercase)
  const normalizedSelectedMood = selectedMood.toLowerCase();
  const normalizedCurrentMood = (currentUser?.currentMood || "inspired").toLowerCase();
  const moodChanged = normalizedSelectedMood !== normalizedCurrentMood;
  
  const hasChanges = isDirty || moodChanged;

  // Update form when currentUser loads
  useEffect(() => {
    if (currentUser) {
      const formValues = {
        file: [],
        name: currentUser.name,
        username: currentUser.username,
        email: currentUser.email,
        bio: currentUser.bio || "",
        aboutMe: currentUser.aboutMe || "",
        dateOfBirth: currentUser.dateOfBirth || "",
        gender: currentUser.gender || "",
        location: currentUser.location || "",
        website: currentUser.website || "",
        phone: currentUser.phone || "",
        occupation: currentUser.occupation || "",
        company: currentUser.company || "",
        skills: currentUser.skills || "",
        interests: currentUser.interests || "",
        showEmail: currentUser.showEmail ?? false,
        showPhone: currentUser.showPhone ?? false,
        showLocation: currentUser.showLocation ?? true,
        showDateOfBirth: currentUser.showDateOfBirth ?? false,
      };
      form.reset(formValues);
      // Capitalize first letter to match mood button format
      const mood = currentUser.currentMood || "inspired";
      const capitalizedMood = mood.charAt(0).toUpperCase() + mood.slice(1);
      setSelectedMood(capitalizedMood);
    }
  }, [currentUser, form]);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername === currentUser?.username || debouncedUsername.length < 2) {
        setUsernameAvailable(true);
        return;
      }
      
      setCheckingUsername(true);
      try {
        const response = await api.get(`/api/auth/check-username?username=${debouncedUsername}`);
        setUsernameAvailable(response.data.available);
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameAvailable(true);
      } finally {
        setCheckingUsername(false);
      }
    };
    
    checkUsername();
  }, [debouncedUsername, currentUser?.username]);

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  // Handler
  const handleUpdate = async (value: z.infer<typeof ProfileValidation>) => {
    try {
      const updatedUser = await updateUser({
        userId: currentUser._id,
        name: value.name,
        bio: value.bio,
        file: value.file,
        imageUrl: currentUser.imageUrl,
        imageId: currentUser.imageId,
        username: value.username,
        currentMood: selectedMood,
        aboutMe: value.aboutMe || "",
        // Personal Information
        dateOfBirth: value.dateOfBirth || "",
        gender: value.gender || "",
        location: value.location || "",
        website: value.website || "",
        phone: value.phone || "",
        // Professional Information
        occupation: value.occupation || "",
        company: value.company || "",
        skills: value.skills || "",
        interests: value.interests || "",
        // Privacy Settings
        showEmail: value.showEmail ?? false,
        showPhone: value.showPhone ?? false,
        showLocation: value.showLocation ?? true,
        showDateOfBirth: value.showDateOfBirth ?? false,
      });

      if (!updatedUser) {
        toast({
          title: `Update user failed. Please try again.`,
          variant: "destructive",
        });
        return;
      }

      setUser({
        ...user,
        name: updatedUser?.name,
        bio: updatedUser?.bio,
        imageUrl: updatedUser?.imageUrl,
        username: updatedUser?.username,
      });
      
      // Reset form dirty state
      const resetValues = {
        file: [],
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio || "",
        aboutMe: updatedUser.aboutMe || "",
        dateOfBirth: updatedUser.dateOfBirth || "",
        gender: updatedUser.gender || "",
        location: updatedUser.location || "",
        website: updatedUser.website || "",
        phone: updatedUser.phone || "",
        occupation: updatedUser.occupation || "",
        company: updatedUser.company || "",
        skills: updatedUser.skills || "",
        interests: updatedUser.interests || "",
        showEmail: updatedUser.showEmail ?? false,
        showPhone: updatedUser.showPhone ?? false,
        showLocation: updatedUser.showLocation ?? true,
        showDateOfBirth: updatedUser.showDateOfBirth ?? false,
      };
      form.reset(resetValues);
      // Capitalize first letter to match mood button format
      const mood = updatedUser.currentMood || "inspired";
      const capitalizedMood = mood.charAt(0).toUpperCase() + mood.slice(1);
      setSelectedMood(capitalizedMood);
      
      toast({
        title: "Profile updated successfully!",
      });
      
      navigate(`/profile/${id}`);
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Update failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="flex-start gap-3 justify-start w-full max-w-5xl">
          <img
            src="/assets/icons/edit.svg"
            width={36}
            height={36}
            alt="edit"
            className="invert-white"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Edit Profile</h2>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2 flex-wrap w-full max-w-5xl mt-6 mb-4">
          {[
            { key: 'basic', label: 'Basic Info' },
            { key: 'personal', label: 'Personal' },
            { key: 'professional', label: 'Professional' },
            { key: 'privacy', label: 'Privacy' },
          ].map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeSection === section.key
                  ? 'glass-card-active text-white'
                  : 'glass-card text-light-2 hover:text-light-1'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate(form.getValues());
            }}
            className="flex flex-col gap-7 w-full mt-4 max-w-5xl">
            
            {/* BASIC INFO SECTION */}
            {activeSection === 'basic' && (
              <>
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem className="flex">
                      <FormControl>
                        <ProfileUploader
                          fieldChange={field.onChange}
                          mediaUrl={currentUser.imageUrl}
                        />
                      </FormControl>
                      <FormMessage className="shad-form_message" />
                    </FormItem>
                  )}
                />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Name</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        className="shad-input pr-10"
                        {...field}
                      />
                      {checkingUsername && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-4 animate-spin" />
                      )}
                      {!checkingUsername && watchedUsername && watchedUsername !== user.username && watchedUsername.length >= 2 && usernameAvailable && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                      {!checkingUsername && watchedUsername && watchedUsername !== user.username && watchedUsername.length >= 2 && !usernameAvailable && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  {!usernameAvailable && watchedUsername && watchedUsername.length >= 2 && (
                    <p className="text-xs text-red-500 mt-1">Username is already taken</p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="shad-input"
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Bio Status</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="shad-input"
                      placeholder="A short status or tagline"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aboutMe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">About Me</FormLabel>
                  <FormControl>
                    <Textarea
                      className="shad-textarea custom-scrollbar"
                      placeholder="Tell us about yourself..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />
            
            {/* Mood Selector */}
            <div className="flex flex-col gap-2">
              <label className="shad-form_label">Current Vibe</label>
              <div className="flex gap-2 flex-wrap">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedMood === mood
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
              <p className="text-xs text-light-4 mt-1">
                Your current vibe will be shown on your profile and help match you with similar Peeps
              </p>
            </div>
              </>
            )}

            {/* PERSONAL INFO SECTION */}
            {activeSection === 'personal' && (
              <>
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" className="shad-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Gender</FormLabel>
                      <FormControl>
                        <select className="shad-input" {...field}>
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Location</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          className="shad-input" 
                          placeholder="City, Country" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Website</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          className="shad-input" 
                          placeholder="https://yourwebsite.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Phone</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          className="shad-input" 
                          placeholder="+1 234 567 8900" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* PROFESSIONAL INFO SECTION */}
            {activeSection === 'professional' && (
              <>
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Occupation</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          className="shad-input" 
                          placeholder="Software Engineer, Designer, etc." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Company</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          className="shad-input" 
                          placeholder="Company name or Freelance" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Skills</FormLabel>
                      <FormControl>
                        <Textarea
                          className="shad-textarea custom-scrollbar"
                          placeholder="JavaScript, Design, Photography, Writing..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Interests</FormLabel>
                      <FormControl>
                        <Textarea
                          className="shad-textarea custom-scrollbar"
                          placeholder="AI, Music, Travel, Gaming..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* PRIVACY SETTINGS SECTION */}
            {activeSection === 'privacy' && (
              <>
                <div className="flex flex-col gap-6">
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">Privacy Controls</h3>
                    <p className="text-sm text-light-3 mb-6">
                      Choose what information you want to share on your profile. You're in control!
                    </p>
                    
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="showEmail"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 glass-card rounded-lg">
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium cursor-pointer">
                                Show Email Address
                              </FormLabel>
                              <p className="text-xs text-light-3 mt-1">
                                Let other Peeps see your email
                              </p>
                            </div>
                            <FormControl>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                                <div className="w-11 h-6 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="showPhone"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 glass-card rounded-lg">
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium cursor-pointer">
                                Show Phone Number
                              </FormLabel>
                              <p className="text-xs text-light-3 mt-1">
                                Display your phone number publicly
                              </p>
                            </div>
                            <FormControl>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                                <div className="w-11 h-6 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="showLocation"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 glass-card rounded-lg">
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium cursor-pointer">
                                Show Location
                              </FormLabel>
                              <p className="text-xs text-light-3 mt-1">
                                Let Peeps know where you're vibing from
                              </p>
                            </div>
                            <FormControl>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                                <div className="w-11 h-6 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="showDateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 glass-card rounded-lg">
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium cursor-pointer">
                                Show Date of Birth
                              </FormLabel>
                              <p className="text-xs text-light-3 mt-1">
                                Share your birthday with the community
                              </p>
                            </div>
                            <FormControl>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                                <div className="w-11 h-6 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4 items-center justify-end">
              <Button
                type="button"
                className="shad-button_dark_4"
                onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="shad-button_primary whitespace-nowrap"
                disabled={isLoadingUpdate || !usernameAvailable || !hasChanges}>
                {isLoadingUpdate ? (
                  <>
                    <Loader />
                    <span className="ml-2">Updating...</span>
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UpdateProfile;
