import * as z from "zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { createPost } from "@/lib/api/api";

type CirclePostFormProps = {
  circleId?: string;
};

const CirclePostForm = ({ circleId }: CirclePostFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: "",
      file: [],
      location: "",
      tags: "",
    },
  });

  // Handler
  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    if (!circleId) {
      toast({
        title: "Error",
        description: "Circle ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create post with circle ID
      const postData = {
        ...value,
        userId: user.id,
        circleId: circleId,
      };

      const newPost = await createPost(postData);

      if (!newPost) {
        toast({
          title: "Post failed. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post created successfully! 🎉",
        description: "Your post has been shared to the circle",
      });

      navigate(`/circles/${circleId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create post",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full max-w-5xl">
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
                  mediaUrl=""
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

        <div className="flex gap-4 items-center justify-end">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => navigate(`/circles/${circleId}`)}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader />}
            Post to Circle
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CirclePostForm;
