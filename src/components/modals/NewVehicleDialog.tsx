
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VinDecoder from '@/components/VinDecoder';
import VinScannerDialog from './VinScannerDialog';
import { useToast } from '@/hooks/use-toast';
import { decodeVin } from '@/ai/flows/decode-vin';
import type { DecodeVinOutput } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScanBarcode } from 'lucide-react';

interface NewVehicleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vehicle: Partial<Vehicle>) => void;
  initialData?: Partial<Vehicle>;
}

const vehicleData = {
    "Acura": ["ILX", "Integra", "MDX", "NSX", "RDX", "RLX", "TLX", "ZDX"],
    "Airbus": [],
    "Alfa Romeo": ["4C", "Giulia", "Stelvio", "Tonale"],
    "Alfa Romeo/Chrysler": [],
    "AM GENERAL": ["Hummer"],
    "AMERICAN COACH": [],
    "American Motors": ["AMX", "Concord", "Eagle", "Gremlin", "Hornet", "Javelin", "Matador", "Pacer"],
    "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "e-tron GT", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "R8", "RS 3", "RS 5", "RS 6 Avant", "RS 7", "RS Q8", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "TT"],
    "Austin": ["Healey"],
    "Autocar": [],
    "Avanti": [],
    "BAIC": [],
    "Bering": [],
    "Bluebird": [],
    "BMW": ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "i3", "i4", "i7", "i8", "iX", "M2", "M3", "M4", "M5", "M8", "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "Z4"],
    "Bounder": [],
    "Boyertown": [],
    "Bricklin": [],
    "BrightDrop": ["EV600", "EV410"],
    "Brockway": [],
    "Buick": ["Cascada", "Century", "Enclave", "Encore", "Encore GX", "Envision", "Envista", "LaCrosse", "LeSabre", "Lucerne", "Park Avenue", "Rainier", "Regal", "Rendezvous", "Riviera", "Roadmaster", "Skylark", "Terraza", "Verano"],
    "BYD": [],
    "Cadillac": ["ATS", "BLS", "Brougham", "Catera", "Celestiq", "CT4", "CT5", "CT6", "CTS", "DeVille", "DTS", "Eldorado", "Escalade", "Escalade ESV", "Fleetwood", "Lyriq", "Seville", "SRX", "STS", "XLR", "XT4", "XT5", "XT6"],
    "Changan": [],
    "Checker": [],
    "Chevrolet": ["1500", "2500", "3500", "Astro", "Avalanche", "Aveo", "Beretta", "Blazer", "Bolt EUV", "Bolt EV", "Camaro", "Caprice", "Captiva Sport", "Cavalier", "Celebrity", "Chevelle", "Chevy Van", "Citation", "City Express", "Cobalt", "Colorado", "Corsica", "Corvette", "Cruze", "El Camino", "Equinox", "Express", "G-Series", "HHR", "Impala", "Kodiak", "Lumina", "LUV", "Malibu", "Metro", "Monte Carlo", "Nova", "Prizm", "S-10", "Silverado", "Sonic", "Spark", "Spectrum", "Sprint", "SS", "SSR", "Suburban", "Tahoe", "Tracker", "Trailblazer", "Traverse", "Trax", "Uplander", "Vega", "Venture", "Volt"],
    "Chirey": [],
    "Chrysler": ["200", "300", "300M", "Aspen", "Cirrus", "Concorde", "Crossfire", "Fifth Avenue", "Grand Voyager", "Imperial", "LeBaron", "LHS", "New Yorker", "Pacifica", "Prowler", "PT Cruiser", "Sebring", "Town & Country", "Voyager"],
    "Columbus": [],
    "Cordura": [],
    "Cupra": [],
    "Daewoo": ["Lanos", "Leganza", "Nubira"],
    "Daihatsu": ["Charade", "Rocky"],
    "Datsun": ["200SX", "210", "280ZX", "310", "510", "720", "810", "B210", "F10"],
    "DeLorean": ["DMC-12"],
    "Diamond Reo": [],
    "Dodge": ["Avenger", "Caliber", "Caravan", "Challenger", "Charger", "Colt", "Dakota", "Dart", "Daytona", "Diplomat", "Durango", "Dynasty", "Grand Caravan", "Hornet", "Intrepid", "Journey", "Magnum", "Monaco", "Neon", "Nitro", "Omni", "Ram 50", "Ram Van", "Ram Wagon", "Ramcharger", "Rampage", "Shadow", "Spirit", "Sprinter", "SRT-4", "Stealth", "Stratus", "Viper"],
    "Eagle": ["Premier", "Summit", "Talon", "Vision"],
    "Edsel": [],
    "FAW": [],
    "Fiat": ["124 Spider", "500", "500L", "500X"],
    "Fiat/Chrysler": [],
    "Fisker": ["Karma", "Ocean"],
    "FISKER": ["Ocean"],
    "Flyer Bus": [],
    "Ford": ["Aerostar", "Aspire", "Bronco", "Bronco II", "C-Max", "Contour", "Courier", "Crown Victoria", "E-Series", "EcoSport", "Edge", "Escape", "Escort", "Excursion", "Expedition", "Explorer", "F-100", "F-150", "F-250", "F-350", "F-450", "Fairmont", "Festiva", "Fiesta", "Five Hundred", "Flex", "Focus", "Freestar", "Freestyle", "Fusion", "Granada", "GT", "LTD", "Maverick", "Mustang", "Mustang Mach-E", "Probe", "Ranger", "Taurus", "Taurus X", "Tempo", "Thunderbird", "Transit", "Windstar"],
    "Foton": [],
    "Freightliner": ["Sprinter"],
    "FWD": [],
    "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
    "Geo": ["Metro", "Prizm", "Spectrum", "Storm", "Tracker"],
    "GMC": ["Acadia", "Canyon", "Envoy", "Graphyte", "Hummer EV", "Jimmy", "Safari", "Savana", "Sierra", "Sonoma", "Suburban", "Syclone", "Terrain", "TopKick", "Typhoon", "Vandura", "Yukon", "Yukon XL"],
    "GMC Truck": [],
    "Grumman Olson": [],
    "HIGER": [],
    "Hino": [],
    "Holiday Rambler": [],
    "Honda": ["Accord", "Civic", "Clarity", "CR-V", "CR-Z", "Crosstour", "CRX", "Del Sol", "Element", "Fit", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Prelude", "Prologue", "Ridgeline", "S2000"],
    "Hummer": ["H1", "H2", "H3"],
    "Hyundai": ["Accent", "Azera", "Elantra", "Entourage", "Equus", "Excel", "Genesis", "Genesis Coupe", "Ioniq 5", "Ioniq 6", "Kona", "Nexo", "Palisade", "Santa Cruz", "Santa Fe", "Scoupe", "Sonata", "Tiburon", "Tucson", "Veloster", "Venue", "Veracruz", "XG300", "XG350"],
    "IC Bus": [],
    "Ineos": ["Grenadier"],
    "Infiniti": ["EX", "FX", "G", "I30", "I35", "J30", "M", "Q40", "Q45", "Q50", "Q60", "Q70", "QX30", "QX4", "QX50", "QX55", "QX60", "QX70", "QX80"],
    "International": [],
    "Isuzu": ["Amigo", "Ascender", "Axiom", "Hombre", "i-Series", "Impulse", "Oasis", "Rodeo", "Stylus", "Trooper", "VehiCROSS"],
    "Iveco": [],
    "JAC": [],
    "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "Super V8", "Vanden Plas", "X-Type", "XE", "XF", "XJ", "XJ6", "XJ8", "XJ12", "XJR", "XJS", "XK", "XK8", "XKR"],
    "Jeep": ["Cherokee", "Comanche", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Grand Wagoneer", "Liberty", "Patriot", "Renegade", "Wagoneer", "Wrangler"],
    "Kenworth": [],
    "Kia": ["Amanti", "Besta", "Borrego", "Cadenza", "Carnival", "EV6", "EV9", "Forte", "K5", "K900", "Niro", "Optima", "Rio", "Rondo", "Sedona", "Seltos", "Sephia", "Sorento", "Soul", "Spectra", "Sportage", "Stinger", "Telluride"],
    "Lancia": [],
    "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "LR2", "LR3", "LR4", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
    "Lexus": ["CT", "ES", "GS", "GX", "HS", "IS", "LC", "LFA", "LM", "LS", "LX", "NX", "RC", "RX", "RZ", "SC", "TX", "UX"],
    "Lincoln": ["Aviator", "Blackwood", "Continental", "Corsair", "LS", "Mark LT", "Mark VII", "Mark VIII", "MKC", "MKS", "MKT", "MKX", "MKZ", "Nautilus", "Navigator", "Town Car", "Zephyr"],
    "Lucid": ["Air"],
    "Mack": [],
    "Magirus": [],
    "MAN": [],
    "MASA": [],
    "Maserati": ["Ghibli", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"],
    "MASTER ROAD": [],
    "Mazda": ["3", "5", "6", "626", "929", "B-Series", "CX-3", "CX-30", "CX-5", "CX-50", "CX-7", "CX-70", "CX-9", "CX-90", "GLC", "Miata", "Millenia", "MPV", "MX-3", "MX-5", "MX-6", "MX-30", "Navajo", "Protege", "RX-7", "RX-8", "Tribute"],
    "MCI": [],
    "Mercedes Benz": ["190", "A-Class", "AMG GT", "B-Class", "C-Class", "CL-Class", "CLA-Class", "CLK-Class", "CLS-Class", "E-Class", "EQB", "EQE", "EQS", "G-Class", "GL-Class", "GLA-Class", "GLB-Class", "GLC-Class", "GLE-Class", "GLK-Class", "GLS-Class", "M-Class", "Metris", "R-Class", "S-Class", "SL-Class", "SLC-Class", "SLK-Class", "SLR McLaren", "SLS AMG", "Sprinter"],
    "Mercury": ["Capri", "Cougar", "Grand Marquis", "Lynx", "Marauder", "Mariner", "Marquis", "Milan", "Montego", "Monterey", "Mountaineer", "Mystique", "Sable", "Topaz", "Tracer", "Villager"],
    "Merkur": ["Scorpio", "XR4Ti"],
    "MG": [],
    "Mini": ["Clubman", "Convertible", "Countryman", "Hardtop", "Paceman"],
    "Mitsubishi": ["3000GT", "Cordia", "Diamante", "Eclipse", "Eclipse Cross", "Endeavor", "Expo", "Galant", "i-MiEV", "Lancer", "Mighty Max", "Mirage", "Montero", "Montero Sport", "Outlander", "Outlander Sport", "Precis", "Raider", "Sigma", "Starion", "Tredia", "Van"],
    "Morgan Olson": [],
    "NABI": [],
    "National Coach": [],
    "Navistar": [],
    "Nissan": ["200SX", "240SX", "300ZX", "350Z", "370Z", "Altima", "Ariya", "Armada", "Axxess", "Cube", "Frontier", "GT-R", "Juke", "Kicks", "Leaf", "Maxima", "Murano", "NV", "NX", "Pathfinder", "Pickup", "Pulsar", "Quest", "Rogue", "Sentra", "Stanza", "Titan", "Van", "Versa", "Xterra"],
    "OISA": [],
    "Oldsmobile": ["Achieva", "Alero", "Aurora", "Bravada", "Cutlass", "Eighty-Eight", "Intrigue", "Ninety-Eight", "Omega", "Regency", "Silhouette", "Toronado"],
    "Opel": [],
    "Pace Arrow": [],
    "Peterbilt": [],
    "Peugeot": [],
    "Plymouth": ["Acclaim", "Breeze", "Colt", "Duster", "Grand Voyager", "Horizon", "Laser", "Neon", "Prowler", "Reliant", "Sundance", "Voyager"],
    "Polestar": ["1", "2"],
    "Pontiac": ["6000", "Aztek", "Bonneville", "Fiero", "Firebird", "G3", "G4", "G5", "G6", "G8", "Grand Am", "Grand Prix", "GTO", "LeMans", "Montana", "Phoenix", "Solstice", "Sunbird", "Sunfire", "Torrent", "Trans Sport", "Vibe"],
    "Porsche": ["718 Boxster", "718 Cayman", "911", "928", "944", "968", "Boxster", "Carrera GT", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
    "Prevost Bus": [],
    "Ram": ["1500", "2500", "3500", "ProMaster"],
    "Renault": [],
    "Rivian": ["R1S", "R1T"],
    "Rolls Royce": ["Cullinan", "Ghost", "Phantom", "Wraith"],
    "Rover": [],
    "Saab": ["9-2X", "9-3", "9-4X", "9-5", "9-7x", "900", "9000"],
    "Saturn": ["Astra", "Aura", "Ion", "L-Series", "Outlook", "Relay", "S-Series", "Sky", "Vue"],
    "Scania": [],
    "Scion": ["FR-S", "iA", "iM", "iQ", "tC", "xA", "xB", "xD"],
    "Seat": [],
    "Silver Eagle": [],
    "Simca": [],
    "Smart": ["Fortwo"],
    "Southwind": [],
    "Sterling": [],
    "Sterling Trucks": [],
    "Studebaker": [],
    "Subaru": ["Ascent", "Baja", "Brat", "BRZ", "Crosstrek", "Forester", "Impreza", "Justy", "Legacy", "Loyale", "Outback", "Solterra", "SVX", "Tribeca", "WRX", "XT"],
    "Sunbeam": [],
    "Suzuki": ["Aerio", "Equator", "Esteem", "Forenza", "Grand Vitara", "Kizashi", "Reno", "Samurai", "Sidekick", "Swift", "SX4", "Verona", "Vitara", "X-90", "XL-7"],
    "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster"],
    "Thomas": [],
    "Toyota": ["4Runner", "86", "Avalon", "bZ4X", "C-HR", "Camry", "Celica", "Corolla", "Corolla Cross", "Cressida", "Crown", "ECHO", "FJ Cruiser", "GR86", "Grand Highlander", "Highlander", "Land Cruiser", "Matrix", "Mirai", "MR2", "Paseo", "Previa", "Prius", "RAV4", "Sequoia", "Sienna", "Solara", "Supra", "T100", "Tacoma", "Tercel", "Tundra", "Van", "Venza", "Yaris"],
    "Triumph": [],
    "UD": [],
    "Utilimaster": [],
    "Volkswagen": ["Arteon", "Atlas", "Beetle", "Cabrio", "Cabriolet", "Corrado", "Dasher", "Eos", "EuroVan", "Fox", "GLI", "Golf", "GTI", "ID.4", "Jetta", "Passat", "Phaeton", "Rabbit", "Routan", "Scirocco", "Taos", "Tiguan", "Touareg", "Vanagon"],
    "Volvo": ["240", "740", "850", "940", "960", "C30", "C40", "C70", "S40", "S60", "S70", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"],
    "Western Star": [],
    "White": [],
    "Workhorse": [],
    "Yugo": [],
};

const bodyTypes = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van", "Convertible"];
const makes = Object.keys(vehicleData).sort();
const years = Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function NewVehicleDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialData = {},
}: NewVehicleDialogProps) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    vin: '',
    make: '',
    model: '',
    year: '',
    bodyType: '',
    ...initialData
  });
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const availableModels = useMemo(() => {
    return formData.make ? vehicleData[formData.make as keyof typeof vehicleData] || [] : [];
  }, [formData.make]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        vin: '',
        make: '',
        model: '',
        year: '',
        bodyType: '',
        ...initialData,
      });
    }
  }, [isOpen, initialData]);
  
  useEffect(() => {
    // If the selected make changes and the current model is no longer valid, reset it.
    if (formData.make && !availableModels.includes(formData.model || '')) {
      setFormData(prev => ({ ...prev, model: '' }));
    }
  }, [formData.make, formData.model, availableModels]);


  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleVinDecoded = (decodedData: Partial<DecodeVinOutput> & { vin: string }) => {
    setFormData(prev => ({
      ...prev,
      vin: decodedData.vin || prev.vin,
      make: (decodedData.make !== 'Not Available' ? decodedData.make : prev.make) || '',
      model: (decodedData.model !== 'Not Available' ? decodedData.model : prev.model) || '',
      year: (decodedData.year !== 'Not Available' ? decodedData.year : prev.year) || '',
      bodyType: (decodedData.bodyClass !== 'Not Available' ? decodedData.bodyClass : prev.bodyType) || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model || !formData.year) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Make, Model, and Year are required fields.',
      });
      return;
    }
    
    if (!formData.vin) {
        toast({
            title: 'Warning',
            description: 'VIN is missing. You can add it later, but it is recommended for accurate records.',
        });
    }
    
    onSave(formData);
    toast({ title: 'Vehicle Details Saved', description: 'The vehicle details have been added to the job.' });
    onOpenChange(false);
  };
  
  const handleVinScanned = async (scannedVin: string) => {
    const vin = scannedVin.toUpperCase();
    setFormData(prev => ({ ...prev, vin }));
    setShowScanner(false);
    toast({ title: "VIN Scanned, decoding...", description: `Decoding ${vin}` });
    
    try {
      const decodedData = await decodeVin({ vin });
      handleVinDecoded({ ...decodedData, vin });
       if (decodedData.make && decodedData.make !== 'Not Available') {
         toast({ title: "VIN Decoded", description: `Vehicle details for ${decodedData.year}, ${decodedData.make}, ${decodedData.model} have been pre-filled.` });
      } else {
         toast({ title: "VIN Decode Complete", description: "Some details were not available. Please fill them in manually." });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      toast({
        variant: "destructive",
        title: "VIN Decode Failed",
        description: `Could not auto-decode VIN. Please check it and try again, or enter details manually. Error: ${errorMessage}`,
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add/Edit Vehicle Details</DialogTitle>
            <DialogDescription>Use the VIN decoder or enter vehicle details manually for this job.</DialogDescription>
          </DialogHeader>
          
          <form id="new-vehicle-form" onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>VIN</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 17-character VIN"
                  value={formData.vin || ''}
                  onChange={(e) => setFormData(prev => ({...prev, vin: e.target.value.toUpperCase()}))}
                  maxLength={17}
                  className="flex-grow"
                  suppressFocus={true}
                />
                {isMobile && (
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                    <ScanBarcode className="h-5 w-5"/>
                  </Button>
                )}
              </div>
            </div>
            
            <VinDecoder initialVin={formData.vin} onDecodeSuccess={handleVinDecoded} />
            
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select name="year" onValueChange={(value) => handleSelectChange('year', value)} value={formData.year || ''} required>
                <SelectTrigger><SelectValue placeholder="Select year..." /></SelectTrigger>
                <SelectContent>
                  {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Select name="make" onValueChange={(value) => handleSelectChange('make', value)} value={formData.make || ''} required>
                <SelectTrigger><SelectValue placeholder="Select make..." /></SelectTrigger>
                <SelectContent>
                  {makes.map(make => <SelectItem key={make} value={make}>{make}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Select name="model" onValueChange={(value) => handleSelectChange('model', value)} value={formData.model || ''} required disabled={!formData.make}>
                <SelectTrigger><SelectValue placeholder="Select model..." /></SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => <SelectItem key={model} value={model}>{model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyType">Body Type</Label>
              <Select name="bodyType" onValueChange={(value) => handleSelectChange('bodyType', value)} value={formData.bodyType || ''}>
                <SelectTrigger><SelectValue placeholder="Select body type..." /></SelectTrigger>
                <SelectContent>
                  {bodyTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </form>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="new-vehicle-form">Save Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isMobile && (
        <VinScannerDialog
          isOpen={showScanner}
          onOpenChange={setShowScanner}
          onVinScanned={handleVinScanned}
        />
      )}
    </>
  );
}
