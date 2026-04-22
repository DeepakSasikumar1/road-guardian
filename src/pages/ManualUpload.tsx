import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { YOLOv8Detector, Detection } from '@/lib/yolo-v8';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, MapPin, Scan, Save, Loader2, Image as ImageIcon, AlertCircle, Activity, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManualUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [modelType, setModelType] = useState('pt');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  
  const detector = useMemo(() => new YOLOv8Detector(['pothole', 'crack', 'water_hazard', 'debris']), []);
  const previewRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [scanResult, setScanResult] = useState<{
    type: string;
    severity: string;
    confidence: number;
    bbox: { x: number; y: number; w: number; h: number };
  } | null>(null);

  // Load model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        // Added a cache-busting timestamp because the browser had cached the corrupt model
        await detector.load(`/models/RODS_best.onnx?v=${Date.now()}`);
        console.log('Road Monitoring AI ready.');
      } catch (err) {
        console.warn('Could not load real AI model, will fallback to high-quality simulation if file missing.');
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, [detector]);
  
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [location, setLocation] = useState<{ lat: string; lng: string; address: string; area: string }>({
    lat: '',
    lng: '',
    address: '',
    area: ''
  });
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize interactive map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center (Salem or generic startup coordinate)
    const initialCenter: [number, number] = [11.6643, 78.1460];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker(initialCenter, { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    // Map click sets marker and triggers geocode
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      fetchGeocode(e.latlng.lat, e.latlng.lng);
    });

    // Marker drag updates location and triggers geocode
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      fetchGeocode(pos.lat, pos.lng);
    });

    const fetchGeocode = async (lat: number, lng: number) => {
      setLocation(prev => ({ ...prev, lat: lat.toFixed(7), lng: lng.toFixed(7) }));
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || 'Unknown';
          const landmarkParts = [];
          if (addr.amenity) landmarkParts.push(addr.amenity);
          if (addr.building) landmarkParts.push(addr.building);
          if (addr.road) landmarkParts.push(addr.road);
          const specificLandmark = landmarkParts.length > 0 ? landmarkParts.join(', ') : data.display_name.split(',')[0];
          setLocation(prev => ({ ...prev, area, address: specificLandmark, lat: lat.toFixed(7), lng: lng.toFixed(7) }));
        }
      } catch (err) {
        console.warn('Geocode fail', err);
      }
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync map center to location updates (from Auto Detect)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && location.lat && location.lng) {
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1 });
      }
    }
  }, [location.lat, location.lng]);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type.startsWith('video') ? 'video' : 'image');
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setScanResult(null);
      setProcessedFile(null);
    }
  };

  const handleDetectLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        title: 'Hardware Offline',
        description: 'GPS sensors not detected or geolocation disabled by OS/Browser.',
        variant: 'destructive',
      });
      return;
    }

    // Check for secure context (required for geolocation in most browsers)
    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      toast({
        title: 'Insecure Context',
        description: 'Geolocation requires a secure connection (HTTPS). Please ensure you are on a secure network.',
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingLocation(true);
    setGpsAccuracy(null);
    
    // Use a clearer and more robust geolocation request
    const options = { 
      enableHighAccuracy: true, 
      timeout: 20000, // Increased to 20s for better satellite lock
      maximumAge: 0 
    };

    const successCallback = async (position: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      console.log(`GPS Captured: ${lat}, ${lng} (Confidence: ±${accuracy}m)`);
      setGpsAccuracy(accuracy);
      
      // If accuracy is very poor, warn the user but still set the location
      if (accuracy > 150) {
        toast({
          title: 'Low Accuracy Detected',
          description: `Location centered but might be off by ${Math.round(accuracy)}m. Please verify on map.`,
          variant: 'default'
        });
      }
      
      try {
        // Attempt reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        
        if (!response.ok) throw new Error('Geocoding service unavailable');
        
        const data = await response.json();
        
        if (data && data.address) {
          const addr = data.address;
          const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.county || 'Detected Area';
          
          const landmarkParts = [];
          if (addr.amenity) landmarkParts.push(addr.amenity);
          if (addr.building) landmarkParts.push(addr.building);
          if (addr.road) landmarkParts.push(addr.road);
          
          const specificLandmark = landmarkParts.length > 0 ? landmarkParts.join(', ') : (data.display_name ? data.display_name.split(',')[0] : 'Unknown Landmark');

          setLocation({
            lat: lat.toFixed(7),
            lng: lng.toFixed(7),
            address: specificLandmark,
            area: area
          });

          toast({
            title: 'GPS Signal Locked',
            description: `Location: ${specificLandmark} (±${accuracy.toFixed(1)}m)`,
          });
        } else {
          throw new Error('No address found');
        }
      } catch (error) {
        console.warn('Geocoding error or no address found:', error);
        // Fallback to raw coordinates if geocoding fails
        setLocation((prev) => ({
          ...prev,
          lat: lat.toFixed(7),
          lng: lng.toFixed(7),
        }));
        toast({
          title: 'Coordinates Locked',
          description: `Using raw GPS data: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        });
      } finally {
        setIsDetectingLocation(false);
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.warn('Geolocation error:', error.message, 'Code:', error.code);
      
      // If high accuracy failed (common on desktops), try one more time without it
      if (options.enableHighAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
        console.log('Retrying geolocation without high accuracy...');
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (secondError) => {
            setIsDetectingLocation(false);
            handleGeoError(secondError);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );
      } else {
        setIsDetectingLocation(false);
        handleGeoError(error);
      }
    };

    const handleGeoError = (error: GeolocationPositionError) => {
      let errorMsg = 'Failed to acquire satellite lock.';
      if (error.code === 1) errorMsg = 'Location access denied. Please enable GPS in your browser settings.';
      if (error.code === 2) errorMsg = 'Position unavailable. Check your internet/GPS signal.';
      if (error.code === 3) errorMsg = 'Detection timed out. Try again or move to an open area.';

      toast({
        title: 'Satellite Error',
        description: errorMsg,
        variant: 'destructive',
      });
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  const handleAddressSearch = async () => {
    if (!addressSearchQuery.trim()) return;
    setIsSearchingAddress(true);
    setShowDropdown(true);
    setSearchResults([]);
    
    try {
      // Switched to Photon API for superior fuzzy matching, typo tolerance, and autocomplete capabilities
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(addressSearchQuery)}&limit=7`);
      const data = await res.json();
      
      if (data && data.features && data.features.length > 0) {
        // Map GeoJSON feature to our existing format
        const formattedResults = data.features.map((feature: any) => {
          const props = feature.properties;
          const [lon, lat] = feature.geometry.coordinates;
          const nameParts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean);
          // Deduplicate name parts safely (some places return "New York, New York")
          const uniqueParts = Array.from(new Set(nameParts));
          
          return {
            display_name: uniqueParts.join(', '),
            lat: lat.toString(),
            lon: lon.toString()
          };
        });
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      toast({ title: 'Search Failed', description: 'Could not connect to map service.', variant: 'destructive' });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectSearchResult = async (result: any) => {
    setShowDropdown(false);
    setAddressSearchQuery(result.display_name.split(',')[0]); // Put a short name in the box
    
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.flyTo([newLat, newLng], 15, { animate: true, duration: 1.5 });
    }
    
    // Trigger reverse geocode for proper formatting
    try {
      const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`);
      const revData = await revRes.json();
      
      if (revData && revData.address) {
        const addr = revData.address;
        const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.county || 'Search Selection';
        const landmarkParts = [];
        if (addr.amenity) landmarkParts.push(addr.amenity);
        if (addr.building) landmarkParts.push(addr.building);
        if (addr.road) landmarkParts.push(addr.road);
        
        const specificLandmark = landmarkParts.length > 0 ? landmarkParts.join(', ') : (revData.display_name ? revData.display_name.split(',')[0] : 'Unknown Landmark');
        
        setLocation({
          lat: newLat.toFixed(7),
          lng: newLng.toFixed(7),
          address: specificLandmark,
          area: area
        });
        toast({ title: 'Location Updated', description: specificLandmark });
      }
    } catch(err) {
       setLocation({
          lat: newLat.toFixed(7),
          lng: newLng.toFixed(7),
          address: result.display_name.split(',')[0],
          area: 'Map Selection'
       });
       toast({ title: 'Location Updated', description: 'Using selected coordinates.' });
    }
  };

  const handleScan = async () => {
    const sourceElement = fileType === 'image' ? previewRef.current : videoRef.current;
    if (!file || !sourceElement) return;

    if (isModelLoading) {
      toast({ title: "Please Wait", description: "AI Model is still initializing..." });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      console.log("Starting Real AI Inference...");
      const detections = await detector.detect(sourceElement);

      if (detections && detections.length > 0) {
        // Take the detection with highest confidence
        const best = detections[0];
        
        // Calculate percentages for responsive bounding box
        const width = sourceElement instanceof HTMLImageElement ? sourceElement.naturalWidth : sourceElement.videoWidth;
        const height = sourceElement instanceof HTMLImageElement ? sourceElement.naturalHeight : sourceElement.videoHeight;

        const x = (best.bbox[0] / width) * 100;
        const y = (best.bbox[1] / height) * 100;
        const w = ((best.bbox[2] - best.bbox[0]) / width) * 100;
        const h = ((best.bbox[3] - best.bbox[1]) / height) * 100;

        setScanResult({
          type: best.className,
          severity: best.confidence > 0.8 ? 'high' : best.confidence > 0.6 ? 'medium' : 'low',
          confidence: best.confidence,
          bbox: { x, y, w, h }
        });

        toast({
          title: 'AI Analysis Successful',
          description: `YOLOv8 detected a ${best.className} with ${(best.confidence * 100).toFixed(1)}% confidence.`,
        });

        // Burn the detections into a new image for database storage so they are visible everywhere
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(sourceElement, 0, 0, width, height);
          
          detections.forEach(det => {
            const [x1, y1, x2, y2] = det.bbox;
            const detSeverity = det.confidence > 0.8 ? '#ef4444' : det.confidence > 0.6 ? '#f97316' : '#3b82f6';
            
            ctx.strokeStyle = detSeverity;
            ctx.lineWidth = Math.max(4, width / 200);
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          });
          
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], `ai_annotated_${file.name.replace(/\.[^/.]+$/, "")}.jpg`, { type: 'image/jpeg' });
              setProcessedFile(newFile);
              setPreview(URL.createObjectURL(newFile)); // Switch preview to show the burned image immediately
            }
          }, 'image/jpeg', 0.95);
        }

      } else {
        toast({
          title: 'No Hazards Detected',
          description: 'The AI model scanned the media but did not find any clear hazards with current confidence thresholds.',
        });
      }
    } catch (err: any) {
      console.error('AI Inference Error:', err);
      toast({
        title: 'AI Architecture Error',
        description: `Model output error: ${err.message}. Check browser console (F12) for tensor details.`,
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!scanResult || !file) return;
    
    setIsSaving(true);
    console.group("🚀 Hazard Reporting Diagnostic");
    try {
      let finalImageUrl = null;

      // 1. Storage Upload
      const fileToUpload = processedFile || file;
      const fileName = `${crypto.randomUUID()}.${fileToUpload.name.split('.').pop() || 'jpg'}`;
      const filePath = `obstacles/${fileName}`;

      console.log("📤 Uploading media to storage...");
      const { error: uploadError } = await supabase.storage.from('obstacle-images').upload(filePath, fileToUpload);

      if (uploadError) {
        console.warn('⚠️ Storage upload failed (continuing without image):', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('obstacle-images').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
        console.log("✅ Image URL generated:", finalImageUrl);
      }

      // 2. Obstacle Insertion
      const obstaclePayload = {
        obstacle_id: `RODS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        type: scanResult.type,
        severity: scanResult.severity,
        lat: parseFloat(location.lat) || 0,
        lng: parseFloat(location.lng) || 0,
        address: location.address || 'Manual Location',
        area: location.area || 'Unknown Area',
        status: 'reported',
        detected_at: new Date().toISOString(),
        is_false_detection: false,
        image_url: finalImageUrl 
      };

      console.log("📝 Inserting Obstacle Record:", obstaclePayload);
      const { data: insertedData, error: obstacleError } = await supabase
        .from('obstacles')
        .insert([obstaclePayload as any])
        .select()
        .single();
      
      if (obstacleError) {
        console.error("❌ Database Obstacle Insert Error:", obstacleError);
        throw new Error(`Database Error (Obstacles): ${obstacleError.message} (Code: ${obstacleError.code})`);
      }
      console.log("✅ Obstacle Linked with UUID:", insertedData.id);

      // 3. Dispatch Network Alert (Server-Side Logging & Messaging)
      console.log("📡 Dispatching Edge Function Network Alert...");
      try {
        const { error: invokeError } = await supabase.functions.invoke('send-alert', {
          body: {
            obstacleId: insertedData.obstacle_id, // 👈 KEY FIX: Switch to TEXT ID (RODS-XXX) to match DB
            obstacleType: insertedData.type,
            severity: insertedData.severity,
            location: {
              lat: insertedData.lat,
              lng: insertedData.lng,
              address: insertedData.address,
              area: insertedData.area,
            },
            detectedAt: insertedData.detected_at,
          },
        });
        if (invokeError) throw invokeError;
        
        console.log("✅ Network Alert sequence initiated.");
      } catch (efError: any) {
        console.warn('⚠️ Network Alert dispatch failed:', efError);
        
        // Fallback: If edge function fails (e.g., missing API keys or testing locally), 
        // we MUST still insert the alert into the database so the UI Dashboard updates!
        try {
          console.log("🔄 Running Edge Function fallback: inserting alert directly to DB...");
          const fallbackMessage = `🚨 ${insertedData.severity.toUpperCase()} SEVERITY: ${insertedData.type.replace('_', ' ').toUpperCase()} detected at ${insertedData.area}`;
          await supabase.from('alerts').insert({
            alert_id: `ALERT-${Date.now().toString(36).toUpperCase()}`,
            obstacle_id: insertedData.obstacle_id,
            type: insertedData.severity === 'high' ? 'high_severity' : 'new_detection',
            message: fallbackMessage,
            status: 'sent',
            email_sent: false,
            sms_sent: false
          });
          console.log("✅ Fallback Alert successfully logged directly to database.");
        } catch (fallbackErr) {
          console.error("❌ Critical failure during fallback alert creation:", fallbackErr);
        }
      }

      toast({
        title: 'Transmission Success',
        description: 'Hazard report synchronized. Alerts are being processed.',
      });
      
      // Cleanup & Redirect
      setFile(null);
      setPreview(null);
      setScanResult(null);
      setLocation({ lat: '', lng: '', address: '', area: '' });
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('🛑 MISSION CRITICAL FAILURE:', err);
      toast({
        title: 'Command Failed',
        description: `${err.message || 'System error detected.'}. Check browser console (F12) for technical details.`,
        variant: 'destructive',
      });
    } finally {
      console.groupEnd();
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/50">
      <Header
        title="AI Hazard Reporting"
        subtitle="Hybrid system combining automated YOLO detection with manual user reports."
      />

      <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Preview Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="lg:col-span-2 h-full"
        >
        <Card className="flex flex-col h-full border-border/40 bg-card/40 backdrop-blur-md shadow-2xl transition-all hover:border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <Upload className="w-5 h-5 text-primary" />
                  Media Analysis
                </CardTitle>
                <CardDescription>Upload road images or videos for real-time processing</CardDescription>
              </div>
              {preview && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setScanResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}>
                  Change File
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-[450px]">
            <div className="relative flex-1 border-2 border-dashed border-primary/20 rounded-2xl overflow-hidden bg-secondary/10 group transition-all hover:border-primary/40 flex items-center justify-center">
              {preview ? (
                <>
                  {fileType === 'image' ? (
                    <img ref={previewRef} src={preview} alt="Upload preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <video ref={videoRef} src={preview} className="max-w-full max-h-full object-contain" controls />
                  )}
                  
                  {/* AI Scan Line Animation */}
                  <AnimatePresence>
                  {isScanning && (
                    <motion.div 
                      className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div 
                        className="w-full h-1.5 bg-primary shadow-[0_0_25px_rgba(59,130,246,1)] absolute"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
                        style={{ filter: 'drop-shadow(0 0 10px var(--primary))' }}
                      />
                      <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px]" />
                    </motion.div>
                  )}
                  </AnimatePresence>
                </>
              ) : (
                <div 
                  className="text-center p-12 cursor-pointer w-full h-full flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner shadow-primary/20"
                  >
                    <Upload className="w-10 h-10 text-primary drop-shadow-md" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">Drop road media here</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Select an image or video from your device to start AI detection pipeline
                  </p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0 flex gap-3">
            <Button 
              className="flex-1 h-12 text-md font-semibold shadow-lg shadow-primary/20" 
              onClick={handleScan} 
              disabled={!preview || isScanning || !!scanResult}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" /> 
                  Running YOLO Model...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5 mr-3" /> 
                  Analyze Road Condition
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        </motion.div>

        {/* Location & Details Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex flex-col h-full"
        >
        <Card className="flex flex-col h-full border-border/40 bg-card/30 backdrop-blur-md shadow-2xl transition-all hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              Location Context
            </CardTitle>
            <CardDescription>Tag the hazard with precise geographic data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Pinpoint Exact Coordinates</Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Desktop GPS might be inaccurate. Try searching below.</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleDetectLocation} 
                  disabled={isDetectingLocation}
                  className="h-8 transition-all hover:bg-primary hover:text-white"
                >
                  {isDetectingLocation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isDetectingLocation ? 'Detecting...' : 'Auto-Locate GPS'}
                </Button>
              </div>

              {/* Location Search Box */}
              <div className="relative z-[1000] mb-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      className="bg-card/50 border-border/50 h-10 w-full rounded-lg pl-9"
                      placeholder="Type city, street, or landmark..."
                      value={addressSearchQuery}
                      onChange={(e) => {
                        setAddressSearchQuery(e.target.value);
                        if (showDropdown) setShowDropdown(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddressSearch();
                        }
                      }}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-10 border-primary/20 hover:bg-primary/10"
                    onClick={handleAddressSearch}
                    disabled={isSearchingAddress}
                  >
                    {isSearchingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                  </Button>
                </div>
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[1001]"
                    >
                      {searchResults.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                          {searchResults.map((result, idx) => (
                            <li 
                              key={idx}
                              onClick={() => selectSearchResult(result)}
                              className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border/40 last:border-0 flex flex-col gap-1"
                            >
                              <span className="font-medium text-sm line-clamp-1">{result.display_name.split(',')[0]}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1 opacity-80">{result.display_name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm font-medium">No strict matches found</p>
                          <p className="text-xs text-muted-foreground mt-1">Try typing just your City or Town name, then drop the pin exactly where you need it securely on the map.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Interactive Map Replaces Raw Inputs */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                ref={mapContainerRef} 
                className="w-full h-56 rounded-xl border-2 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)] z-[10] overflow-hidden cursor-crosshair"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-medium text-muted-foreground px-1">
                <span>Drag the red pin directly onto the hazard's true location.</span>
                <span className="font-mono mt-2 sm:mt-0 bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                  {location.lat && location.lng ? (
                    <>
                      {gpsAccuracy && <span className="mr-3 opacity-80">Accuracy: ±{Math.round(gpsAccuracy)}m</span>}
                      Lat: {location.lat}, Lng: {location.lng}
                    </>
                  ) : 'Coordinates Unknown'}
                </span>
              </div>
            </div>

            <div className="space-y-4 relative">
              {isDetectingLocation && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl border border-primary/30"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full font-semibold shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                    <Loader2 className="w-4 h-4 animate-spin" /> Cross-referencing Satellite Data...
                  </div>
                </motion.div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Area Name</Label>
                <div className="relative">
                  <Input 
                    placeholder="e.g. West Coast Highway" 
                    value={location.area}
                    className="bg-background/50 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                    onChange={(e) => setLocation({...location, area: e.target.value})}
                  />
                  {location.area && !isDetectingLocation && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3.5 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Specific Landmark</Label>
                <div className="relative">
                  <Input 
                    placeholder="e.g. Near Bridge Intersection" 
                    value={location.address}
                    className="bg-background/50 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                    onChange={(e) => setLocation({...location, address: e.target.value})}
                  />
                  {location.address && !isDetectingLocation && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3.5 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  )}
                </div>
              </div>
            </div>

            <AnimatePresence>
            {scanResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', bounce: 0.3 }}
                className="relative overflow-hidden bg-gradient-to-br from-primary/15 to-secondary/10 rounded-2xl border border-primary/20 p-5 mt-6 shadow-[0_0_30px_rgba(var(--primary),0.15)]"
              >
                <div className="flex items-center gap-2 mb-5">
                  <motion.div 
                    animate={{ rotate: [0, 180, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="p-1.5 rounded-lg bg-primary/20"
                  >
                    <Activity className="w-4 h-4 text-primary" />
                  </motion.div>
                  <span className="text-sm font-bold uppercase tracking-widest text-primary">Detection Diagnostics</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Detected Object</span>
                    <span className="font-bold capitalize">{scanResult.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Severity Level</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      scanResult.severity === 'high' ? 'bg-red-500/20 text-red-500' :
                      scanResult.severity === 'medium' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {scanResult.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${scanResult.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-mono font-medium">{(scanResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="pt-6 border-t border-border/10 pb-6">
            <Button 
              className="w-full h-14 text-md font-bold uppercase tracking-wide rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]" 
              onClick={handleSave}
              disabled={!scanResult || isSaving || !location.lat || !location.lng}
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Syncing with Server...</>
              ) : (
                <><Save className="w-5 h-5 mr-3" /> Report</>
              )}
            </Button>
          </CardFooter>
        </Card>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
      `}} />
    </div>
  );
}
