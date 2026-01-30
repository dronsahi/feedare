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
import { Camera, Plus, X, Image, Trash2, Video, Play, Check, Loader2, AlertCircle } from 'lucide-react';
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; statuses: ('pending' | 'uploading' | 'done' | 'failed')[] }>({ current: 0, total: 0, statuses: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds ${isVideo ? '50MB' : '5MB'} limit`);
        continue;
      }
      
      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const handleUpload = async () => {
    if (!selectedBaby || selectedFiles.length === 0 || !user) return;

    setUploading(true);
    const total = selectedFiles.length;
    const statuses: ('pending' | 'uploading' | 'done' | 'failed')[] = new Array(total).fill('pending');
    setUploadProgress({ current: 0, total, statuses });

    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Update status to uploading
        statuses[i] = 'uploading';
        setUploadProgress({ current: i + 1, total, statuses: [...statuses] });

        const isVideo = file.type.startsWith('video/');
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${selectedBaby.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('baby-photos')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          statuses[i] = 'failed';
          setUploadProgress({ current: i + 1, total, statuses: [...statuses] });
          failCount++;
          continue;
        }

        // Save to database
        const { error: dbError } = await supabase.from('photos').insert({
          baby_id: selectedBaby.id,
          storage_path: fileName,
          caption: caption || null,
          photo_type: isVideo ? 'video' : 'baby',
          taken_at: new Date().toISOString(),
        });

        if (dbError) {
          console.error('DB error:', dbError);
          statuses[i] = 'failed';
          setUploadProgress({ current: i + 1, total, statuses: [...statuses] });
          failCount++;
          continue;
        }

        statuses[i] = 'done';
        setUploadProgress({ current: i + 1, total, statuses: [...statuses] });
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully!`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} file${failCount > 1 ? 's' : ''} failed to upload`);
      }

      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setCaption('');
      setUploadProgress({ current: 0, total: 0, statuses: [] });
      fetchMedia();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
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
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Progress */}
            {uploading && uploadProgress.total > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Uploading...</span>
                  <span className="text-muted-foreground">{uploadProgress.current} of {uploadProgress.total}</span>
                </div>
                {/* Overall progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-coral transition-all duration-300"
                    style={{ width: `${(uploadProgress.statuses.filter(s => s === 'done' || s === 'failed').length / uploadProgress.total) * 100}%` }}
                  />
                </div>
                {/* Individual file statuses */}
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {previewUrls.map((url, index) => {
                    const file = selectedFiles[index];
                    const isVideo = file?.type.startsWith('video/');
                    const status = uploadProgress.statuses[index];
                    return (
                      <div key={index} className="relative aspect-square">
                        {isVideo ? (
                          <video
                            src={url}
                            className={`w-full h-full object-cover rounded-lg ${status === 'done' ? 'opacity-50' : ''}`}
                            muted
                          />
                        ) : (
                          <img
                            src={url}
                            alt="Preview"
                            className={`w-full h-full object-cover rounded-lg ${status === 'done' ? 'opacity-50' : ''}`}
                          />
                        )}
                        {/* Status overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${
                          status === 'uploading' ? 'bg-black/40' : 
                          status === 'done' ? 'bg-green-500/40' : 
                          status === 'failed' ? 'bg-red-500/40' : ''
                        }`}>
                          {status === 'uploading' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
                          {status === 'done' && <Check className="w-6 h-6 text-white" />}
                          {status === 'failed' && <AlertCircle className="w-6 h-6 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {previewUrls.length > 0 && !uploading ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {previewUrls.map((url, index) => {
                    const file = selectedFiles[index];
                    const isVideo = file?.type.startsWith('video/');
                    return (
                      <div key={index} className="relative aspect-square">
                        {isVideo ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover rounded-lg"
                            muted
                          />
                        ) : (
                          <img
                            src={url}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                        <button
                          onClick={() => removeSelectedFile(index)}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Play className="w-6 h-6 text-white" fill="white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-border rounded-lg hover:border-coral/50 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add more
                </button>
              </div>
            ) : !uploading && (
              <div className="space-y-3">
                {/* Camera capture options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-coral/50 hover:bg-coral/5 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-coral" />
                    <span className="text-sm font-medium">Take Photo</span>
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-coral/50 hover:bg-coral/5 transition-colors"
                  >
                    <Video className="w-8 h-8 text-coral" />
                    <span className="text-sm font-medium">Record Video</span>
                  </button>
                </div>
                
                {/* Gallery picker */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border rounded-lg hover:border-coral/50 hover:bg-coral/5 transition-colors"
                >
                  <Image className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Choose from Gallery</span>
                </button>
                <p className="text-xs text-center text-muted-foreground">Photos: 5MB max • Videos: 50MB max • Select multiple</p>
              </div>
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
              disabled={selectedFiles.length === 0 || uploading}
              className="bg-coral hover:bg-coral/90"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 1 ? `(${selectedFiles.length})` : ''}`}
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
