import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Smile, Sparkles, Wind, Target, Palette, Brain, Zap, Waves, Minus } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import { PostValidation } from "@/lib/validation";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { FileUploader, Loader } from "@/components/shared";
import { useCreatePost, useUpdatePost } from "@/lib/react-query/queries";

type PostFormProps = {
  post?: any;
  action: "Create" | "Update";
};

const MOODS = [
  { value: 'happy', label: 'Happy', icon: Smile, iconColor: 'text-yellow-500' },
  { value: 'inspired', label: 'Inspired', icon: Sparkles, iconColor: 'text-purple-500' },
  { value: 'chill', label: 'Chill', icon: Wind, iconColor: 'text-blue-500' },
  { value: 'focused', label: 'Focused', icon: Target, iconColor: 'text-green-500' },
  { value: 'creative', label: 'Creative', icon: Palette, iconColor: 'text-pink-500' },
  { value: 'thoughtful', label: 'Thoughtful', icon: Brain, iconColor: 'text-indigo-500' },
  { value: 'energetic', label: 'Energetic', icon: Zap, iconColor: 'text-red-500' },
  { value: 'relaxed', label: 'Relaxed', icon: Waves, iconColor: 'text-teal-500' },
  { value: 'neutral', label: 'Neutral', icon: Minus, iconColor: 'text-gray-500' },
];

const PostForm = ({ post, action }: PostFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const [selectedMood, setSelectedMood] = useState(post?.mood || 'neutral');
  
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      file: [],
      location: post ? post.location : "",
      tags: post ? post.tags.join(",") : "",
    },
  });

  // Query
  const { mutateAsync: createPost, isLoading: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isLoading: isLoadingUpdate } =
    useUpdatePost();

  // Handler
  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    // ACTION = UPDATE
    if (post && action === "Update") {
      const updatedPost = await updatePost({
        ...value,
        postId: post._id,
        imageId: post.imageId,
        imageUrl: post.imageUrl,
      });

      if (!updatedPost) {
        toast({
          title: `${action} post failed. Please try again.`,
        });
      }
      return navigate(`/posts/${post._id}`);
    }

    // ACTION = CREATE
    const newPost = await createPost({
      ...value,
      userId: user.id,
      mood: selectedMood,
    });

    if (!newPost) {
      toast({
        title: `${action} post failed. Please try again.`,
      });
    }
    navigate("/");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full  max-w-5xl">
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Caption</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea custom-scrollbar"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Photos</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.imageUrl}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Location</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (separated by comma " , ")
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Art, Expression, Learn"
                  type="text"
                  className="shad-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        {/* Mood Selector */}
        <div>
          <label className="shad-form_label mb-3 block">Select Your Mood</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {MOODS.map((mood) => {
              const MoodIcon = mood.icon;
              return (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 border ${
                    selectedMood === mood.value
                      ? 'bg-primary-500/20 border-primary-500 shadow-lg'
                      : 'bg-dark-4 border-dark-4 hover:bg-dark-3'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <MoodIcon 
                      size={28} 
                      className={selectedMood === mood.value ? 'text-primary-500' : mood.iconColor} 
                    />
                    <span className="text-xs text-light-2 font-medium">{mood.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-light-3 mt-2">
            Your mood helps others discover content that matches their vibe
          </p>
        </div>

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
            disabled={isLoadingCreate || isLoadingUpdate}>
            {(isLoadingCreate || isLoadingUpdate) && <Loader />}
            {action} Post
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostForm;
