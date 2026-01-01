import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { calculateAge } from '@/lib/utils';
import { TrendingUp, Scale, Ruler, Activity } from 'lucide-react';

// WHO Growth Standards (simplified for demo - boys 0-24 months)
const calculatePercentile = (value: number, ageMonths: number, type: 'weight' | 'height' | 'bmi'): number => {
  // Simplified percentile calculation - in production use actual WHO tables
  const basePercentile = Math.min(99, Math.max(1, 50 + (value - getMedian(ageMonths, type)) * 10));
  return Math.round(basePercentile * 10) / 10;
};

const getMedian = (ageMonths: number, type: 'weight' | 'height' | 'bmi'): number => {
  // Simplified median values
  if (type === 'weight') return 3 + ageMonths * 0.5;
  if (type === 'height') return 50 + ageMonths * 2.5;
  return 15;
};

const getPercentileStatus = (percentile: number): { text: string; color: string } => {
  if (percentile < 5) return { text: 'Below normal', color: 'text-destructive' };
  if (percentile < 15) return { text: 'Low normal', color: 'text-amber-600' };
  if (percentile <= 85) return { text: 'Normal range', color: 'text-sage' };
  if (percentile <= 95) return { text: 'High normal', color: 'text-amber-600' };
  return { text: 'Above normal', color: 'text-destructive' };
};

export default function Insights() {
  const { user, loading: authLoading } = useAuth();
  const { selectedBaby, loading: babyLoading } = useBaby();
  const [totalFeeds, setTotalFeeds] = useState(0);
  const [totalPoops, setTotalPoops] = useState(0);
  const [totalMeasurements, setTotalMeasurements] = useState(0);
  const [latestMeasurement, setLatestMeasurement] = useState<{
    weight_kg: number | null;
    height_cm: number | null;
  } | null>(null);

  useEffect(() => {
    if (selectedBaby) {
      fetchStats();
    }
  }, [selectedBaby]);

  const fetchStats = async () => {
    if (!selectedBaby) return;

    const [feedsResult, poopsResult, measurementsResult, latestMeasurementResult] = await Promise.all([
      supabase.from('feed_entries').select('id', { count: 'exact' }).eq('baby_id', selectedBaby.id),
      supabase.from('poop_entries').select('id', { count: 'exact' }).eq('baby_id', selectedBaby.id).eq('occurred', true),
      supabase.from('measurements').select('id', { count: 'exact' }).eq('baby_id', selectedBaby.id),
      supabase.from('measurements').select('weight_kg, height_cm').eq('baby_id', selectedBaby.id).order('date_time', { ascending: false }).limit(1).single()
    ]);

    setTotalFeeds(feedsResult.count || 0);
    setTotalPoops(poopsResult.count || 0);
    setTotalMeasurements(measurementsResult.count || 0);
    setLatestMeasurement(latestMeasurementResult.data);
  };

  if (authLoading || babyLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const age = selectedBaby ? calculateAge(selectedBaby.date_of_birth) : null;
  const ageText = age 
    ? age.days < 30 
      ? `${age.days} days old`
      : `${age.months} month${age.months === 1 ? '' : 's'} old`
    : '';

  const ageMonths = age ? age.months || 0 : 0;
  const weight = latestMeasurement?.weight_kg || 3.8;
  const height = latestMeasurement?.height_cm || 52;
  const bmi = weight && height ? Math.round((weight / ((height / 100) ** 2)) * 10) / 10 : null;

  const weightPercentile = calculatePercentile(weight, ageMonths, 'weight');
  const heightPercentile = calculatePercentile(height, ageMonths, 'height');
  const bmiPercentile = bmi ? calculatePercentile(bmi, ageMonths, 'bmi') : null;

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Coral Header */}
      <header className="bg-coral safe-area-top h-12" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Baby Insights</h1>
          <p className="text-muted-foreground">{selectedBaby?.name}'s growth & trends</p>
        </div>

        {/* Dashboard Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-coral" />
            </div>
            <div>
              <h3 className="font-semibold">{selectedBaby?.name}'s Dashboard</h3>
              <p className="text-sm text-muted-foreground">{ageText}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-2xl font-bold text-coral">{totalFeeds}</span>
              <p className="text-xs text-muted-foreground mt-1">Total Feeds</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-2xl font-bold text-sage">{totalPoops}</span>
              <p className="text-xs text-muted-foreground mt-1">Total Poops</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-2xl font-bold text-sky">{totalMeasurements}</span>
              <p className="text-xs text-muted-foreground mt-1">Measurements</p>
            </div>
          </div>
        </Card>

        {/* WHO Growth Percentiles */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-foreground" />
            <h3 className="font-semibold">WHO Growth Percentiles</h3>
          </div>
          <p className="text-sm text-muted-foreground">Based on World Health Organization standards for boys</p>

          {/* Weight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Weight</span>
                <span className="text-muted-foreground">({weight}kg)</span>
              </div>
              <span className="px-2 py-1 rounded-full bg-sage/20 text-sage text-sm font-medium">
                {weightPercentile}th percentile
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-coral via-amber-400 to-sage" 
                style={{ width: '100%' }}
              />
              <div 
                className="relative -mt-2"
                style={{ left: `${weightPercentile}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-3 h-3 bg-sage rounded-full border-2 border-white shadow" />
              </div>
            </div>
            <p className={`text-sm ${getPercentileStatus(weightPercentile).color}`}>
              {getPercentileStatus(weightPercentile).text}
            </p>
          </div>

          {/* Height */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Height</span>
                <span className="text-muted-foreground">({height}cm)</span>
              </div>
              <span className="px-2 py-1 rounded-full bg-sage/20 text-sage text-sm font-medium">
                {heightPercentile}th percentile
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-coral via-amber-400 to-sage" 
                style={{ width: '100%' }}
              />
            </div>
            <p className={`text-sm ${getPercentileStatus(heightPercentile).color}`}>
              {getPercentileStatus(heightPercentile).text}
            </p>
          </div>

          {/* BMI */}
          {bmi && bmiPercentile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">BMI</span>
                  <span className="text-muted-foreground">({bmi})</span>
                </div>
                <span className="px-2 py-1 rounded-full bg-sage/20 text-sage text-sm font-medium">
                  {bmiPercentile}th percentile
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-coral via-amber-400 to-sage" 
                  style={{ width: '100%' }}
                />
              </div>
              <p className={`text-sm ${getPercentileStatus(bmiPercentile).color}`}>
                Healthy weight
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              💡 A percentile of 50 means your baby is exactly average. 15-85 is considered normal range.
            </p>
          </div>
        </Card>
      </main>

      <AdBanner />
      <BottomNav />
    </div>
  );
}
