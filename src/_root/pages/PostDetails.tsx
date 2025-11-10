import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Heart, Flame, Zap, Sparkles, MessageSquare } from "lucide-react";

import { Button, Textarea } from "@/components/ui";
import { MasonryGrid, PostStats, MediaCarousel } from "@/components/shared";
import { getComments, createComment, deleteComment, getPostReactions } from "@/lib/api/api";
import { useToast } from "@/components/ui/use-toast";

import {
  useGetPostById,
  useGetUserPosts,
  useDeletePost,
} from "@/lib/react-query/queries";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";

const PostDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserContext();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reactionsData, setReactionsData] = useState<any>(null);

  const { data: post, isLoading } = useGetPostById(id);
  const { data: userPosts, isLoading: isUserPostLoading } = useGetUserPosts(
    post?.creator._id
  );
  const { mutate: deletePost } = useDeletePost();

  const relatedPosts = userPosts?.documents.filter(
    (userPost: any) => userPost._id !== id
  );

  // Fetch comments and reactions
  useEffect(() => {
    if (id) {
      fetchComments();
      fetchReactions();
    }
  }, [id]);

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const fetchedComments = await getComments(id!);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchReactions = async () => {
    try {
      const reactions = await getPostReactions(id!);
      setReactionsData(reactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast({
        title: 'Comment cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await createComment(id!, commentText);
      setComments([response.comment, ...comments]);
      setCommentText('');
      toast({
        title: 'Comment posted! 💬',
      });
    } catch (error: any) {
      toast({
        title: 'Error posting comment',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
      toast({
        title: 'Comment deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting comment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = () => {
    deletePost({ postId: id, imageId: post?.imageId });
    navigate(-1);
  };

  return (
    <div className="post_details-container">
      <div className="md:flex max-w-5xl w-full">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="shad-button_ghost">
          <img
            src={"/assets/icons/back.svg"}
            alt="back"
            width={24}
            height={24}
          />
          <p className="small-medium lg:base-medium">Back</p>
        </Button>
      </div>

      {isLoading || !post ? (
        <div className="post_details-card animate-pulse">
          <div className="h-96 bg-dark-4 rounded-xl mb-4"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-dark-4 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-dark-4 rounded w-32 mb-2"></div>
              <div className="h-3 bg-dark-4 rounded w-24"></div>
            </div>
          </div>
          <div className="h-4 bg-dark-4 rounded w-full mb-2"></div>
          <div className="h-4 bg-dark-4 rounded w-3/4 mb-4"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-dark-4 rounded w-20"></div>
            <div className="h-10 bg-dark-4 rounded w-20"></div>
            <div className="h-10 bg-dark-4 rounded w-20"></div>
          </div>
        </div>
      ) : (
        <div className="post_details-card">
          {post?.mediaUrls && post.mediaUrls.length > 0 ? (
            <MediaCarousel 
              media={post.mediaUrls} 
              className="post_details-img" 
              showVideoControls={true}
            />
          ) : post?.imageUrl ? (
            <img
              src={post.imageUrl}
              alt="post media"
              className="post_details-img"
            />
          ) : null}

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${post?.creator._id}`}
                className="flex items-center gap-3">
                <img
                  src={
                    post?.creator.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 lg:w-12 lg:h-12 rounded-full"
                />
                <div className="flex gap-1 flex-col">
                  <p className="base-medium lg:body-bold text-light-1">
                    {post?.creator.name}
                  </p>
                  <div className="flex-center gap-2 text-light-3">
                    <p className="subtle-semibold lg:small-regular ">
                      {multiFormatDateString(post?.createdAt)}
                    </p>
                    •
                    <p className="subtle-semibold lg:small-regular">
                      {post?.location}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex-center gap-4">
                <Link
                  to={`/update-post/${post?._id}`}
                  className={`${user.id !== post?.creator._id && "hidden"}`}>
                  <img
                    src={"/assets/icons/edit.svg"}
                    alt="edit"
                    width={24}
                    height={24}
                  />
                </Link>

                <Button
                  onClick={handleDeletePost}
                  variant="ghost"
                  className={`ost_details-delete_btn ${
                    user.id !== post?.creator._id && "hidden"
                  }`}>
                  <img
                    src={"/assets/icons/delete.svg"}
                    alt="delete"
                    width={24}
                    height={24}
                  />
                </Button>
              </div>
            </div>

            <hr className="border w-full border-dark-4/80" />

            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p>{post?.caption}</p>
              <ul className="flex gap-1 mt-2">
                {post?.tags.map((tag: string, index: string) => (
                  <li
                    key={`${tag}${index}`}
                    className="text-light-3 small-regular">
                    #{tag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full">
              <PostStats post={{ ...post, comments }} userId={user.id} />
            </div>

            {/* Reactions Section */}
            {reactionsData && (
              <div className="w-full mt-6">
                <h4 className="base-semibold mb-4">
                  Reactions ({
                    (reactionsData.heart?.length || 0) + 
                    (reactionsData.fire?.length || 0) + 
                    (reactionsData.mindBlown?.length || 0) + 
                    (reactionsData.vibeCheck?.length || 0) + 
                    (reactionsData.realTalk?.length || 0)
                  })
                </h4>
                <div className="flex flex-col gap-3">
                  {/* Heart */}
                  {reactionsData.heart && reactionsData.heart.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Heart size={20} fill="#FF1744" stroke="#FF1744" />
                      <div className="flex flex-wrap gap-2">
                        {reactionsData.heart.map((heartUser: any) => (
                          <Link
                            key={heartUser._id}
                            to={`/profile/${heartUser._id}`}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-dark-4 hover:bg-dark-3 transition-all"
                          >
                            <img
                              src={heartUser.imageUrl || '/assets/icons/profile-placeholder.svg'}
                              alt={heartUser.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="small-regular text-light-2">{heartUser.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fire */}
                  {reactionsData.fire && reactionsData.fire.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Flame size={20} fill="#FF6B35" stroke="#FF6B35" />
                      <div className="flex flex-wrap gap-2">
                        {reactionsData.fire.map((user: any) => (
                          <Link
                            key={user._id}
                            to={`/profile/${user._id}`}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-dark-4 hover:bg-dark-3 transition-all"
                          >
                            <img
                              src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
                              alt={user.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="small-regular text-light-2">{user.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mind Blown */}
                  {reactionsData.mindBlown && reactionsData.mindBlown.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Zap size={20} fill="#FFD700" stroke="#FFD700" />
                      <div className="flex flex-wrap gap-2">
                        {reactionsData.mindBlown.map((user: any) => (
                          <Link
                            key={user._id}
                            to={`/profile/${user._id}`}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-dark-4 hover:bg-dark-3 transition-all"
                          >
                            <img
                              src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
                              alt={user.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="small-regular text-light-2">{user.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vibe Check */}
                  {reactionsData.vibeCheck && reactionsData.vibeCheck.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Sparkles size={20} fill="#9D4EDD" stroke="#9D4EDD" />
                      <div className="flex flex-wrap gap-2">
                        {reactionsData.vibeCheck.map((user: any) => (
                          <Link
                            key={user._id}
                            to={`/profile/${user._id}`}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-dark-4 hover:bg-dark-3 transition-all"
                          >
                            <img
                              src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
                              alt={user.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="small-regular text-light-2">{user.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real Talk */}
                  {reactionsData.realTalk && reactionsData.realTalk.length > 0 && (
                    <div className="flex items-start gap-3">
                      <MessageSquare size={20} fill="#06D6A0" stroke="#06D6A0" />
                      <div className="flex flex-wrap gap-2">
                        {reactionsData.realTalk.map((user: any) => (
                          <Link
                            key={user._id}
                            to={`/profile/${user._id}`}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-dark-4 hover:bg-dark-3 transition-all"
                          >
                            <img
                              src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
                              alt={user.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="small-regular text-light-2">{user.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="w-full mt-6">
              <h4 className="base-semibold mb-4">Comments ({comments.length})</h4>
              
              {/* Comment Input */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-3">
                  <img
                    src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="shad-textarea resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="submit"
                        disabled={isSubmittingComment || !commentText.trim()}
                        className="shad-button_primary"
                      >
                        {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-dark-4 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-dark-4 rounded w-24 mb-2"></div>
                          <div className="h-2 bg-dark-4 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-dark-4 rounded w-full mb-2"></div>
                      <div className="h-4 bg-dark-4 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {comments.map((comment: any) => (
                    <div key={comment._id} className="flex gap-3">
                      <Link to={`/profile/${comment.user._id}`}>
                        <img
                          src={comment.user.imageUrl || "/assets/icons/profile-placeholder.svg"}
                          alt={comment.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/profile/${comment.user._id}`}
                            className="base-medium text-light-1 hover:text-primary-500"
                          >
                            {comment.user.name}
                          </Link>
                          {comment.user._id === user.id && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-light-4 hover:text-red text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="small-regular text-light-3 mt-1">
                          {comment.text}
                        </p>
                        <p className="subtle-semibold text-light-4 mt-1">
                          {multiFormatDateString(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-light-4 small-regular">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        <hr className="border w-full border-dark-4/80" />

        <h3 className="body-bold md:h3-bold w-full my-10">
          More Related Posts
        </h3>
        {isUserPostLoading || !relatedPosts ? (
          <div className="grid-container">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative min-w-80 h-80 animate-pulse">
                <div className="h-full w-full bg-dark-4 rounded-[24px]"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="h-4 bg-dark-3 rounded w-3/4 mb-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-dark-3 rounded-full"></div>
                    <div className="h-3 bg-dark-3 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <MasonryGrid posts={relatedPosts} />
        )}
      </div>
    </div>
  );
};

export default PostDetails;
