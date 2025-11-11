import { Link } from 'react-router-dom';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  useAcceptVibeRequest,
  useRejectVibeRequest,
  useCancelVibeRequest,
} from '@/lib/react-query/queries';
import { multiFormatDateString } from '@/lib/utils';

type VibeRequestCardProps = {
  request: any;
  type: 'received' | 'sent';
};

const VibeRequestCard = ({ request, type }: VibeRequestCardProps) => {
  const { toast } = useToast();
  const { mutateAsync: acceptRequest, isLoading: isAccepting } = useAcceptVibeRequest();
  const { mutateAsync: rejectRequest, isLoading: isRejecting } = useRejectVibeRequest();
  const { mutateAsync: cancelRequest, isLoading: isCancelling } = useCancelVibeRequest();

  const user = type === 'received' ? request.sender : request.receiver;
  const isProcessing = isAccepting || isRejecting || isCancelling;

  const handleAccept = async () => {
    try {
      await acceptRequest(request._id);
      toast({
        title: 'Vibe Accepted!',
        description: `You are now peeps with ${user.name}! 🎉`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to accept vibe request',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    try {
      await rejectRequest(request._id);
      toast({
        title: 'Request Rejected',
        description: 'Vibe request has been rejected.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to reject vibe request',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRequest(request._id);
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
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'accepted':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">
            <Check className="w-3 h-3" />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">
            <X className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-dark-3 rounded-lg hover:bg-dark-4 transition-colors gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Link to={`/profile/${user._id}`} className="flex-shrink-0">
          <img
            src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
            alt={user.name}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-dark-4"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${user._id}`}
              className="font-semibold text-sm sm:text-base hover:text-primary-500 transition-colors truncate"
            >
              {user.name}
            </Link>
            <span className="text-xs sm:text-sm text-light-3 truncate">@{user.username}</span>
          </div>
          {request.message && (
            <p className="text-xs sm:text-sm text-light-2 mt-1 italic line-clamp-2">"{request.message}"</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-light-4">
              {multiFormatDateString(request.createdAt)}
            </p>
            <div className="sm:hidden">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Action buttons */}
      {request.status === 'pending' && (
        <div className="flex items-center gap-2 sm:ml-4 w-full sm:w-auto">
          {type === 'received' ? (
            <>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 border-green-600 text-white"
              >
                <Check className="w-4 h-4 sm:mr-1" />
                <span className="sm:inline">Accept</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-dark-4 hover:bg-dark-2 border-dark-4 text-light-1"
              >
                <X className="w-4 h-4 sm:mr-1" />
                <span className="sm:inline">Reject</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-orange-600/20 hover:bg-orange-600/30 border-orange-600 text-orange-400"
            >
              <X className="w-4 h-4 sm:mr-1" />
              <span className="sm:inline">Cancel</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VibeRequestCard;
