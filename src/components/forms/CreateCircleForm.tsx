import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from '@/components/shared';
import { createCircle } from '@/lib/api/api';

const EMOJI_OPTIONS = ['🔥', '🎨', '🎮', '🎵', '📚', '💪', '🌟', '🚀', '💡', '🎯', '🌈', '⚡'];
const COLOR_OPTIONS = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6', '#F97316',
];

const CreateCircleForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    description: '',
    icon: '🔥',
    color: '#8B5CF6',
    isPrivate: false,
    maxMembers: 50,
    duration: 24,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.topic) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in name and topic',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const circle = await createCircle(formData);
      
      toast({
        title: 'Circle created! 🎉',
        description: `${formData.name} is now live for ${formData.duration} hours`,
      });
      
      navigate(`/circles/${circle._id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to create circle',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-9 w-full max-w-5xl">
      <div className="flex flex-col gap-5">
        <label className="shad-form_label">Circle Name *</label>
        <Input
          type="text"
          placeholder="e.g., Late Night Coders"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="shad-input"
        />
      </div>

      <div className="flex flex-col gap-5">
        <label className="shad-form_label">Topic *</label>
        <Input
          type="text"
          placeholder="e.g., Programming, Gaming, Art"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className="shad-input"
        />
      </div>

      <div className="flex flex-col gap-5">
        <label className="shad-form_label">Description</label>
        <Textarea
          placeholder="What's this circle about?"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="shad-textarea custom-scrollbar"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-5">
        <label className="shad-form_label">Icon</label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`w-12 h-12 flex-center text-2xl rounded-lg border-2 transition-all ${
                formData.icon === emoji
                  ? 'border-primary-500 bg-dark-3'
                  : 'border-dark-4 bg-dark-4 hover:border-primary-500'
              }`}
              onClick={() => setFormData({ ...formData, icon: emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <label className="shad-form_label">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                formData.color === color
                  ? 'border-white ring-2 ring-white'
                  : 'border-transparent hover:border-white'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, color })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <label className="shad-form_label">Duration (hours)</label>
        <Input
          type="number"
          min="1"
          max="48"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          className="shad-input"
        />
        <p className="text-light-4 small-regular">Circle will auto-dissolve after this time</p>
      </div>

      <div className="flex flex-col gap-5">
        <label className="shad-form_label">Max Members</label>
        <Input
          type="number"
          min="2"
          max="200"
          value={formData.maxMembers}
          onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
          className="shad-input"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPrivate"
          checked={formData.isPrivate}
          onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
          className="w-5 h-5 cursor-pointer"
        />
        <label htmlFor="isPrivate" className="small-regular text-light-3 cursor-pointer">
          Make this circle private (members only can view posts)
        </label>
      </div>

      <div className="flex gap-4 items-center justify-end">
        <Button
          type="button"
          className="shad-button_dark_4"
          onClick={() => navigate(-1)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="shad-button_primary whitespace-nowrap"
          disabled={isLoading}
        >
          {isLoading && <Loader />}
          Create Circle
        </Button>
      </div>
    </form>
  );
};

export default CreateCircleForm;
