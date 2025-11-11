import { useState } from 'react';
import { Sparkles, UserCheck, UserX, Clock, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  useSendVibeRequest,
  useAcceptVibeRequest,
  useRejectVibeRequest,
  useCancelVibeRequest,
  useGetVibeRequestStatus,
} from '@/lib/react-query/queries';

type VibeButtonProps = {
  userId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
};

const VibeButton = ({
  userId,
  variant = 'default',
  size = 'default',
  showLabel = true,
  className = '',
}: VibeButtonProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current vibe request status
  const { data: vibeStatus, isLoading } = useGetVibeRequestStatus(userId);

  // Mutations
  const { mutateAsync: sendVibeRequest } = useSendVibeRequest();
  const { mutateAsync: acceptVibeRequest } = useAcceptVibeRequest();
  const { mutateAsync: rejectVibeRequest } = useRejectVibeRequest();
  const { mutateAsync: cancelVibeRequest } = useCancelVibeRequest();

  const handleSendVibe = async () => {
    setIsProcessing(true);
    try {
      await sendVibeRequest({ receiverId: userId });
      toast({
        title: 'Vibe Request Sent!',
        description: 'Your vibe request has been sent.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to send vibe request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptVibe = async () => {
    if (!vibeStatus?.vibeRequest?._id) return;
    setIsProcessing(true);
    try {
      await acceptVibeRequest(vibeStatus.vibeRequest._id);
      toast({
        title: 'Vibe Accepted!',
        description: 'You are now peeps! 🎉',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to accept vibe request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectVibe = async () => {
    if (!vibeStatus?.vibeRequest?._id) return;
    setIsProcessing(true);
    try {
      await rejectVibeRequest(vibeStatus.vibeRequest._id);
      toast({
        title: 'Vibe Rejected',
        description: 'Vibe request has been rejected.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to reject vibe request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelVibe = async () => {
    if (!vibeStatus?.vibeRequest?._id) return;
    setIsProcessing(true);
    try {
      await cancelVibeRequest(vibeStatus.vibeRequest._id);
      toast({
        title: 'Request Cancelled',
        description: 'Your vibe request has been cancelled.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to cancel vibe request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
        {showLabel && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  // Already peeps
  if (vibeStatus?.status === 'accepted') {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`${className} bg-dark-3 border-dark-4 text-light-3 cursor-not-allowed`}
      >
        <Users className="w-4 h-4 sm:hidden" />
        <span>Peeps</span>
      </Button>
    );
  }

  // Pending request - user is receiver
  if (vibeStatus?.status === 'pending' && !vibeStatus?.isSender) {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          size={size}
          onClick={handleAcceptVibe}
          disabled={isProcessing}
          className={`${className} bg-green-600 hover:bg-green-700 border-green-600 text-white`}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserCheck className="w-4 h-4 sm:hidden" />
          )}
          <span>Accept</span>
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={handleRejectVibe}
          disabled={isProcessing}
          className="bg-dark-3 hover:bg-dark-4 border-dark-4 text-light-1"
        >
          <UserX className="w-4 h-4 sm:hidden" />
          <span>Reject</span>
        </Button>
      </div>
    );
  }

  // Pending request - user is sender
  if (vibeStatus?.status === 'pending' && vibeStatus?.isSender) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleCancelVibe}
        disabled={isProcessing}
        className={`${className} bg-orange-600/20 hover:bg-orange-600/30 border-orange-600 text-orange-400`}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Clock className="w-4 h-4 sm:hidden" />
        )}
        <span>Pending</span>
      </Button>
    );
  }

  // No request - show send vibe button
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSendVibe}
      disabled={isProcessing}
      className={`${className} bg-pink-600 hover:bg-pink-700 border-pink-600 text-white`}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 sm:hidden" />
      )}
      <span>Vibe</span>
    </Button>
  );
};

export default VibeButton;
