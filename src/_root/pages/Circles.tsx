import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCircles, getMyCircles } from '@/lib/api/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CircleCard from '@/components/shared/CircleCard';
import { Loader } from '@/components/shared';

const Circles = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [circles, setCircles] = useState<any[]>([]);
  const [myCircles, setMyCircles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCircles();
  }, [activeTab]);

  const fetchCircles = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'all') {
        const data = await getCircles({ search: searchQuery });
        setCircles(data);
      } else {
        const data = await getMyCircles();
        setMyCircles(data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to fetch circles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCircles();
  };

  const displayCircles = activeTab === 'all' ? circles : myCircles;

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="flex-between w-full max-w-5xl mb-8">
          <div className="flex gap-3 items-center">
            <img
              src="/assets/icons/circle.svg"
              width={36}
              height={36}
              alt="circles"
            />
            <div>
              <h2 className="h3-bold md:h2-bold text-left">Peep Circles</h2>
              <p className="small-regular md:base-regular text-light-3">
                Temporary 24-hour communities
              </p>
            </div>
          </div>
          <Link to="/circles/create">
            <Button className="shad-button_primary">
              <img src="/assets/icons/add-post.svg" alt="add" width={20} height={20} className="invert-white" />
              <span className="hidden sm:inline ml-2">Create</span>
            </Button>
          </Link>
        </div>

        <div className="flex gap-3 w-full max-w-5xl mb-6">
          <Button
            className={`flex-1 ${activeTab === 'all' ? 'shad-button_primary' : 'shad-button_dark_4'}`}
            onClick={() => setActiveTab('all')}
          >
            All Circles
          </Button>
          <Button
            className={`flex-1 ${activeTab === 'my' ? 'shad-button_primary' : 'shad-button_dark_4'}`}
            onClick={() => setActiveTab('my')}
          >
            My Circles
          </Button>
        </div>

        {activeTab === 'all' && (
          <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-5xl mb-6">
            <div className="flex-1 relative">
              <img
                src="/assets/icons/search.svg"
                alt="search"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
              />
              <Input
                type="text"
                placeholder="Search circles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="explore-search pl-10"
              />
            </div>
            <Button type="submit" className="shad-button_primary">
              Search
            </Button>
          </form>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
                <div className="h-32 bg-dark-4 rounded-xl mb-4"></div>
                <div className="h-5 bg-dark-4 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-dark-4 rounded w-full mb-2"></div>
                <div className="h-4 bg-dark-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : displayCircles.length === 0 ? (
          <div className="flex-center flex-col gap-4 w-full h-full py-20">
            <p className="body-medium text-light-2">
              {activeTab === 'my' ? 'No circles yet' : 'No circles found'}
            </p>
            <p className="small-regular text-light-4 text-center">
              {activeTab === 'my'
                ? 'Join or create a circle to get started!'
                : 'Try a different search or create your own circle'}
            </p>
            {activeTab === 'my' && (
              <Link to="/circles/create" className="mt-4">
                <Button className="shad-button_primary">
                  Create Your First Circle
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <ul className="user-grid">
            {displayCircles.map((circle) => (
              <li key={circle._id}>
                <CircleCard circle={circle} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Circles;
