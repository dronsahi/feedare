import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';
import { Camera, Plus, X, Image, Trash2, Video, Play } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Media {
  id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string;
  photo_type: string;
  url?: string;
  isVideo?: boolean;
}

export default function Gallery() {
  const { user, loading: authLoading } = useAuth();
  const { selectedBaby, loading: babyLoading } = useBaby();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideoFile, setIsVideoFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedBaby) {
      fetchMedia();
    }
  }, [selectedBaby]);

  const fetchMedia = async () => {
    if (!selectedBaby) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('baby_id', selectedBaby.id)
        .order('taken_at', { ascending: false });

      if (error) throw error;

      // Get signed URLs for each media item
      const mediaWithUrls = await Promise.all(
        (data || []).map(async (item) => {
          const { data: urlData } = await supabase.storage
            .from('baby-photos')
            .createSignedUrl(item.storage_path, 3600);
          const isVideo = item.photo_type === 'video' || 
            item.storage_path.match(/\.(mp4|mov|webm|avi)$/i);
          return { ...item, url: urlData?.signedUrl, isVideo };
        })
      );

      setMedia(mediaWithUrls);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for videos, 5MB for images
      
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${isVideo ? '50MB' : '5MB'}`);
        return;
      }
      
      setSelectedFile(file);
      setIsVideoFile(isVideo);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedBaby || !selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${selectedBaby.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('baby-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase.from('photos').insert({
        baby_id: selectedBaby.id,
        storage_path: fileName,
        caption: caption || null,
        photo_type: isVideoFile ? 'video' : 'baby',
        taken_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      toast.success(`${isVideoFile ? 'Video' : 'Photo'} uploaded successfully!`);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setIsVideoFile(false);
      fetchMedia();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: Media) => {
    try {
      // Delete from storage
      await supabase.storage.from('baby-photos').remove([item.storage_path]);

      // Delete from database
      const { error } = await supabase.from('photos').delete().eq('id', item.id);

      if (error) throw error;

      toast.success(`${item.isVideo ? 'Video' : 'Photo'} deleted`);
      setSelectedMedia(null);
      fetchMedia();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (authLoading || babyLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Coral Header */}
      <header className="bg-coral safe-area-top h-12" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Photos & Videos</h1>
            <p className="text-muted-foreground">{selectedBaby?.name}'s memories</p>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-coral hover:bg-coral/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : media.length === 0 ? (
          <Card className="p-8 text-center">
            <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No photos or videos yet</h3>
            <p className="text-muted-foreground mb-4">
              Capture precious moments of {selectedBaby?.name}
            </p>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="bg-coral hover:bg-coral/90"
            >
              <Camera className="w-4 h-4 mr-2" />
              Upload First Memory
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className="aspect-square rounded-lg overflow-hidden bg-muted relative"
              >
                {item.isVideo ? (
                  <>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                  </>
                ) : item.url ? (
                  <img
                    src={item.url}
                    alt={item.caption || 'Baby photo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      <AdBanner />
      <BottomNav />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Photo or Video</DialogTitle>
            <DialogDescription>
              Upload a memory of {selectedBaby?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative">
                {isVideoFile ? (
                  <video
                    src={previewUrl}
                    className="w-full aspect-square object-cover rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setIsVideoFile(false);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-coral/50 transition-colors"
              >
                <div className="flex gap-2">
                  <Camera className="w-10 h-10 text-muted-foreground" />
                  <Video className="w-10 h-10 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">Tap to select photo or video</span>
                <span className="text-xs text-muted-foreground">Photos: 5MB max • Videos: 50MB max</span>
              </button>
            )}

            <div className="space-y-2">
              <Label>Caption (optional)</Label>
              <Input
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-coral hover:bg-coral/90"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media View Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {selectedMedia && (
            <>
              {selectedMedia.isVideo ? (
                <video
                  src={selectedMedia.url}
                  className="w-full max-h-[60vh] bg-black"
                  controls
                  autoPlay
                />
              ) : selectedMedia.url && (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || 'Baby photo'}
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
              )}
              <div className="p-4 space-y-2">
                {selectedMedia.caption && (
                  <p className="font-medium">{selectedMedia.caption}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedMedia.taken_at)}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedMedia)}
                  className="mt-2"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
