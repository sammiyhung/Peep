import { useState } from 'react';
import { Users, UserPlus, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VibeRequestCard, Loader } from '@/components/shared';
import {
  useGetReceivedVibeRequests,
  useGetSentVibeRequests,
} from '@/lib/react-query/queries';

const Vibes = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('pending');

  const { data: receivedRequests, isLoading: isLoadingReceived } = useGetReceivedVibeRequests(
    filter === 'all' ? undefined : filter
  );
  const { data: sentRequests, isLoading: isLoadingSent } = useGetSentVibeRequests(
    filter === 'all' ? undefined : filter
  );

  const requests = activeTab === 'received' ? receivedRequests : sentRequests;
  const isLoading = activeTab === 'received' ? isLoadingReceived : isLoadingSent;

  const pendingReceivedCount = receivedRequests?.filter((r: any) => r.status === 'pending').length || 0;

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <Sparkles className="w-8 h-8" />
          <h2 className="h3-bold md:h2-bold text-left w-full">Vibes</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 mb-4 border-b border-dark-4">
          <Button
            variant="ghost"
            className={`px-6 py-3 rounded-t-lg transition-all ${
              activeTab === 'received'
                ? 'bg-primary-500/20 border-b-2 border-primary-500 text-primary-500 font-semibold'
                : 'text-light-3 hover:bg-dark-4 hover:text-light-1'
            }`}
            onClick={() => setActiveTab('received')}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Received
            {pendingReceivedCount > 0 && (
              <span className="ml-2 bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingReceivedCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={`px-6 py-3 rounded-t-lg transition-all ${
              activeTab === 'sent'
                ? 'bg-primary-500/20 border-b-2 border-primary-500 text-primary-500 font-semibold'
                : 'text-light-3 hover:bg-dark-4 hover:text-light-1'
            }`}
            onClick={() => setActiveTab('sent')}
          >
            <Send className="w-4 h-4 mr-2" />
            Sent
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            size="sm"
            onClick={() => setFilter('pending')}
            className={`transition-all ${
              filter === 'pending'
                ? 'bg-orange-600 hover:bg-orange-700 border-orange-600 text-white font-semibold'
                : 'bg-dark-3 hover:bg-dark-4 border-dark-4 text-light-2'
            }`}
          >
            Pending
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter('accepted')}
            className={`transition-all ${
              filter === 'accepted'
                ? 'bg-green-600 hover:bg-green-700 border-green-600 text-white font-semibold'
                : 'bg-dark-3 hover:bg-dark-4 border-dark-4 text-light-2'
            }`}
          >
            Accepted
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter('all')}
            className={`transition-all ${
              filter === 'all'
                ? 'bg-primary-500 hover:bg-primary-600 border-primary-500 text-white font-semibold'
                : 'bg-dark-3 hover:bg-dark-4 border-dark-4 text-light-2'
            }`}
          >
            All
          </Button>
        </div>

        {/* Requests List */}
        <div className="w-full max-w-5xl">
          {isLoading ? (
            <Loader />
          ) : requests && requests.length > 0 ? (
            <div className="flex flex-col gap-3">
              {requests.map((request: any) => (
                <VibeRequestCard
                  key={request._id}
                  request={request}
                  type={activeTab}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-light-3">
              <Users className="w-20 h-20 mb-4 opacity-50" />
              <p className="text-xl font-semibold mb-2">No vibe requests</p>
              <p className="text-sm text-center max-w-md">
                {activeTab === 'received'
                  ? "You don't have any vibe requests yet. When someone wants to vibe with you, they'll appear here."
                  : "You haven't sent any vibe requests yet. Start vibing with people you'd like to connect with!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vibes;
