/*
ADMIN: TO APPROVE A GROUND LISTING:
1. Go to Supabase Dashboard → Table Editor → grounds table
2. Find the ground with status = 'pending'
3. Review the name, area, contact_phone submitted by the owner
4. Click the row → edit → change status from 'pending' to 'live'
5. Click Save — the ground immediately appears on the app for all players
To REJECT: change status to 'rejected' or simply delete the row

SQL TO RUN ONCE IN SUPABASE SQL EDITOR:
ALTER TABLE courts ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'fixed';
CREATE TABLE IF NOT EXISTS announcements (id uuid default gen_random_uuid() primary key, ground_id uuid, owner_id uuid, message text, created_at timestamptz default now());
CREATE TABLE IF NOT EXISTS blocked_slots (id uuid default gen_random_uuid() primary key, court_id uuid, ground_id uuid, date text, start_time text, end_time text, reason text, owner_id uuid, created_at timestamptz default now());
CREATE TABLE IF NOT EXISTS favourites (id uuid default gen_random_uuid() primary key, user_id uuid, ground_id uuid, created_at timestamptz default now(), UNIQUE(user_id, ground_id));
*/
import { useState, useEffect, useRef } from "react";
import { supabase } from './supabase';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, Bell, Star, Clock, ChevronRight, Heart,
  Users, Zap, Shield, ArrowLeft, Filter, Phone, Share2,
  CheckCircle, Calendar, Navigation, SlidersHorizontal,
  UserPlus, Trophy, Home, Compass, Swords, User,
  Upload, Camera, ChevronDown, Wifi, Car, Lightbulb,
  Armchair, Lock, Coffee, ShoppingBag, Droplets,
  Plus, Minus, X, Check, AlertCircle, TrendingUp,
  Activity, Target, Award, Radio, RefreshCw, Map
} from "lucide-react";

/* ─── LEAFLET DEFAULT ICON FIX ─── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─── DATA ─── */
const SPORTS = [
  { id:"all",        label:"All",         bg:"#0F172A", fg:"#E2E8F0",  neon:"#E2E8F0" },
  { id:"cricket",    label:"Cricket",     bg:"#14532D", fg:"#4ADE80",  neon:"#4ADE80" },
  { id:"football",   label:"Football",    bg:"#7F1D1D", fg:"#FCA5A5",  neon:"#FF6B6B" },
  { id:"paddle",     label:"Paddle",      bg:"#78350F", fg:"#FCD34D",  neon:"#FFD700" },
  { id:"basketball", label:"Basketball",  bg:"#7C2D12", fg:"#FDBA74",  neon:"#FF8C42" },
  { id:"badminton",  label:"Badminton",   bg:"#4C1D95", fg:"#C4B5FD",  neon:"#BF5FFF" },
  { id:"tennis",     label:"Tennis",      bg:"#164E63", fg:"#67E8F9",  neon:"#00E5FF" },
  { id:"volleyball", label:"Volleyball",  bg:"#1E3A8A", fg:"#93C5FD",  neon:"#4D9FFF" },
  { id:"squash",     label:"Squash",      bg:"#3B0764", fg:"#E879F9",  neon:"#FF00FF" },
  { id:"hockey",     label:"Hockey",      bg:"#064E3B", fg:"#6EE7B7",  neon:"#00FFB3" },
  { id:"tabletennis",label:"Table Tennis",bg:"#7F1D1D", fg:"#FCA5A5",  neon:"#FF6B9D" },
  { id:"swimming",   label:"Swimming",    bg:"#0C4A6E", fg:"#7DD3FC",  neon:"#00CFFF" },
];

/* ─── NEON SPORT ICONS ─── */
const NeonSportIcon = ({ id, color="#fff", size=18 }) => {
  const s = size;
  const h = s;
  const gid = `ng-${id}-${Math.random().toString(36).slice(2,6)}`;
  const glow = (
    <defs>
      <filter id={gid} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.2" result="b1"/>
        <feGaussianBlur stdDeviation="3"   result="b2"/>
        <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  );
  const base = { fill:"none", stroke:color, strokeLinecap:"round", strokeLinejoin:"round", filter:`url(#${gid})` };

  const icons = {
    all: (
      /* Stadium arch */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        <path d="M2 16 Q2 4 10 4 Q18 4 18 16" strokeWidth="1.6" {...base}/>
        <line x1="2" y1="16" x2="18" y2="16" strokeWidth="1.6" {...base}/>
        <line x1="6" y1="16" x2="6" y2="10" strokeWidth="1.2" {...base}/>
        <line x1="14" y1="16" x2="14" y2="10" strokeWidth="1.2" {...base}/>
        <line x1="6" y1="10" x2="14" y2="10" strokeWidth="1.2" {...base}/>
      </svg>
    ),
    cricket: (
      /* Cricket bat angled + ball */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Bat blade - simple angled rectangle */}
        <line x1="4" y1="16" x2="12" y2="4" strokeWidth="4" strokeLinecap="round" {...base}/>
        {/* Bat handle */}
        <line x1="12" y1="4" x2="15" y2="1.5" strokeWidth="1.8" strokeLinecap="round" {...base}/>
        {/* Ball */}
        <circle cx="16" cy="13" r="2.8" strokeWidth="1.5" {...base}/>
        {/* Ball seam */}
        <path d="M13.8 11.5 Q16 13 18.2 11.5" strokeWidth="1" {...base}/>
        <path d="M13.8 14.5 Q16 13 18.2 14.5" strokeWidth="1" {...base}/>
      </svg>
    ),
    football: (
      /* Football with pentagon patches */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" {...base}/>
        {/* Pentagon center */}
        <polygon points="10,5.5 12.5,7.5 11.5,10.5 8.5,10.5 7.5,7.5" strokeWidth="1" {...base}/>
        {/* Seam lines */}
        <line x1="10" y1="5.5" x2="10" y2="2.5" strokeWidth="0.9" {...base}/>
        <line x1="12.5" y1="7.5" x2="15.5" y2="6" strokeWidth="0.9" {...base}/>
        <line x1="11.5" y1="10.5" x2="13.5" y2="13" strokeWidth="0.9" {...base}/>
        <line x1="8.5" y1="10.5" x2="6.5" y2="13" strokeWidth="0.9" {...base}/>
        <line x1="7.5" y1="7.5" x2="4.5" y2="6" strokeWidth="0.9" {...base}/>
      </svg>
    ),
    paddle: (
      /* Paddle racket + ball */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Racket head — rounded rectangle */}
        <ellipse cx="8" cy="8" rx="5.5" ry="6" strokeWidth="1.5" {...base}/>
        {/* Strings horizontal */}
        <line x1="4" y1="6" x2="12" y2="6" strokeWidth="0.7" {...base}/>
        <line x1="3.5" y1="8" x2="12.5" y2="8" strokeWidth="0.7" {...base}/>
        <line x1="4" y1="10" x2="12" y2="10" strokeWidth="0.7" {...base}/>
        {/* Strings vertical */}
        <line x1="6" y1="2.5" x2="6" y2="13.5" strokeWidth="0.7" {...base}/>
        <line x1="8" y1="2" x2="8" y2="14" strokeWidth="0.7" {...base}/>
        <line x1="10" y1="2.5" x2="10" y2="13.5" strokeWidth="0.7" {...base}/>
        {/* Handle */}
        <line x1="8" y1="14" x2="14" y2="19" strokeWidth="1.8" {...base}/>
        {/* Ball */}
        <circle cx="16" cy="5" r="2" strokeWidth="1.3" {...base}/>
      </svg>
    ),
    basketball: (
      /* Basketball with seams */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" {...base}/>
        {/* Vertical seam */}
        <path d="M10 2.5 Q13 6 13 10 Q13 14 10 17.5" strokeWidth="1.1" {...base}/>
        {/* Left seam */}
        <path d="M10 2.5 Q7 6 7 10 Q7 14 10 17.5" strokeWidth="1.1" {...base}/>
        {/* Horizontal seam */}
        <line x1="2.5" y1="10" x2="17.5" y2="10" strokeWidth="1.1" {...base}/>
      </svg>
    ),
    badminton: (
      /* Shuttlecock - cleaner design */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Cork base - rounded bottom */}
        <ellipse cx="10" cy="16" rx="2.5" ry="2" strokeWidth="1.5" {...base}/>
        {/* Feather skirt rim */}
        <ellipse cx="10" cy="7" rx="6" ry="2" strokeWidth="1.2" {...base}/>
        {/* Feather shafts */}
        <line x1="4" y1="7" x2="8.2" y2="14" strokeWidth="1.1" {...base}/>
        <line x1="7" y1="5.2" x2="9.5" y2="14" strokeWidth="1.1" {...base}/>
        <line x1="10" y1="5" x2="10" y2="14" strokeWidth="1.1" {...base}/>
        <line x1="13" y1="5.2" x2="10.5" y2="14" strokeWidth="1.1" {...base}/>
        <line x1="16" y1="7" x2="11.8" y2="14" strokeWidth="1.1" {...base}/>
      </svg>
    ),
    tennis: (
      /* Tennis racket with strings */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Racket head oval */}
        <ellipse cx="9" cy="8" rx="6" ry="6.5" strokeWidth="1.5" {...base}/>
        {/* Strings */}
        <line x1="6" y1="3" x2="6" y2="13"  strokeWidth="0.7" {...base}/>
        <line x1="9" y1="1.5" x2="9" y2="14.5" strokeWidth="0.7" {...base}/>
        <line x1="12" y1="3" x2="12" y2="13" strokeWidth="0.7" {...base}/>
        <line x1="4" y1="6"  x2="14" y2="6"  strokeWidth="0.7" {...base}/>
        <line x1="3.5" y1="8.5" x2="14.5" y2="8.5" strokeWidth="0.7" {...base}/>
        <line x1="4" y1="11" x2="14" y2="11" strokeWidth="0.7" {...base}/>
        {/* Handle */}
        <line x1="9" y1="14.5" x2="15" y2="19" strokeWidth="1.8" {...base}/>
      </svg>
    ),
    volleyball: (
      /* Volleyball with curved stripes */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" {...base}/>
        {/* Curved stripes */}
        <path d="M4 6.5 Q10 4 16 6.5"  strokeWidth="1.1" {...base}/>
        <path d="M2.8 12 Q7 16 10 17.5" strokeWidth="1.1" {...base}/>
        <path d="M17.2 12 Q13 16 10 17.5" strokeWidth="1.1" {...base}/>
        <path d="M4 6.5 Q5 12 2.8 12"   strokeWidth="1.1" {...base}/>
        <path d="M16 6.5 Q15 12 17.2 12" strokeWidth="1.1" {...base}/>
      </svg>
    ),
    squash: (
      /* Squash racket - distinct teardrop with handle */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Teardrop head - wider top */}
        <path d="M10 2.5 C14.5 2.5 16.5 5.5 16.5 9 C16.5 13 13.5 15 10 15 C6.5 15 3.5 13 3.5 9 C3.5 5.5 5.5 2.5 10 2.5Z" strokeWidth="1.5" {...base}/>
        {/* Strings vertical */}
        <line x1="7"  y1="4"  x2="6.5" y2="14" strokeWidth="0.7" {...base}/>
        <line x1="10" y1="3"  x2="10"  y2="15" strokeWidth="0.7" {...base}/>
        <line x1="13" y1="4"  x2="13.5" y2="14" strokeWidth="0.7" {...base}/>
        {/* Strings horizontal */}
        <line x1="4.5" y1="7"  x2="15.5" y2="7"  strokeWidth="0.7" {...base}/>
        <line x1="4"   y1="10" x2="16"   y2="10" strokeWidth="0.7" {...base}/>
        <line x1="4.5" y1="13" x2="15.5" y2="13" strokeWidth="0.7" {...base}/>
        {/* Handle */}
        <line x1="10" y1="15" x2="10" y2="19" strokeWidth="2" strokeLinecap="round" {...base}/>
      </svg>
    ),
    hockey: (
      /* Hockey stick + puck */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Stick shaft */}
        <line x1="4" y1="2" x2="10" y2="13" strokeWidth="1.6" {...base}/>
        {/* Curved blade */}
        <path d="M10 13 Q13 15 16 14 Q17 13.5 16.5 12 Q16 11 13 12 Q11 12.5 10 13" strokeWidth="1.4" {...base}/>
        {/* Puck */}
        <ellipse cx="14" cy="17" rx="3.5" ry="1.5" strokeWidth="1.3" {...base}/>
      </svg>
    ),
    tabletennis: (
      /* Ping pong paddle — round with handle */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Paddle head — circle */}
        <circle cx="9" cy="8" r="6" strokeWidth="1.5" {...base}/>
        {/* Center line */}
        <line x1="3" y1="8" x2="15" y2="8" strokeWidth="0.9" {...base}/>
        {/* Handle */}
        <path d="M12 13 L15.5 17.5" strokeWidth="2" {...base}/>
        {/* Ball */}
        <circle cx="17" cy="3.5" r="1.8" strokeWidth="1.3" {...base}/>
      </svg>
    ),
    swimming: (
      /* Wave lines */
      <svg width={s} height={h} viewBox="0 0 20 20">
        {glow}
        {/* Three waves */}
        <path d="M1.5 6 Q4 3.5 6.5 6 Q9 8.5 11.5 6 Q14 3.5 16.5 6 Q19 8.5 19 8" strokeWidth="1.5" {...base}/>
        <path d="M1.5 10.5 Q4 8 6.5 10.5 Q9 13 11.5 10.5 Q14 8 16.5 10.5 Q19 13 19 12.5" strokeWidth="1.5" {...base}/>
        <path d="M1.5 15 Q4 12.5 6.5 15 Q9 17.5 11.5 15 Q14 12.5 16.5 15 Q19 17.5 19 17" strokeWidth="1.5" {...base}/>
        {/* Swimmer arm silhouette */}
        <path d="M8 4 Q11 2 14 4" strokeWidth="1.2" {...base}/>
      </svg>
    ),
  };

  return icons[id] || icons["all"];
};

/* Generate 14 days from today */
const generateDates = () => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date();
  return Array.from({length:14}, (_,i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return `${months[d.getMonth()]} ${d.getDate()}`;
  });
};
const DATES = generateDates();

/* ─── Real slot generator ─── */
const generateTimeSlots = (openFrom, openTill, slotDurationMins, priceBase, pricePeak) => {
  const slots = [];
  const [startH, startM] = (openFrom || '06:00').split(':').map(Number);
  const [endH, endM]     = (openTill  || '23:00').split(':').map(Number);
  const duration = slotDurationMins || 120;
  let currentMins = startH * 60 + startM;
  const endMins   = endH * 60 + endM;
  while (currentMins + duration <= endMins) {
    const fromH = Math.floor(currentMins / 60).toString().padStart(2, '0');
    const fromM = (currentMins % 60).toString().padStart(2, '0');
    const toMins = currentMins + duration;
    const toH = Math.floor(toMins / 60).toString().padStart(2, '0');
    const toM = (toMins % 60).toString().padStart(2, '0');
    const isPeak = currentMins >= 17 * 60;
    slots.push({
      time:      `${fromH}:${fromM}–${toH}:${toM}`,
      startTime: `${fromH}:${fromM}`,
      endTime:   `${toH}:${toM}`,
      price:     isPeak ? (pricePeak || priceBase || 2000) : (priceBase || 2000),
      booked:    false,
      blocked:   false,
      lfp:       false
    });
    currentMins += duration;
  }
  return slots;
};

const AMENITY_ICONS = {
  "Floodlit":      Lightbulb,
  "Parking":       Car,
  "Washrooms":     Droplets,
  "Turf":          Activity,
  "Seating":       Armchair,
  "Canteen":       Coffee,
  "Security":      Shield,
  "Changing Room": Lock,
  "Showers":       Droplets,
  "Pro Shop":      ShoppingBag,
  "AC Lounge":     Wifi,
  "Café":          Coffee,
  "3 Courts":      Trophy,
};

const GROUNDS = [
  {
    id:1, name:"DHA Sports Complex", area:"DHA Phase 6", distance:"1.2 km",
    rating:4.8, reviews:124, priceFrom:2500,
    sports:["cricket","football","paddle"],
    amenities:["Floodlit","Parking","Washrooms","Turf"],
    openFrom:"06:00", openTill:"23:00",
    isFacility: true,
    description:"Premium sports complex in DHA with 4 separate grounds. Ample parking, well-maintained changing rooms, and security on site 24/7.",
    img:"https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
    customImage:null,
    courts:[
      { id:"1a", name:"Cricket Ground", sports:["cricket"], surface:"Natural Grass", capacity:22, priceBase:2500, pricePeak:3500,
        slots:{"Mar 10":[
          {time:"06:00–08:00",booked:true, price:2500,lfp:false,sport:"cricket"},
          {time:"08:00–10:00",booked:false,price:2500,lfp:false,sport:"cricket"},
          {time:"16:00–18:00",booked:true, price:3000,lfp:true, sport:"cricket",bookedBy:"Hamza K.",need:5,joined:2,style:"competitive",position:"Cricket: Batsman"},
          {time:"18:00–20:00",booked:false,price:3500,lfp:false,sport:"cricket"},
          {time:"20:00–22:00",booked:false,price:3500,lfp:false,sport:"cricket"},
        ]}},
      { id:"1b", name:"Football Ground 1", sports:["football"], surface:"Artificial Turf", capacity:22, priceBase:2000, pricePeak:3000,
        slots:{"Mar 10":[
          {time:"06:00–08:00",booked:false,price:2000,lfp:false,sport:"football"},
          {time:"10:00–12:00",booked:false,price:2000,lfp:false,sport:"football"},
          {time:"14:00–16:00",booked:false,price:2000,lfp:false,sport:"football"},
          {time:"20:00–22:00",booked:true, price:3000,lfp:false,sport:"football"},
        ]}},
      { id:"1c", name:"Football Ground 2", sports:["football"], surface:"Artificial Turf", capacity:14, priceBase:1800, pricePeak:2500,
        slots:{"Mar 10":[
          {time:"06:00–08:00",booked:true, price:1800,lfp:false,sport:"football"},
          {time:"10:00–12:00",booked:false,price:1800,lfp:false,sport:"football"},
          {time:"12:00–14:00",booked:true, price:1800,lfp:true, sport:"football",bookedBy:"Ali R.",need:4,joined:1,style:"casual",position:"Football: Any"},
          {time:"18:00–20:00",booked:false,price:2500,lfp:false,sport:"football"},
        ]}},
      { id:"1d", name:"Paddle Court", sports:["paddle"], surface:"Hard Court", capacity:4, priceBase:2500, pricePeak:4000,
        slots:{"Mar 10":[
          {time:"08:00–09:30",booked:false,price:2500,lfp:false,sport:"paddle"},
          {time:"09:30–11:00",booked:false,price:2500,lfp:false,sport:"paddle"},
          {time:"17:00–18:30",booked:true, price:4000,lfp:false,sport:"paddle"},
          {time:"20:00–21:30",booked:false,price:4000,lfp:false,sport:"paddle"},
        ]}},
    ],
    slots:{"Mar 10":[]},
  },
  {
    id:2, name:"Gulshan Cricket Arena", area:"Gulshan-e-Iqbal", distance:"2.8 km",
    rating:4.5, reviews:89, priceFrom:1800,
    sports:["cricket","football"],
    amenities:["Floodlit","Seating","Canteen"],
    openFrom:"07:00", openTill:"22:00",
    description:"Affordable ground in the heart of Gulshan. Great for practice sessions and friendly matches with stadium-style seating.",
    img:"https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80",
    customImage:null,
    slots:{
      "Mar 10":[
        {time:"07:00–09:00",booked:true, price:1800,lfp:true, sport:"cricket",bookedBy:"Bilal M.",need:6,joined:3,style:"casual",position:"Cricket: Bowler"},
        {time:"09:00–11:00",booked:false,price:1800,lfp:false,sport:"cricket"},
        {time:"17:00–19:00",booked:false,price:2200,lfp:false,sport:"cricket"},
        {time:"19:00–21:00",booked:true, price:2500,lfp:false,sport:"cricket"},
      ],
    },
  },
  {
    id:3, name:"Clifton Paddle Club", area:"Clifton Block 5", distance:"3.5 km",
    rating:4.9, reviews:211, priceFrom:3200,
    sports:["paddle","tennis","badminton"],
    amenities:["Floodlit","Café","Pro Shop","AC Lounge"],
    openFrom:"08:00", openTill:"23:00",
    description:"Karachi's premier paddle destination. Glass-back certified courts, professional coaching, café and pro shop on site.",
    img:"https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
    customImage:null,
    slots:{
      "Mar 10":[
        {time:"08:00–09:30",booked:true, price:3200,lfp:false,sport:"paddle"},
        {time:"09:30–11:00",booked:true, price:3200,lfp:true, sport:"paddle",bookedBy:"Sara A.",need:1,joined:0,style:"competitive",position:"Paddle: Left"},
        {time:"11:00–12:30",booked:false,price:3200,lfp:false,sport:"tennis"},
        {time:"17:00–18:30",booked:false,price:4000,lfp:false,sport:"paddle"},
        {time:"20:00–21:30",booked:false,price:4000,lfp:false,sport:"badminton"},
      ],
    },
  },
  {
    id:4, name:"PECHS Football Ground", area:"PECHS Block 2", distance:"4.1 km",
    rating:4.3, reviews:67, priceFrom:1500,
    sports:["football","cricket"],
    amenities:["Changing Room","Showers","Parking"],
    openFrom:"06:00", openTill:"22:00",
    description:"Spacious full-size football pitch. 11-a-side ready with proper changing rooms and showers. Ideal for competitive matches.",
    img:"https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80",
    customImage:null,
    slots:{
      "Mar 10":[
        {time:"06:00–08:00",booked:false,price:1500,lfp:false,sport:"football"},
        {time:"10:00–12:00",booked:false,price:1500,lfp:false,sport:"cricket"},
        {time:"16:00–18:00",booked:true, price:2000,lfp:true, sport:"football",bookedBy:"Zain F.",need:8,joined:4,style:"casual",position:"Football: Striker"},
        {time:"20:00–22:00",booked:false,price:2500,lfp:false,sport:"football"},
      ],
    },
  },
  {
    id:5, name:"North Nazimabad Sports Hub", area:"North Nazimabad", distance:"6.7 km",
    rating:4.6, reviews:145, priceFrom:2000,
    sports:["basketball","badminton","football"],
    amenities:["3 Courts","Floodlit","Canteen","Security"],
    openFrom:"07:00", openTill:"23:00",
    description:"Multi-sport facility with 3 separate courts across two floors. One of the best equipped sports hubs in North Karachi.",
    img:"https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    customImage:null,
    slots:{
      "Mar 10":[
        {time:"07:00–09:00",booked:false,price:2000,lfp:false,sport:"basketball"},
        {time:"09:00–11:00",booked:true, price:2000,lfp:true, sport:"basketball",bookedBy:"Omar S.",need:3,joined:1,style:"competitive",position:"Basketball: Guard"},
        {time:"15:00–17:00",booked:false,price:2500,lfp:false,sport:"badminton"},
        {time:"19:00–21:00",booked:false,price:3000,lfp:false,sport:"football"},
      ],
    },
  },
];

const TEAM_CHALLENGES = [
  {
    id:"tc1", groundName:"DHA Sports Complex", area:"DHA Phase 6", date:"Mar 10",
    time:"16:00–18:00", sport:"cricket", teamName:"DHA Strikers",
    teamSize:11, captain:"Hamza K.", phone:"0312-3456789",
    format:"11-a-side", challenged:false,
  },
  {
    id:"tc2", groundName:"PECHS Football Ground", area:"PECHS Block 2", date:"Mar 10",
    time:"16:00–18:00", sport:"football", teamName:"PECHS FC",
    teamSize:5, captain:"Zain F.", phone:"0333-9876543",
    format:"5v5 Futsal", challenged:false,
  },
  {
    id:"tc3", groundName:"Clifton Paddle Club", area:"Clifton Block 5", date:"Mar 10",
    time:"17:00–18:30", sport:"paddle", teamName:"Clifton Padlers",
    teamSize:2, captain:"Sara A.", phone:"0321-1122334",
    format:"Doubles", challenged:false,
  },
  {
    id:"tc4", groundName:"North Nazimabad Sports Hub", area:"North Nazimabad", date:"Mar 11",
    time:"09:00–11:00", sport:"basketball", teamName:"NN Ballers",
    teamSize:5, captain:"Omar S.", phone:"0300-5544332",
    format:"5v5", challenged:false,
  },
];
const gImg = (g) => g.customImage || g.img;
const sportObj = (id) => SPORTS.find(s=>s.id===id) || SPORTS[0];

/* ─── CSS ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Sora:wght@400;500;600;700;800;900&display=swap');

*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{
  --ink:#0A0E1A;
  --ink2:#2D3448;
  --ink3:#6B7280;
  --ink4:#9CA3AF;
  --white:#FFFFFF;
  --bg:#F6F7FA;
  --card:#FFFFFF;
  --green:#16A34A;
  --green-d:#15803D;
  --green-l:#DCFCE7;
  --green-v:#22C55E;
  --red:#EF4444;
  --orange:#F97316;
  --amber:#F59E0B;
  --blue:#3B82F6;
  --border:#E5E7EB;
  --border2:#F3F4F6;
  --s1:0 1px 3px rgba(0,0,0,.05),0 1px 6px rgba(0,0,0,.04);
  --s2:0 4px 14px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.05);
  --s3:0 10px 36px rgba(0,0,0,.13),0 3px 10px rgba(0,0,0,.07);
  --r:20px;--r2:14px;--r3:10px;--r4:8px;
}
html,body{
  height:100%;
  margin:0;padding:0;
  font-family:'Inter',sans-serif;
  -webkit-font-smoothing:antialiased;
  overscroll-behavior:none;
  background:#000;
}
.app{
  max-width:430px;
  width:100%;
  margin:0 auto;
  background:var(--bg);
  min-height:100vh;
  min-height:100svh;
  position:relative;
  overflow-x:hidden;
  box-shadow:0 0 80px rgba(0,0,0,.4);
}
/* Desktop centering */
@media(min-width:431px){
  body{display:flex;align-items:flex-start;justify-content:center;}
  .app{min-height:100vh;min-height:100svh;}
  .navbar{max-width:430px;}
}
.screen{
  display:none;
  flex-direction:column;
  width:100%;
}
.screen.active{display:flex;}
/* Fix zoom on tap - prevent iOS auto-zoom */
input,select,textarea{font-size:16px !important;}

/* ── TRANSITIONS ── */
.slide-in-right{animation:slideInRight .25s cubic-bezier(.25,.46,.45,.94) forwards;}
.slide-in-left{animation:slideInLeft .25s cubic-bezier(.25,.46,.45,.94) forwards;}
.scale-in{animation:scaleIn .28s cubic-bezier(.34,1.56,.64,1) forwards;}
@keyframes slideInRight{from{transform:translateX(100%);opacity:.9;}to{transform:translateX(0);opacity:1;}}
@keyframes slideInLeft{from{transform:translateX(-100%);opacity:.9;}to{transform:translateX(0);opacity:1;}}
@keyframes scaleIn{from{transform:scale(.96) translateY(6px);opacity:0;}to{transform:scale(1) translateY(0);opacity:1;}}

/* ── SPLASH ── */
.splash{
  background:#040608;
  align-items:center;
  justify-content:center;
  position:fixed;
  top:0;left:0;right:0;bottom:0;
  width:100%;
  height:100%;
  overflow:hidden;
  flex-direction:column;
  z-index:999;
}
/* Dark vignette bg */
.splash-bg-grad{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 40%, rgba(0,255,120,.07) 0%, transparent 70%),
    radial-gradient(ellipse 100% 100% at 50% 100%, rgba(0,200,80,.04) 0%, transparent 60%);
}
/* ── NEON CRICKET WICKET SVG ── */
.splash-neon-wrap{
  position:relative;
  z-index:2;
  width:180px;
  height:180px;
  margin-bottom:28px;
  display:flex;
  align-items:center;
  justify-content:center;
}
/* Neon glow orb behind wicket */
.splash-neon-orb{
  position:absolute;
  width:140px;height:140px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(34,255,120,.18) 0%,rgba(34,255,120,.04) 50%,transparent 70%);
  animation:orbpulse 2s ease-in-out infinite;
}
@keyframes orbpulse{0%,100%{transform:scale(1);opacity:.8;}50%{transform:scale(1.15);opacity:1;}}
/* The SVG itself is inline in JSX */
/* Neon flicker animation for strokes */
@keyframes neonFlicker{
  0%,19%,21%,23%,25%,54%,56%,100%{
    filter:drop-shadow(0 0 4px #00ff78) drop-shadow(0 0 12px #00ff78) drop-shadow(0 0 24px #00cc55);
    opacity:1;
  }
  20%,24%,55%{
    filter:none;
    opacity:.7;
  }
}
@keyframes neonOn{
  0%{stroke-dashoffset:400;opacity:0;}
  30%{opacity:.3;}
  60%{stroke-dashoffset:0;opacity:1;}
  100%{stroke-dashoffset:0;opacity:1;}
}
@keyframes batSwing{
  0%{transform:rotate(-35deg) translateX(-10px);}
  40%{transform:rotate(20deg) translateX(5px);}
  60%{transform:rotate(15deg) translateX(4px);}
  100%{transform:rotate(20deg) translateX(5px);}
}
@keyframes ballLaunch{
  0%{transform:translate(0,0);opacity:0;}
  10%{opacity:1;}
  100%{transform:translate(60px,-80px);opacity:0;}
}
@keyframes sparkle{
  0%{transform:scale(0) rotate(0deg);opacity:1;}
  100%{transform:scale(1.5) rotate(180deg);opacity:0;}
}
.neon-wicket{
  animation:neonFlicker 4s ease-in-out infinite;
  stroke-dasharray:400;
  animation:neonOn 1.2s ease forwards, neonFlicker 4s 1.2s ease-in-out infinite;
}
.neon-bat{
  transform-origin:80px 130px;
  animation:batSwing 1s .4s cubic-bezier(.34,1.56,.64,1) forwards;
}
.neon-ball{
  animation:ballLaunch .8s .9s ease-out forwards;
  opacity:0;
}
.neon-spark{
  animation:sparkle .6s 1s ease-out forwards;
  opacity:0;
}
/* ── Rest of splash ── */
.splash-inner{position:relative;z-index:2;text-align:center;padding:0 30px;}
.splash-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(0,255,120,.08);border:1px solid rgba(0,255,120,.25);color:#00ff78;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:5px 13px;border-radius:100px;margin-bottom:14px;text-shadow:0 0 8px rgba(0,255,120,.6);}
.splash-pill-dot{width:5px;height:5px;border-radius:50%;background:#00ff78;animation:blink 1.4s ease infinite;box-shadow:0 0 8px #00ff78;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.2;}}
.splash-logo{font-family:'Sora',sans-serif;font-size:58px;font-weight:900;color:#fff;letter-spacing:-3px;line-height:1;}
.splash-logo em{
  color:#00ff78;font-style:normal;
  text-shadow:0 0 10px rgba(0,255,120,.8),0 0 30px rgba(0,255,120,.4);
}
.splash-tagline{font-size:11px;color:rgba(255,255,255,.3);margin-top:8px;letter-spacing:1px;font-weight:400;}
.splash-loader{display:flex;align-items:center;gap:8px;margin-top:36px;padding:0 30px;position:relative;z-index:2;width:100%;}
.splash-bar-fill{height:2px;border-radius:100px;background:linear-gradient(90deg,#00ff78,#00cc55);animation:barload 1.8s ease forwards;box-shadow:0 0 8px rgba(0,255,120,.6);}
@keyframes barload{from{width:0;}to{width:100%;}}
.splash-bar-wrap{flex:1;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;height:2px;}

/* ── ONBOARD ── */
.onboard{background:#060B12;position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column;}
.ob-bg{position:absolute;inset:0;z-index:0;}
.ob-bg img{width:100%;height:55%;object-fit:cover;object-position:center 30%;}
.ob-bg-fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,11,18,0) 0%,rgba(6,11,18,.5) 30%,rgba(6,11,18,.95) 55%,#060B12 72%);}
.ob-bg-fade2{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg,transparent,#060B12 30%);}
.ob-content{position:relative;z-index:2;display:flex;flex-direction:column;flex:1;padding:0 22px 44px;}
.ob-top-badge{position:absolute;top:52px;left:22px;display:flex;align-items:center;gap:7px;background:rgba(0,0,0,.45);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);border-radius:100px;padding:6px 14px;}
.ob-top-logo{font-family:'Sora',sans-serif;font-size:15px;font-weight:900;color:#fff;letter-spacing:-.5px;}
.ob-top-logo em{color:var(--green-v);font-style:normal;}
.ob-live-dot{width:6px;height:6px;border-radius:50%;background:var(--green-v);animation:blink 1.4s ease infinite;}
.ob-mid{margin-top:auto;padding-top:52%;}
.ob-pretag{font-size:10px;font-weight:700;color:var(--green-v);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;}
.ob-h{font-family:'Sora',sans-serif;font-size:36px;font-weight:900;color:#fff;line-height:1.06;letter-spacing:-1px;}
.ob-h em{color:var(--green-v);font-style:normal;}
.ob-sub{font-size:13px;color:rgba(255,255,255,.42);line-height:1.65;margin-top:10px;font-weight:400;max-width:290px;text-align:left;}
.ob-stats{display:flex;gap:6px;margin-top:18px;}
.ob-stat{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:11px 8px;text-align:center;}
.ob-stat-n{font-family:'Sora',sans-serif;font-size:17px;font-weight:900;color:#fff;}
.ob-stat-l{font-size:9px;color:rgba(255,255,255,.35);margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
.ob-divider{height:1px;background:rgba(255,255,255,.07);margin:20px 0;}
.ob-role-label{font-size:11px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;}
.ob-roles{display:flex;gap:10px;}
.ob-role-card{flex:1;border-radius:18px;padding:18px 14px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden;border:1.5px solid rgba(255,255,255,.08);}
.ob-role-card.player{background:linear-gradient(135deg,rgba(22,163,74,.25),rgba(34,197,94,.12));}
.ob-role-card.owner{background:linear-gradient(135deg,rgba(249,115,22,.2),rgba(251,146,60,.08));}
.ob-role-card:hover{transform:translateY(-2px);}
.ob-role-ico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:11px;}
.ob-role-card.player .ob-role-ico{background:rgba(34,197,94,.2);}
.ob-role-card.owner .ob-role-ico{background:rgba(249,115,22,.2);}
.ob-role-title{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:#fff;margin-bottom:4px;}
.ob-role-desc{font-size:10px;color:rgba(255,255,255,.4);line-height:1.5;font-weight:500;}
.ob-role-arrow{position:absolute;bottom:14px;right:14px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.ob-role-card.player .ob-role-arrow{background:rgba(34,197,94,.25);}
.ob-role-card.owner .ob-role-arrow{background:rgba(249,115,22,.2);}
.ob-sports-scroll{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-top:14px;padding-bottom:2px;}
.ob-sports-scroll::-webkit-scrollbar{display:none;}
.ob-sport-tag{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);flex-shrink:0;}

/* ── HOME ── */
.home{background:var(--bg);overflow-y:auto;padding-bottom:84px;min-height:100svh;}
.home-head{background:var(--ink);padding:52px 18px 0;position:relative;overflow:hidden;}
.home-head-blob{position:absolute;top:-80px;right:-60px;width:260px;height:260px;background:radial-gradient(circle,rgba(34,197,94,.1) 0%,transparent 65%);pointer-events:none;}
.home-head-blob2{position:absolute;bottom:-40px;left:-40px;width:180px;height:180px;background:radial-gradient(circle,rgba(59,130,246,.07) 0%,transparent 65%);pointer-events:none;}
.hrow{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;}
.hgreet{font-size:11px;color:rgba(255,255,255,.35);font-weight:500;}
.hname{font-family:'Sora',sans-serif;font-size:20px;font-weight:800;color:#fff;margin-top:1px;letter-spacing:-.3px;}
.hloc{display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(255,255,255,.35);margin-top:3px;font-weight:400;}
.head-actions{display:flex;gap:8px;align-items:center;}
.icon-btn{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:all .2s;}
.icon-btn:hover{background:rgba(255,255,255,.14);}
.notif-dot{position:absolute;top:8px;right:8px;width:7px;height:7px;background:var(--green-v);border-radius:50%;border:1.5px solid var(--ink);}
.search-wrap{position:relative;z-index:1;margin-top:14px;}
.search-row{display:flex;gap:9px;align-items:center;}
.search-box{flex:1;display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:11px 14px;backdrop-filter:blur(10px);}
.search-input{flex:1;border:none;outline:none;font-family:'Inter',sans-serif;font-size:13px;color:#fff;background:transparent;font-weight:400;}
.search-input::placeholder{color:rgba(255,255,255,.25);}
.filter-btn{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .2s;}
.filter-btn:hover{background:rgba(255,255,255,.16);}

/* ── HERO CAROUSEL ── */
.hero-section{padding:20px 18px 0;}
.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.section-title{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:var(--ink);letter-spacing:-.1px;}
.section-link{font-size:12px;font-weight:600;color:var(--green);cursor:pointer;display:flex;align-items:center;gap:2px;}
.hero-scroll-wrap{overflow:hidden;width:100%;cursor:pointer;}
.hero-scroll{display:flex;gap:12px;padding-bottom:4px;width:max-content;animation:heroSlide 22s linear infinite;}
.hero-scroll:hover{animation-play-state:paused;}
@keyframes heroSlide{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.hero-card{flex-shrink:0;width:248px;border-radius:var(--r);overflow:hidden;position:relative;cursor:pointer;box-shadow:var(--s2);transition:transform .22s;}
.hero-card:hover{transform:translateY(-3px) scale(1.01);}
.hero-card:active{transform:scale(.98);}
.hero-card-img{width:100%;height:162px;object-fit:cover;display:block;}
.hero-card-img-ph{width:100%;height:162px;background:linear-gradient(135deg,#1a3020,#2d5a3d);display:flex;align-items:center;justify-content:center;}
.hero-grad{position:absolute;inset:0;background:linear-gradient(145deg,rgba(0,0,0,.04),rgba(0,0,0,.65));}
.hero-top-row{position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;}
.hero-rating-pill{display:flex;align-items:center;gap:4px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;}
.hero-price-pill{background:var(--green-v);color:#fff;font-size:10px;font-weight:800;padding:3px 9px;border-radius:100px;}
.hero-lfp-pill{position:absolute;top:34px;right:10px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;}
.hero-bottom{position:absolute;bottom:0;left:0;right:0;padding:10px 13px;}
.hero-name{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:#fff;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hero-meta{display:flex;align-items:center;gap:8px;margin-top:3px;}
.hero-meta-item{display:flex;align-items:center;gap:3px;font-size:10px;color:rgba(255,255,255,.65);font-weight:500;}
.hero-dots{display:flex;gap:4px;justify-content:center;margin-top:10px;}
.hero-dot{height:4px;border-radius:100px;background:var(--border2);cursor:pointer;transition:all .25s;}
.hero-dot.on{background:var(--green);width:18px;}
.hero-dot:not(.on){width:4px;}

/* ── SPORT FILTER ── */
.sport-section{padding:16px 18px 0;}
.sport-scroll{display:flex;gap:9px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;}
.sport-scroll::-webkit-scrollbar{display:none;}
.sport-chip{flex-shrink:0;display:flex;align-items:center;gap:7px;padding:8px 14px 8px 10px;border-radius:100px;border:1.5px solid var(--border);background:var(--white);cursor:pointer;transition:all .2s;box-shadow:var(--s1);}
.sport-chip.on{border-color:transparent;box-shadow:0 3px 12px rgba(0,0,0,.12);}
.sport-chip-ico{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sport-chip-label{font-size:12px;font-weight:700;color:var(--ink3);}
.sport-chip.on .sport-chip-label{color:var(--ink);}

/* ── GROUND CARDS ── */
.glist-section{padding:16px 18px 0;}
.glist{display:flex;flex-direction:column;gap:13px;padding-bottom:6px;}
.gcard{background:var(--white);border-radius:var(--r);overflow:hidden;box-shadow:var(--s1);cursor:pointer;transition:all .22s;border:1px solid rgba(0,0,0,.04);}
.gcard:hover{transform:translateY(-2px);box-shadow:var(--s2);}
.gcard:active{transform:scale(.99);}
.gcard-img-wrap{position:relative;width:100%;height:156px;overflow:hidden;}
.gcard-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s;}
.gcard:hover .gcard-img{transform:scale(1.04);}
.gcard-img-ph{width:100%;height:100%;background:linear-gradient(135deg,#1a3020,#2d5a3d);display:flex;align-items:center;justify-content:center;}
.gcard-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.52) 0%,rgba(0,0,0,.02) 52%);}
.gcard-tl{position:absolute;top:10px;left:10px;display:flex;gap:5px;}
.gcard-tr{position:absolute;top:10px;right:10px;}
.img-pill{display:flex;align-items:center;gap:3px;background:rgba(0,0,0,.58);backdrop-filter:blur(8px);color:#fff;font-size:10px;font-weight:600;padding:3px 9px;border-radius:100px;border:1px solid rgba(255,255,255,.1);}
.img-pill.green{background:rgba(22,163,74,.85);}
.img-pill.orange{background:rgba(249,115,22,.9);}
.gcard-bl{position:absolute;bottom:10px;left:12px;}
.gcard-br{position:absolute;bottom:10px;right:12px;}
.gcard-name{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:#fff;letter-spacing:-.2px;}
.gcard-area{display:flex;align-items:center;gap:3px;font-size:10px;color:rgba(255,255,255,.65);margin-top:2px;}
.gcard-body{padding:13px 14px 14px;}
.gcard-info-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
.gcard-info-item{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--ink3);font-weight:500;}
.gcard-amenities{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}
.amenity-chip{display:flex;align-items:center;gap:4px;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:3px 9px;font-size:10px;font-weight:600;color:var(--ink2);}
.slot-dots-row{display:flex;align-items:center;gap:3px;}
.sdot{width:9px;height:9px;border-radius:3px;flex-shrink:0;}
.sdot.free{background:#22C55E;}.sdot.bkd{background:#FCA5A5;border:1px solid #F87171;}.sdot.lfp{background:var(--orange);}
.sdot-text{font-size:10px;color:var(--ink4);margin-left:5px;font-weight:600;}
.gcard-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--border2);}
.sports-mini{display:flex;gap:4px;}
.sport-dot-chip{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.gcard-price{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:var(--green);}
.gcard-price span{font-size:10px;font-weight:500;color:var(--ink4);}

/* ── DETAIL ── */
.detail{background:var(--bg);overflow-y:auto;}
.detail-hero{position:relative;width:100%;height:255px;overflow:hidden;}
.detail-hero img{width:100%;height:100%;object-fit:cover;}
.detail-hero-ph{width:100%;height:100%;background:linear-gradient(135deg,#1a3020,#2d5a3d);display:flex;align-items:center;justify-content:center;}
.detail-hero-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.62) 0%,rgba(0,0,0,.05) 50%);}
.detail-hero-actions{position:absolute;top:50px;left:14px;right:14px;display:flex;justify-content:space-between;}
.dhero-btn{width:38px;height:38px;background:rgba(0,0,0,.45);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;transition:all .2s;}
.dhero-btn:hover{background:rgba(0,0,0,.6);}
.dhero-actions-right{display:flex;gap:8px;}
.detail-hero-bottom{position:absolute;bottom:0;left:0;right:0;padding:12px 16px;}
.detail-hero-name{font-family:'Sora',sans-serif;font-size:20px;font-weight:900;color:#fff;letter-spacing:-.4px;}
.detail-hero-meta{display:flex;align-items:center;gap:10px;margin-top:5px;}
.detail-hero-meta-item{display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(255,255,255,.65);font-weight:500;}
.detail-sheet{background:var(--white);border-radius:22px 22px 0 0;margin-top:-22px;position:relative;padding:20px 17px;min-height:58vh;}
.detail-tags-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px;}
.dtag{display:flex;align-items:center;gap:5px;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:5px 11px;font-size:11px;font-weight:600;color:var(--ink2);}
.detail-stat-row{display:flex;gap:8px;margin-bottom:16px;}
.detail-stat{flex:1;background:var(--bg);border-radius:12px;padding:10px 12px;border:1px solid var(--border);}
.dstat-label{font-size:9px;font-weight:700;color:var(--ink4);text-transform:uppercase;letter-spacing:.7px;}
.dstat-val{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:var(--green-d);margin-top:3px;}
.detail-desc{font-size:13px;color:var(--ink3);line-height:1.7;margin-bottom:16px;}
.detail-sec{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:var(--ink);margin:18px 0 10px;letter-spacing:-.1px;}
.sports-row{display:flex;flex-wrap:wrap;gap:7px;}
.sport-pill-detail{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:100px;font-size:12px;font-weight:700;border:1.5px solid;transition:all .2s;}
.map-block{width:100%;height:112px;border-radius:var(--r2);background:linear-gradient(135deg,#DBEAFE,#BFDBFE);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;border:1px solid #BFDBFE;transition:all .2s;}
.map-block:hover{box-shadow:var(--s1);}
.map-block-t{font-size:12px;font-weight:700;color:#1D4ED8;}
.map-block-s{font-size:10px;color:#3B82F6;}
.date-row{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;}
.date-row::-webkit-scrollbar{display:none;}
.date-btn{flex-shrink:0;padding:7px 15px;border-radius:100px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--border);background:var(--white);color:var(--ink4);font-family:'Inter',sans-serif;transition:all .2s;}
.date-btn.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.slot-legend{display:flex;gap:12px;margin:10px 0 7px;align-items:center;flex-wrap:wrap;}
.sl{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--ink3);font-weight:600;}
.sl-sq{width:9px;height:9px;border-radius:3px;}
.slots-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.slot-card{border-radius:13px;padding:12px;border:1.5px solid;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.slot-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2.5px;}
.slot-card.free{background:#F0FDF4;border-color:#BBF7D0;}
.slot-card.free::before{background:var(--green-v);}
.slot-card.free:hover{background:#DCFCE7;border-color:var(--green-v);transform:translateY(-1px);}
.slot-card.free.sel{background:#DCFCE7;border-color:var(--green);box-shadow:0 0 0 3px rgba(34,197,94,.12);}
.slot-card.bkd{background:#FAFAFA;border-color:#F3F4F6;cursor:default;opacity:.62;}
.slot-card.bkd::before{background:#D1D5DB;}
.slot-card.lfp{background:#FFF7ED;border-color:#FED7AA;}
.slot-card.lfp::before{background:var(--orange);}
.slot-card.lfp:hover{background:#FFEDD5;border-color:var(--orange);}
.slot-time{font-family:'Sora',sans-serif;font-size:12px;font-weight:800;color:var(--ink);}
.slot-status{font-size:10px;margin-top:2px;font-weight:600;}
.slot-price{font-size:11px;font-weight:600;color:var(--ink3);margin-top:2px;}
.lfp-badge{display:inline-flex;align-items:center;gap:4px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;margin-top:5px;}
.join-btn{width:100%;margin-top:5px;background:var(--orange);color:#fff;border:none;border-radius:8px;padding:6px;font-size:10px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:4px;}
.join-btn.done{background:transparent;color:var(--orange);border:1.5px solid var(--orange);}
.lfp-toggle{display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-radius:13px;padding:13px 15px;margin-top:10px;border:1px solid var(--border);}
.lfp-toggle-left{}
.lfp-toggle-t{font-size:13px;font-weight:700;color:var(--ink);}
.lfp-toggle-s{font-size:10px;color:var(--ink4);margin-top:2px;}
.sw{width:42px;height:24px;border-radius:100px;border:none;cursor:pointer;position:relative;transition:background .28s;flex-shrink:0;}
.sw.off{background:#D1D5DB;}.sw.on{background:var(--orange);}
.sw-knob{position:absolute;top:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:left .28s;box-shadow:0 1px 5px rgba(0,0,0,.18);}
.sw.off .sw-knob{left:3px;}.sw.on .sw-knob{left:21px;}
.book-bar{position:sticky;bottom:0;background:rgba(255,255,255,.95);backdrop-filter:blur(14px);padding:12px 17px 28px;border-top:1px solid var(--border2);box-shadow:0 -4px 22px rgba(0,0,0,.07);}
.book-btn{width:100%;background:var(--ink);color:#fff;border:none;border-radius:100px;padding:15px;font-family:'Sora',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all .22s;letter-spacing:.1px;}
.book-btn:hover:not(:disabled){background:var(--green-d);transform:translateY(-1px);box-shadow:0 6px 22px rgba(22,163,74,.28);}
.book-btn:disabled{opacity:.3;cursor:not-allowed;}

/* ── CONFIRM ── */
.confirm{background:var(--bg);}
.confirm-head{background:var(--ink);padding:50px 18px 24px;position:relative;overflow:hidden;}
.confirm-head-glow{position:absolute;top:-50px;right:-30px;width:180px;height:180px;background:radial-gradient(circle,rgba(34,197,94,.12),transparent 70%);pointer-events:none;}
.confirm-back-btn{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.08);border:none;border-radius:9px;padding:7px 12px;color:rgba(255,255,255,.65);cursor:pointer;font-size:12px;font-weight:600;font-family:'Inter',sans-serif;}
.confirm-title{font-family:'Sora',sans-serif;font-size:19px;font-weight:900;color:#fff;margin-top:14px;letter-spacing:-.3px;}
.confirm-sub{font-size:11px;color:rgba(255,255,255,.35);margin-top:3px;}
.confirm-body{padding:18px 17px 90px;}
.c-block{background:#fff;border-radius:var(--r);padding:17px;box-shadow:var(--s1);border:1px solid rgba(0,0,0,.04);margin-bottom:12px;}
.c-block-title{font-size:10px;font-weight:800;color:var(--ink4);text-transform:uppercase;letter-spacing:1px;margin-bottom:13px;}
.c-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border2);}
.c-row:last-child{border-bottom:none;padding-bottom:0;}
.c-label{font-size:12px;color:var(--ink3);font-weight:400;}
.c-val{font-size:12px;font-weight:700;color:var(--ink);}
.c-total{font-family:'Sora',sans-serif;font-size:17px;font-weight:900;color:var(--green-d);}
.pay-list{display:flex;flex-direction:column;gap:8px;}
.pay-item{display:flex;align-items:center;gap:12px;padding:13px;border-radius:13px;border:1.5px solid var(--border);cursor:pointer;transition:all .2s;}
.pay-item.sel{border-color:var(--ink);background:var(--bg);}
.pay-ico-wrap{width:36px;height:36px;border-radius:10px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:1px solid var(--border);}
.pay-label{font-size:13px;font-weight:700;color:var(--ink);flex:1;}
.pay-radio{width:18px;height:18px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pay-radio.sel{border-color:var(--ink);background:var(--ink);}
.pay-radio.sel::after{content:'';width:6px;height:6px;background:#fff;border-radius:50%;}
.soon-note{background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:10px 13px;margin-top:9px;font-size:11px;color:#92400E;display:flex;align-items:flex-start;gap:8px;}

/* ── SUCCESS ── */
.success{align-items:center;justify-content:center;padding:44px 28px;background:#fff;text-align:center;}
.success-ring{width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,var(--green-v),#86EFAC);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 40px rgba(34,197,94,.28),0 0 0 14px rgba(34,197,94,.07);animation:pop .5s cubic-bezier(.34,1.56,.64,1);}
@keyframes pop{from{transform:scale(0);opacity:0;}to{transform:scale(1);opacity:1;}}
.success-title{font-family:'Sora',sans-serif;font-size:24px;font-weight:900;color:var(--ink);margin-top:22px;letter-spacing:-.4px;}
.success-sub{font-size:13px;color:var(--ink3);margin-top:7px;line-height:1.6;}
.ref-box{background:var(--green-l);border:1px solid rgba(22,163,74,.2);border-radius:var(--r);padding:15px 22px;margin-top:22px;width:100%;}
.ref-label{font-size:10px;color:var(--ink4);text-transform:uppercase;letter-spacing:1px;font-weight:700;}
.ref-code{font-family:'Sora',sans-serif;font-size:22px;font-weight:900;color:var(--green-d);margin-top:4px;letter-spacing:2.5px;}
.success-detail-box{background:var(--bg);border-radius:13px;padding:14px;margin-top:13px;width:100%;text-align:left;border:1px solid var(--border);}
.sdb-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink2);padding:4px 0;font-weight:500;}

/* ── MATCHMAKING ── */
.match{background:var(--bg);overflow-y:auto;padding-bottom:88px;min-height:100svh;}
.match-head{background:var(--ink);padding:52px 18px 26px;position:relative;overflow:hidden;}
.match-head::after{content:'';position:absolute;bottom:-18px;left:0;right:0;height:36px;background:var(--bg);border-radius:22px 22px 0 0;}
.match-glow{position:absolute;top:-30px;right:-20px;width:160px;height:160px;background:radial-gradient(circle,rgba(249,115,22,.15),transparent 70%);}
.match-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:900;color:#fff;letter-spacing:-.3px;}
.match-sub{font-size:11px;color:rgba(255,255,255,.35);margin-top:3px;}
.mc{background:#fff;border-radius:var(--r2);padding:15px;box-shadow:var(--s1);border:1px solid rgba(0,0,0,.04);margin-bottom:10px;transition:all .2s;}
.mc:hover{transform:translateY(-1px);box-shadow:var(--s2);}
.mc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;}
.mc-name{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:var(--ink);letter-spacing:-.2px;}
.mc-sport-tag{font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;white-space:nowrap;}
.mc-detail{display:flex;flex-direction:column;gap:3px;margin-top:6px;}
.mc-detail-row{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink3);font-weight:500;}
.mc-bottom{display:flex;align-items:center;gap:7px;margin-top:11px;}
.mc-avs{display:flex;}
.mc-av{width:26px;height:26px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;margin-left:-6px;background:linear-gradient(135deg,#DCFCE7,#BBF7D0);color:var(--green);}
.mc-av:first-child{margin-left:0;}
.mc-spots{font-size:11px;color:var(--orange);font-weight:700;}
.mc-join{background:var(--orange);color:#fff;border:none;border-radius:100px;padding:7px 16px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;margin-left:auto;display:flex;align-items:center;gap:4px;}
.mc-join:hover{background:#EA6C0A;}
.mc-join.done{background:transparent;color:var(--orange);border:1.5px solid var(--orange);}

/* ── EXPLORE ── */
.explore{background:var(--bg);overflow-y:auto;padding-bottom:88px;min-height:100svh;}
.exp-head{background:var(--ink);padding:52px 18px 26px;position:relative;overflow:hidden;}
.exp-head::after{content:'';position:absolute;bottom:-18px;left:0;right:0;height:36px;background:var(--bg);border-radius:22px 22px 0 0;}
.exp-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:900;color:#fff;letter-spacing:-.3px;}
.exp-sub{font-size:11px;color:rgba(255,255,255,.35);margin-top:3px;}

/* ── PROFILE ── */
.profile{background:var(--bg);overflow-y:auto;padding-bottom:88px;min-height:100svh;}
.prof-head{background:var(--ink);padding:52px 18px 44px;text-align:center;position:relative;overflow:hidden;}
.prof-head::after{content:'';position:absolute;bottom:-18px;left:0;right:0;height:36px;background:var(--bg);border-radius:22px 22px 0 0;}
.prof-glow{position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 40%,rgba(34,197,94,.1) 0%,transparent 70%);pointer-events:none;}
.prof-av-wrap{position:relative;display:inline-block;margin-bottom:2px;}
.prof-av{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--green-d),var(--green-v));display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,.12);box-shadow:0 0 0 6px rgba(34,197,94,.08);}
.prof-av-badge{position:absolute;bottom:0;right:0;width:22px;height:22px;background:var(--green-v);border:2px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;}
.prof-name{font-family:'Sora',sans-serif;font-size:19px;font-weight:900;color:#fff;margin-top:11px;letter-spacing:-.3px;}
.prof-sub{font-size:11px;color:rgba(255,255,255,.35);margin-top:3px;}
.prof-body{padding:20px 18px;}
.stat-row{display:flex;gap:9px;margin-bottom:18px;}
.stat-card{flex:1;background:#fff;border-radius:14px;padding:14px;text-align:center;box-shadow:var(--s1);border:1px solid rgba(0,0,0,.04);}
.stat-n{font-family:'Sora',sans-serif;font-size:22px;font-weight:900;color:var(--green-d);}
.stat-l{font-size:10px;color:var(--ink4);margin-top:2px;font-weight:600;}
.prof-section-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.prof-section-title{font-size:13px;font-weight:800;color:var(--ink);}
.prof-section-count{font-size:10px;font-weight:700;color:var(--green-d);background:var(--green-l);border:1px solid var(--green);border-radius:100px;padding:2px 8px;}
.prof-bookings-empty{display:flex;align-items:center;gap:12px;background:#fff;border-radius:13px;border:1px solid rgba(0,0,0,.04);padding:14px 16px;box-shadow:var(--s1);margin-bottom:20px;}
.prof-list{display:flex;flex-direction:column;gap:9px;}
.prof-row{background:#fff;border-radius:13px;padding:14px 16px;display:flex;align-items:center;gap:12px;border:1px solid rgba(0,0,0,.04);cursor:pointer;transition:all .2s;box-shadow:var(--s1);}
.prof-row:hover{transform:translateX(3px);}
.prof-row-ico{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.prof-row-t{font-size:13px;font-weight:700;color:var(--ink);}
.prof-row-s{font-size:10px;color:var(--ink4);margin-top:1px;font-weight:500;}
.prof-row-arr{margin-left:auto;color:var(--ink4);}

/* ── FACILITY STEPS ── */
.form-steps{display:flex;gap:0;margin:0 18px 16px;border-radius:14px;overflow:hidden;border:1.5px solid var(--border);background:#fff;}
.form-step{flex:1;padding:12px 8px;text-align:center;font-size:11px;font-weight:700;color:var(--ink4);cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:3px;border-right:1px solid var(--border);}
.form-step:last-child{border-right:none;}
.form-step.on{background:var(--ink);color:#fff;}
.form-step.done{background:var(--green-l);color:var(--green-d);}
.form-step-num{width:20px;height:20px;border-radius:50%;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.15);margin-bottom:1px;}
.form-step.on .form-step-num{background:rgba(255,255,255,.2);}
.form-step.done .form-step-num{background:var(--green-v);color:#fff;}
/* ── COURT CARDS ── */
.court-card{background:#fff;border-radius:var(--r2);border:1.5px solid var(--border);margin-bottom:12px;overflow:hidden;box-shadow:var(--s1);}
.court-card-header{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;background:var(--bg);border-bottom:1px solid var(--border);}
.court-card-title{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:var(--ink);}
.court-card-body{padding:14px 15px;}
.court-sport-mini{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}
.court-sport-btn{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:100px;border:1.5px solid var(--border);font-size:10px;font-weight:700;color:var(--ink4);background:#fff;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;}
.court-sport-btn.on{border-color:var(--green);background:var(--green-l);color:var(--green-d);}
.court-remove-btn{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#DC2626;background:#FEF2F2;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;font-family:'Inter',sans-serif;}
.add-court-btn{width:100%;background:transparent;border:2px dashed var(--border);border-radius:var(--r2);padding:14px;font-size:13px;font-weight:700;color:var(--ink4);cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;margin-bottom:13px;}
.add-court-btn:hover{border-color:var(--green);color:var(--green-d);background:var(--green-l);}
.facility-summary{background:linear-gradient(135deg,var(--ink),#1e2738);border-radius:var(--r2);padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;}
.facility-summary-ico{width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.facility-summary-name{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:#fff;}
.facility-summary-sub{font-size:10px;color:rgba(255,255,255,.4);margin-top:2px;}
.facility-summary-edit{margin-left:auto;font-size:10px;font-weight:700;color:var(--green-v);cursor:pointer;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);border-radius:8px;padding:4px 9px;}

/* ── OWNER TABS ── */
.owner-tabs{display:flex;gap:8px;padding:16px 18px 0;}
.owner-tab{flex:1;padding:10px;border-radius:12px;border:1.5px solid var(--border);background:#fff;font-size:12px;font-weight:700;color:var(--ink4);cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.owner-tab.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.block-slot-row{display:flex;gap:8px;align-items:center;background:#fff;border-radius:12px;border:1px solid var(--border);padding:11px 14px;margin-bottom:9px;}
.block-slot-time{flex:1;font-size:13px;font-weight:600;color:var(--ink);}
.block-slot-reason{font-size:10px;color:var(--ink4);margin-top:2px;}
.block-slot-badge{font-size:9px;font-weight:800;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:100px;padding:3px 8px;}
.block-add-row{display:flex;gap:8px;margin-top:4px;}
.block-time-input{flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:11px;font-family:'Inter',sans-serif;font-size:12px;color:var(--ink);outline:none;}
.block-add-btn{background:var(--ink);color:#fff;border:none;border-radius:11px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;display:flex;align-items:center;gap:5px;}
.break-row{display:flex;gap:7px;align-items:center;margin-bottom:9px;}
.break-label{font-size:11px;font-weight:600;color:var(--ink3);width:36px;}
.break-remove{width:28px;height:28px;border-radius:8px;background:#FEF2F2;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.amenity-grid{display:flex;flex-wrap:wrap;gap:7px;}
.amenity-toggle{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:100px;border:1.5px solid var(--border);cursor:pointer;font-size:11px;font-weight:600;color:var(--ink3);background:#fff;transition:all .2s;font-family:'Inter',sans-serif;}
.amenity-toggle.on{background:var(--green-l);border-color:var(--green);color:var(--green-d);}
.price-grid{display:flex;flex-wrap:wrap;gap:9px;}
.price-grid .fg{flex:1;min-width:120px;}
.slot-dur-opts{display:flex;gap:7px;}
.slot-dur-opt{flex:1;padding:10px;border:1.5px solid var(--border);border-radius:12px;text-align:center;cursor:pointer;font-size:12px;font-weight:700;color:var(--ink3);background:#fff;transition:all .2s;}
.slot-dur-opt.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.info-note{display:flex;align-items:flex-start;gap:7px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:9px 12px;font-size:11px;color:#92400E;line-height:1.5;margin-top:8px;}

/* ── OWNER ── */
.owner{background:var(--bg);overflow-y:auto;padding-bottom:88px;}
.owner-head{background:var(--ink);padding:50px 18px 26px;position:relative;overflow:hidden;}
.owner-head::after{content:'';position:absolute;bottom:-18px;left:0;right:0;height:36px;background:var(--bg);border-radius:22px 22px 0 0;}
.owner-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:900;color:#fff;letter-spacing:-.3px;margin-top:10px;}
.owner-sub{font-size:11px;color:rgba(255,255,255,.35);margin-top:3px;}
.owner-body{padding:20px 17px 90px;}
.form-block{background:#fff;border-radius:var(--r);padding:18px;box-shadow:var(--s1);border:1px solid rgba(0,0,0,.04);margin-bottom:13px;}
.form-block-t{font-size:10px;font-weight:800;color:var(--ink4);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;}
.fg{margin-bottom:13px;}
.fg:last-child{margin-bottom:0;}
.flbl{font-size:11px;font-weight:700;color:var(--ink2);margin-bottom:5px;display:block;}
.finput{width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:12px;font-family:'Inter',sans-serif;font-size:13px;color:var(--ink);outline:none;transition:border-color .2s;font-weight:400;}
.finput:focus{border-color:var(--green);}
.fta{resize:none;height:72px;}
.time-pair{display:flex;gap:10px;}
.time-pair .fg{flex:1;}
.sport-toggles{display:flex;flex-wrap:wrap;gap:7px;}
.stoggle{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:100px;border:1.5px solid var(--border);cursor:pointer;font-size:12px;font-weight:700;color:var(--ink3);background:#fff;transition:all .2s;font-family:'Inter',sans-serif;}
.stoggle.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.photo-drop{border:2px dashed var(--border);border-radius:var(--r2);padding:26px 18px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;background:#FAFAFA;}
.photo-drop:hover{border-color:var(--green);background:var(--green-l);}
.photo-drop.has-img{border:none;padding:0;}
.photo-preview-img{width:100%;height:170px;object-fit:cover;border-radius:var(--r2);display:block;}
.photo-change-btn{position:absolute;bottom:9px;right:9px;display:flex;align-items:center;gap:5px;background:rgba(0,0,0,.65);color:#fff;font-size:10px;font-weight:700;padding:5px 11px;border-radius:100px;cursor:pointer;backdrop-filter:blur(4px);font-family:'Inter',sans-serif;}
.file-hidden{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.upload-ico-wrap{width:48px;height:48px;border-radius:14px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;}
.upload-t{font-size:13px;font-weight:700;color:var(--ink2);}
.upload-s{font-size:11px;color:var(--ink4);margin-top:4px;line-height:1.5;}

/* ── MATCH TABS ── */
.match-tabs{display:flex;gap:8px;padding:0 18px;margin-bottom:4px;}
.match-tab{flex:1;padding:10px;border-radius:12px;border:1.5px solid var(--border);background:#fff;font-size:12px;font-weight:700;color:var(--ink4);cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.match-tab.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.player-style-badge{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:800;padding:3px 8px;border-radius:100px;text-transform:uppercase;letter-spacing:.5px;}
.player-style-badge.casual{background:#DBEAFE;color:#1D4ED8;}
.player-style-badge.competitive{background:#FEF3C7;color:#B45309;}
.mc-position{font-size:10px;color:var(--ink4);font-weight:600;margin-top:2px;}
/* ── TEAM CHALLENGE CARDS ── */
.tc{background:#fff;border-radius:var(--r);box-shadow:var(--s1);border:1px solid rgba(0,0,0,.05);margin-bottom:13px;overflow:hidden;}
.tc-banner{height:6px;width:100%;}
.tc-body{padding:14px 16px;}
.tc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;}
.tc-team{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-.2px;}
.tc-format-tag{font-size:10px;font-weight:700;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:3px 9px;color:var(--ink3);}
.tc-detail{display:flex;flex-direction:column;gap:5px;margin-bottom:11px;}
.tc-detail-row{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ink4);font-weight:500;}
.tc-captain-row{display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:10px;padding:9px 12px;margin-bottom:11px;}
.tc-captain-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--green-d),var(--green-v));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;}
.tc-captain-name{font-size:12px;font-weight:700;color:var(--ink);}
.tc-phone{font-size:11px;color:var(--ink4);margin-top:1px;}
.tc-accept-row{display:flex;gap:8px;}
.tc-reject{flex:1;border:1.5px solid var(--border);background:#fff;border-radius:100px;padding:9px;font-size:12px;font-weight:700;color:var(--ink3);cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;}
.tc-accept{flex:2;background:var(--green-v);border:none;border-radius:100px;padding:9px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:5px;}
.tc-accept:hover{background:var(--green-d);}
.tc-challenge-btn{width:100%;background:var(--ink);border:none;border-radius:100px;padding:11px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.tc-challenge-btn:hover{background:#1e2738;}
.tc-challenge-btn.sent{background:transparent;border:1.5px solid var(--ink);color:var(--ink);}
.tc-pending-note{font-size:10px;color:var(--ink4);text-align:center;margin-top:7px;display:flex;align-items:center;justify-content:center;gap:4px;}

/* ── AUTH ── */
.auth-screen{min-height:100svh;background:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;}
.auth-logo{font-family:'Sora',sans-serif;font-size:42px;font-weight:900;color:#fff;letter-spacing:-2px;margin-bottom:6px;text-align:center;}
.auth-logo em{color:#00ff78;font-style:normal;text-shadow:0 0 14px rgba(0,255,120,.6);}
.auth-tagline{font-size:12px;color:rgba(255,255,255,.3);text-align:center;margin-bottom:32px;letter-spacing:.5px;}
.auth-card{background:#fff;border-radius:24px;padding:24px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3);}
.auth-tabs{display:flex;background:var(--bg);border-radius:12px;padding:3px;margin-bottom:20px;}
.auth-tab{flex:1;padding:9px;text-align:center;border-radius:10px;font-size:13px;font-weight:700;color:var(--ink4);cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;border:none;background:transparent;}
.auth-tab.on{background:#fff;color:var(--ink);box-shadow:0 2px 8px rgba(0,0,0,.1);}
.auth-field{margin-bottom:12px;}
.auth-label{font-size:11px;font-weight:700;color:var(--ink2);margin-bottom:5px;display:block;}
.auth-input{width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:12px;font-family:'Inter',sans-serif;font-size:15px;color:var(--ink);outline:none;transition:border-color .2s;box-sizing:border-box;}
.auth-input:focus{border-color:#00ff78;}
.auth-role-row{display:flex;gap:8px;margin-bottom:12px;}
.auth-role-btn{flex:1;padding:10px;border:1.5px solid var(--border);border-radius:12px;font-size:12px;font-weight:700;color:var(--ink4);cursor:pointer;font-family:'Inter',sans-serif;background:#fff;transition:all .2s;text-align:center;}
.auth-role-btn.on{border-color:var(--green);background:var(--green-l);color:var(--green-d);}
.auth-submit{width:100%;background:#00ff78;border:none;border-radius:100px;padding:15px;font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:var(--ink);cursor:pointer;margin-top:4px;transition:all .22s;}
.auth-submit:hover{background:#00e56b;}
.auth-submit:disabled{opacity:.5;cursor:not-allowed;}
.auth-error{background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:10px 13px;font-size:12px;color:#DC2626;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px;}

/* ── NAV ── */
.navbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:420px;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-top:1px solid var(--border);display:flex;padding:8px 0 22px;z-index:100;box-shadow:0 -6px 26px rgba(0,0,0,.08);}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:2px 0;transition:all .18s;}
.nav-ico-wrap{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all .22s;}
.nav-item.on .nav-ico-wrap{background:var(--green-l);}
.nav-lbl{font-size:10px;font-weight:700;color:var(--ink4);}
.nav-item.on .nav-lbl{color:var(--green-d);}

/* ── TOAST ── */
.toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:11px 20px;border-radius:100px;font-size:12px;font-weight:600;z-index:9999;box-shadow:var(--s3);animation:tin .22s ease;white-space:nowrap;max-width:300px;text-align:center;display:flex;align-items:center;gap:7px;}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(-10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

.empty{text-align:center;padding:52px 24px;}
.empty-ico-wrap{width:64px;height:64px;border-radius:18px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
.empty-t{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:var(--ink2);letter-spacing:-.2px;}
.empty-s{font-size:13px;color:var(--ink4);margin-top:5px;line-height:1.5;}

/* ── COURT PICKER ── */
.court-picker-banner{background:linear-gradient(135deg,var(--ink),#1a2540);padding:16px 18px;border-radius:var(--r2);margin-bottom:14px;}
.court-picker-title{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:#fff;margin-bottom:3px;}
.court-picker-sub{font-size:11px;color:rgba(255,255,255,.4);}
.court-pick-cards{display:flex;flex-direction:column;gap:9px;}
.court-pick-card{background:#fff;border-radius:var(--r2);border:1.5px solid var(--border);padding:13px 15px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:12px;box-shadow:var(--s1);}
.court-pick-card:hover{border-color:var(--green);transform:translateX(2px);}
.court-pick-card.sel{border-color:var(--green);background:var(--green-l);}
.court-pick-ico{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.court-pick-name{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:var(--ink);}
.court-pick-meta{display:flex;gap:8px;margin-top:3px;flex-wrap:wrap;}
.court-pick-tag{font-size:10px;color:var(--ink4);font-weight:600;display:flex;align-items:center;gap:3px;}
.court-pick-price{font-size:11px;font-weight:800;color:var(--green-d);margin-left:auto;}
.court-pick-arr{color:var(--ink4);}
.court-pick-card.sel .court-pick-arr{color:var(--green-d);}
/* ── RATING MODAL ── */
.rating-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:200;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px);}
.rating-sheet{background:#fff;border-radius:24px 24px 0 0;padding:28px 24px 44px;width:100%;max-width:420px;animation:slideup .3s ease;}
@keyframes slideup{from{transform:translateY(100%);}to{transform:translateY(0);}}
.rating-ico{width:56px;height:56px;border-radius:16px;background:var(--green-l);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
.rating-title{font-family:'Sora',sans-serif;font-size:18px;font-weight:900;color:var(--ink);text-align:center;letter-spacing:-.3px;}
.rating-sub{font-size:13px;color:var(--ink4);text-align:center;margin-top:6px;line-height:1.5;}
.rating-stars{display:flex;justify-content:center;gap:10px;margin:20px 0;}
.rating-star{cursor:pointer;transition:transform .15s;}
.rating-star:hover{transform:scale(1.2);}
.rating-labels{display:flex;justify-content:space-between;font-size:10px;color:var(--ink4);font-weight:600;margin-top:-10px;margin-bottom:16px;}
.rating-textarea{width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:12px;font-family:'Inter',sans-serif;font-size:13px;color:var(--ink);outline:none;resize:none;height:72px;transition:border-color .2s;}
.rating-textarea:focus{border-color:var(--green);}
.rating-submit{width:100%;background:var(--green-v);border:none;border-radius:100px;padding:15px;font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:var(--ink);cursor:pointer;margin-top:12px;transition:all .22s;}
.rating-submit:hover{background:var(--green-d);color:#fff;}
.rating-skip{width:100%;background:transparent;border:none;font-size:12px;font-weight:600;color:var(--ink4);cursor:pointer;margin-top:8px;font-family:'Inter',sans-serif;}
/* ── LATE BOOKING ── */
.late-badge{display:inline-flex;align-items:center;gap:5px;background:#FEF3C7;border:1px solid #FDE68A;color:#92400E;font-size:10px;font-weight:700;padding:4px 10px;border-radius:100px;}

/* ── TIME FILTER ── */
.filter-panel{background:#fff;border-radius:var(--r);box-shadow:var(--s3);border:1px solid var(--border);margin:0 18px 12px;padding:16px;animation:scaleIn .2s ease;}
.filter-panel-title{font-size:11px;font-weight:800;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
.filter-clear{font-size:11px;font-weight:700;color:var(--green-d);cursor:pointer;}
.time-filter-row{display:flex;gap:8px;align-items:center;margin-bottom:10px;}
.time-filter-label{font-size:11px;font-weight:600;color:var(--ink3);width:28px;}
.time-filter-select{flex:1;padding:9px 12px;border:1.5px solid var(--border);border-radius:10px;font-family:'Inter',sans-serif;font-size:12px;color:var(--ink);outline:none;background:#fff;cursor:pointer;}
.time-filter-select:focus{border-color:var(--green);}
.filter-active-badge{display:inline-flex;align-items:center;gap:4px;background:var(--green-l);border:1px solid var(--green);color:var(--green-d);font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;}
/* ── BOOKING LIMIT ── */
.booking-limit-note{display:flex;align-items:center;gap:6px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:9px 13px;margin-bottom:10px;font-size:11px;color:#92400E;font-weight:600;}
/* ── PLAYER COUNT PRICING ── */
.player-count-row{display:flex;align-items:center;gap:10px;background:var(--bg);border-radius:12px;padding:12px 14px;margin-bottom:10px;}
.player-count-label{font-size:12px;font-weight:700;color:var(--ink2);flex:1;}
.player-count-ctrl{display:flex;align-items:center;gap:10px;}
.pcc-btn{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;font-weight:700;color:var(--ink);}
.pcc-val{font-size:15px;font-weight:800;color:var(--ink);min-width:20px;text-align:center;}
.price-calc-row{display:flex;justify-content:space-between;align-items:center;background:var(--green-l);border:1px solid var(--green);border-radius:10px;padding:10px 14px;margin-bottom:10px;}
.price-calc-label{font-size:12px;font-weight:600;color:var(--green-d);}
.price-calc-total{font-size:16px;font-weight:900;color:var(--green-d);font-family:'Sora',sans-serif;}

.fade{animation:fadeup .22s ease;}
@keyframes fadeup{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}

/* ── OWNER DASHBOARD ── */
.odash-head{background:var(--ink);padding:52px 18px 24px;position:relative;overflow:hidden;}
.odash-head-glow{position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 30%,rgba(249,115,22,.12) 0%,transparent 70%);pointer-events:none;}
.odash-greeting{font-size:11px;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px;}
.odash-title{font-family:'Sora',sans-serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:-.3px;}
.odash-title em{color:#FB923C;font-style:normal;}
.odash-sub{font-size:12px;color:rgba(255,255,255,.35);margin-top:4px;}
.odash-stats{display:flex;gap:8px;margin-top:18px;}
.odash-stat{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 10px;text-align:center;}
.odash-stat-n{font-family:'Sora',sans-serif;font-size:20px;font-weight:900;color:#fff;}
.odash-stat-l{font-size:9px;color:rgba(255,255,255,.35);margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
.odash-tabs{display:flex;gap:8px;padding:16px 18px 0;}
.odash-tab{flex:1;padding:10px;border-radius:12px;border:1.5px solid var(--border);background:#fff;font-size:12px;font-weight:700;color:var(--ink4);cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.odash-tab.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.odash-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px;}
.odash-ground-card{background:#fff;border-radius:var(--r2);border:1px solid rgba(0,0,0,.05);box-shadow:var(--s1);overflow:hidden;}
.odash-ground-img{width:100%;height:120px;object-fit:cover;background:var(--border2);}
.odash-ground-img-placeholder{width:100%;height:120px;background:linear-gradient(135deg,var(--ink),#2D3448);display:flex;align-items:center;justify-content:center;}
.odash-ground-body{padding:13px 15px;}
.odash-ground-name{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:var(--ink);}
.odash-ground-area{font-size:11px;color:var(--ink4);margin-top:2px;display:flex;align-items:center;gap:4px;}
.odash-ground-footer{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border2);}
.odash-ground-status{font-size:10px;font-weight:700;border-radius:100px;padding:3px 10px;}
.odash-ground-status.live{background:#DCFCE7;color:#15803D;}
.odash-ground-status.pending{background:#FEF3C7;color:#D97706;}
.odash-ground-status.review{background:#DBEAFE;color:#1D4ED8;}
.odash-booking-card{background:#fff;border-radius:var(--r2);border:1px solid rgba(0,0,0,.05);box-shadow:var(--s1);padding:14px 16px;display:flex;flex-direction:column;gap:8px;}
.odash-booking-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
.odash-booking-ground{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:var(--ink);}
.odash-booking-court{font-size:10px;color:var(--ink4);margin-top:1px;}
.odash-bkstat-row{display:flex;gap:0;border-radius:10px;overflow:hidden;border:1px solid var(--border);margin:10px 0 8px;}
.odash-bkstat{flex:1;padding:8px 6px;text-align:center;background:#fff;}
.odash-bkstat:not(:last-child){border-right:1px solid var(--border);}
.odash-bkstat-n{font-family:'Sora',sans-serif;font-size:14px;font-weight:900;color:var(--ink);}
.odash-bkstat-l{font-size:9px;color:var(--ink4);margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;}
.odash-list-btn{width:100%;background:var(--ink);color:#fff;border:none;border-radius:13px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;}
.odash-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:44px 20px;color:var(--ink4);}
.odash-empty-ico{width:52px;height:52px;border-radius:16px;background:var(--border2);display:flex;align-items:center;justify-content:center;}
.odash-empty-t{font-size:13px;font-weight:700;color:var(--ink2);}
.odash-empty-s{font-size:11px;color:var(--ink4);text-align:center;line-height:1.5;}

/* ── BOOKING HISTORY ── */
.bh-head{background:var(--ink);padding:52px 18px 18px;display:flex;align-items:center;gap:13px;}
.bh-back{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
.bh-title{font-family:'Sora',sans-serif;font-size:18px;font-weight:900;color:#fff;}
.bh-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px;}
.bh-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:60px 20px;color:var(--ink4);}
.bh-empty-ico{width:56px;height:56px;border-radius:18px;background:var(--border2);display:flex;align-items:center;justify-content:center;}
.bh-empty-t{font-size:14px;font-weight:700;color:var(--ink2);}
.bh-empty-s{font-size:12px;color:var(--ink4);text-align:center;line-height:1.5;}
.bh-card{background:#fff;border-radius:var(--r2);border:1px solid rgba(0,0,0,.05);box-shadow:var(--s1);padding:14px 16px;display:flex;flex-direction:column;gap:8px;}
.bh-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
.bh-ground{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:var(--ink);flex:1;}
.bh-status{font-size:10px;font-weight:700;border-radius:100px;padding:3px 10px;flex-shrink:0;}
.bh-status.confirmed{background:#DCFCE7;color:#15803D;}
.bh-status.pending{background:#FEF3C7;color:#D97706;}
.bh-status.cancelled{background:#FEE2E2;color:#DC2626;}
.bh-meta{display:flex;gap:14px;flex-wrap:wrap;}
.bh-meta-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink3);font-weight:500;}
.bh-divider{height:1px;background:var(--border2);}
.bh-bottom{display:flex;align-items:center;justify-content:space-between;}
.bh-ref{font-size:10px;color:var(--ink4);font-weight:600;font-family:'Sora',sans-serif;}
.bh-price{font-family:'Sora',sans-serif;font-size:16px;font-weight:900;color:var(--green-d);}
.bh-loading{display:flex;align-items:center;justify-content:center;padding:40px;color:var(--ink4);font-size:13px;gap:8px;}
.bh-cancel-btn{font-size:11px;font-weight:700;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;border-radius:100px;padding:4px 12px;cursor:pointer;font-family:'Inter',sans-serif;}

/* ── CANCEL DIALOG ── */
.cancel-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center;}
.cancel-sheet{background:#fff;border-radius:22px 22px 0 0;padding:24px 22px 44px;width:100%;max-width:430px;}
.cancel-title{font-family:'Sora',sans-serif;font-size:17px;font-weight:900;color:var(--ink);margin-bottom:6px;}
.cancel-sub{font-size:12px;color:var(--ink4);margin-bottom:22px;line-height:1.55;}
.cancel-actions{display:flex;gap:10px;}
.cancel-no{flex:1;background:var(--bg);border:1.5px solid var(--border);color:var(--ink);border-radius:13px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;}
.cancel-yes{flex:1;background:#EF4444;border:none;color:#fff;border-radius:13px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;}

/* ── PROFILE EDIT BTN ── */
.prof-edit-btn{position:absolute;top:56px;right:18px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:11px;font-weight:700;border-radius:100px;padding:5px 13px;cursor:pointer;font-family:'Inter',sans-serif;}

/* ── STATUS TOGGLE ── */
.status-toggle{display:flex;align-items:center;gap:5px;padding:5px 13px;border-radius:100px;border:none;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;}
.status-toggle.live{background:#DCFCE7;color:#15803D;}
.status-toggle.paused{background:#FEF3C7;color:#D97706;}

/* ── DARK MODE ── */
.app.dark{background:#060B12 !important;}
.app.dark .home-head{background:#060B12 !important;}
.app.dark .prof-head{background:#060B12 !important;}
.app.dark .match-head{background:#060B12 !important;}
.app.dark .exp-head{background:#060B12 !important;}
.app.dark .home{background:#0A0E1A !important;}
.app.dark .profile{background:#0A0E1A !important;}
.app.dark .match{background:#0A0E1A !important;}
.app.dark .explore{background:#0A0E1A !important;}
.app.dark .hname,.app.dark .match-title,.app.dark .exp-title,.app.dark .prof-name{color:#F1F5F9 !important;}
.app.dark .hgreet,.app.dark .hloc,.app.dark .match-sub,.app.dark .exp-sub,.app.dark .prof-sub{color:#94A3B8 !important;}
.app.dark .gcard{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .gcard-name{color:#F1F5F9 !important;}
.app.dark .gcard-area{color:#94A3B8 !important;}
.app.dark .gcard-body{background:#111827 !important;}
.app.dark .gcard-info-item{color:#94A3B8 !important;}
.app.dark .mc{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .mc-name{color:#F1F5F9 !important;}
.app.dark .prof-row{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .prof-row-t{color:#F1F5F9 !important;}
.app.dark .prof-row-s{color:#94A3B8 !important;}
.app.dark .stat-card{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .stat-n{color:#F1F5F9 !important;}
.app.dark .stat-l{color:#94A3B8 !important;}
.app.dark .section-title{color:#F1F5F9 !important;}
.app.dark .navbar{background:#0D1117 !important;border-color:#1E293B !important;}
.app.dark .sport-chip{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .sport-chip-label{color:#94A3B8 !important;}
.app.dark .search-wrap input{color:#F1F5F9 !important;}
.app.dark .detail-sheet{background:#111827 !important;}
.app.dark .detail-hero-name{color:#F1F5F9 !important;}
.app.dark .dstat-val{color:#4ADE80 !important;}
.app.dark .dstat-label{color:#94A3B8 !important;}
.app.dark .detail-desc{color:#CBD5E1 !important;}
.app.dark .detail-sec{color:#F1F5F9 !important;}
.app.dark .slot-card{background:#1E293B !important;border-color:#334155 !important;}
.app.dark .slot-card .slot-time{color:#F1F5F9 !important;}
.app.dark .amenity-chip{background:#1E293B !important;color:#CBD5E1 !important;}
.app.dark .form-block{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .finput{background:#1E293B !important;color:#F1F5F9 !important;border-color:#334155 !important;}
.app.dark .flbl{color:#94A3B8 !important;}
.app.dark .cancel-sheet{background:#111827 !important;}
.app.dark .cancel-no{background:#060B12 !important;border-color:#1E293B !important;color:#F1F5F9 !important;}
.app.dark .bh-card{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .owner-card{background:#111827 !important;border-color:#1E293B !important;}
.app.dark input,.app.dark textarea,.app.dark select{background:#1E293B !important;color:#F1F5F9 !important;border-color:#334155 !important;}
.app.dark input::placeholder,.app.dark textarea::placeholder{color:#64748B !important;}
.app.dark .map-tile-btn{background:rgba(17,24,39,.95) !important;color:#F1F5F9 !important;border-color:#1E293B !important;}
.app.dark .map-popup{background:#111827 !important;}
.app.dark .detail-sheet{background:#111827 !important;border-top:none !important;}
.app.dark .home-head::after{background:#0A0E1A !important;}
.app.dark .match-head::after{background:#0A0E1A !important;}
.app.dark .exp-head::after{background:#0A0E1A !important;}
.app.dark .search-box{background:#1E293B !important;border-color:#334155 !important;}
.app.dark .search-input{background:transparent !important;color:#F1F5F9 !important;}
.app.dark .search-input::placeholder{color:#64748B !important;}
.app.dark .search-box svg{color:#64748B !important;}
.app.dark .match-head::after{background:#0A0E1A !important;}
.app.dark .exp-head::after{background:#0A0E1A !important;}
.app.dark .home-head::after{background:#0A0E1A !important;}
.app.dark .prof-head::after{background:#0A0E1A !important;}
.app.dark .tc{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .tc-team{color:#F1F5F9 !important;}
.app.dark .tc-body{background:#111827 !important;}
.app.dark .tc-top{color:#F1F5F9 !important;}
.app.dark .tc-detail-row{color:#94A3B8 !important;}
.app.dark .tc-banner{opacity:0.5 !important;}
.app.dark .tc-captain-name{color:#F1F5F9 !important;}
.app.dark .tc-phone{color:#94A3B8 !important;}
.app.dark .match-tab-row{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .match-tab{color:#94A3B8 !important;}
.app.dark .match-tab.on{background:#1E293B !important;color:#F1F5F9 !important;}
.app.dark .owner-screen{background:#0A0E1A !important;}
.app.dark .owner-head{background:#060B12 !important;}
.app.dark .owner-head *{color:#F1F5F9 !important;}
.app.dark .form-block{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .form-block-t{color:#F1F5F9 !important;}
.app.dark .finput{background:#1E293B !important;color:#F1F5F9 !important;border-color:#334155 !important;}
.app.dark .finput::placeholder{color:#64748B !important;}
.app.dark .flbl{color:#94A3B8 !important;}
.app.dark .owner-section-btn{background:#111827 !important;border-color:#1E293B !important;color:#94A3B8 !important;}
.app.dark .owner-section-btn.on{background:#1E293B !important;color:#F1F5F9 !important;}
.app.dark .court-pick-card{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .court-pick-name{color:#F1F5F9 !important;}
.app.dark .info-note{background:#1E293B !important;border-color:#334155 !important;color:#CBD5E1 !important;}
.app.dark .slot-dur-opt{background:#111827 !important;border-color:#1E293B !important;color:#94A3B8 !important;}
.app.dark .slot-dur-opt.on{background:#1E293B !important;color:#F1F5F9 !important;}
.app.dark .break-row{background:#1E293B !important;border-color:#334155 !important;}
.app.dark .book-btn{background:#16A34A !important;color:#fff !important;}

/* dark mode toggle row */
.dm-section{background:var(--card);border-radius:var(--r2);border:1px solid var(--border2);overflow:hidden;margin-bottom:12px;}
.dm-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;gap:12px;}
.dm-row+.dm-row{border-top:1px solid var(--border2);}
.dm-row-left{display:flex;align-items:center;gap:12px;}
.dm-row-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.dm-row-t{font-size:14px;font-weight:700;color:var(--ink);}
.dm-row-s{font-size:11px;color:var(--ink4);margin-top:1px;}
.dm-note{font-size:11px;color:var(--ink4);padding:8px 16px 12px;line-height:1.5;}
.dm-toggle{width:42px;height:24px;border-radius:100px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
.dm-toggle.on{background:#22C55E;}
.dm-toggle.off{background:var(--border);}
.dm-toggle::after{content:'';position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;}
.dm-toggle.on::after{left:21px;}
.dm-toggle.off::after{left:3px;}

/* ── MAP SCREEN ── */
.map-screen{display:flex;flex-direction:column;flex:1;height:calc(100svh - 72px);position:relative;}
.map-pin{width:22px;height:22px;background:#22C55E;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(34,197,94,.5);}
.map-user-dot{width:14px;height:14px;background:#3B82F6;border:3px solid #fff;border-radius:50%;animation:pulse-blue 2s infinite;}
@keyframes pulse-blue{0%{box-shadow:0 0 0 0 rgba(59,130,246,.6);}100%{box-shadow:0 0 0 16px rgba(59,130,246,0);}}
.map-tile-btn{position:absolute;top:14px;right:14px;z-index:999;background:rgba(255,255,255,.95);border:1px solid rgba(0,0,0,.12);border-radius:100px;padding:7px 14px;font-size:12px;font-weight:700;font-family:'Inter',sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.15);}
.map-popup{position:absolute;bottom:14px;left:14px;right:14px;z-index:999;background:#fff;border-radius:18px;padding:16px;box-shadow:0 8px 32px rgba(0,0,0,.2);}
.map-popup-close{position:absolute;top:12px;right:12px;width:26px;height:26px;border-radius:50%;background:var(--border2);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink3);}
.map-popup-name{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:var(--ink);margin-bottom:4px;padding-right:28px;}
.map-popup-area{font-size:11px;color:var(--ink4);display:flex;align-items:center;gap:4px;margin-bottom:10px;}
.map-popup-meta{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
.map-popup-rating{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:var(--ink);}
.map-popup-price{font-size:12px;color:var(--ink3);font-weight:600;}
.map-popup-book{width:100%;background:var(--green-d);color:#fff;border:none;border-radius:12px;padding:11px;font-size:13px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;}

/* ── FORGOT PASSWORD ── */
.forgot-link{font-size:11px;font-weight:700;color:var(--blue);cursor:pointer;text-decoration:underline;}
.forgot-panel{background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px;margin-bottom:4px;}
.forgot-panel-title{font-size:12px;font-weight:800;color:#1E40AF;margin-bottom:10px;}
.forgot-sent{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--green-d);}
.forgot-cancel{flex:1;background:var(--border2);border:1px solid var(--border);border-radius:10px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;color:var(--ink3);}
.forgot-submit{flex:2;background:var(--blue);border:none;border-radius:10px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;color:#fff;}
.forgot-submit:disabled{opacity:.4;cursor:not-allowed;}

/* ── SHARE BOOKING BUTTON ── */
.share-booking-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:transparent;border:1.5px solid var(--border);border-radius:14px;padding:12px;font-size:13px;font-weight:700;color:var(--ink3);cursor:pointer;font-family:'Inter',sans-serif;margin-top:10px;}
.share-booking-btn:active{background:var(--border2);}

/* ── REVENUE TRACKER ── */
.rev-tracker-row{display:flex;gap:8px;padding:0 18px 14px;}
.rev-card{flex:1;background:rgba(255,255,255,.12);border-radius:12px;padding:10px 8px;text-align:center;border:1px solid rgba(255,255,255,.08);}
.rev-label{font-size:10px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
.rev-val{font-size:13px;font-weight:800;color:#fff;}

/* ── OWNER REGISTER ── */
.reg-header{padding:0 0 14px;}
.reg-empty{display:flex;flex-direction:column;align-items:center;padding:40px 0;color:var(--ink4);}
.reg-table{border-radius:12px;overflow:hidden;border:1px solid var(--border);margin-bottom:14px;}
.reg-row{display:flex;align-items:stretch;}
.reg-row-head{background:#F8FAFC;border-bottom:1.5px solid var(--border);}
.reg-row.even{background:#fff;}
.reg-row.odd{background:#F9FAFB;}
.reg-col{padding:10px 8px;font-size:11px;color:var(--ink3);}
.reg-col-time{width:60px;flex-shrink:0;border-right:1px solid var(--border2);}
.reg-col-ground{flex:1.2;border-right:1px solid var(--border2);}
.reg-col-player{flex:1.5;border-right:1px solid var(--border2);}
.reg-col-price{flex:1;text-align:right;}
.reg-row-head .reg-col{font-size:10px;font-weight:800;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;}
.reg-status{font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;display:inline-block;margin-top:3px;}
.reg-status.confirmed{background:var(--green-l);color:var(--green-d);}
.reg-status.cancelled{background:#FEF2F2;color:#DC2626;}
.reg-status.pending{background:#FFF7ED;color:#D97706;}
.reg-totals{background:var(--card);border-radius:12px;border:1px solid var(--border);padding:12px 14px;display:flex;flex-direction:column;gap:8px;}
.reg-total-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--ink3);}
.app.dark .reg-row-head{background:#1E293B !important;}
.app.dark .reg-row.even{background:#111827 !important;}
.app.dark .reg-row.odd{background:#0F172A !important;}
.app.dark .reg-table{border-color:#1E293B !important;}
.app.dark .reg-col{color:#94A3B8 !important;}
.app.dark .reg-totals{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .reg-total-row{color:#94A3B8 !important;}

/* ── GROUND OF THE WEEK ── */
.gotw-card{position:relative;border-radius:18px;overflow:hidden;height:140px;cursor:pointer;margin-bottom:4px;}
.gotw-img{width:100%;height:100%;object-fit:cover;display:block;}
.gotw-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,.25) 100%);}
.gotw-badge{position:absolute;top:12px;left:12px;background:rgba(245,158,11,.95);color:#fff;font-size:10px;font-weight:800;padding:4px 10px;border-radius:100px;letter-spacing:.4px;}
.gotw-content{position:absolute;bottom:12px;left:14px;right:14px;}
.gotw-name{font-family:'Sora',sans-serif;font-size:16px;font-weight:900;color:#fff;margin-bottom:4px;}
.gotw-meta{font-size:11px;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:5px;}

/* ── LEADERBOARD ── */
.ldb-list{display:flex;flex-direction:column;gap:0;background:var(--card);border-radius:14px;border:1px solid var(--border);overflow:hidden;}
.ldb-row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--border2);}
.ldb-row:last-child{border-bottom:none;}
.ldb-rank{width:28px;text-align:center;flex-shrink:0;}
.ldb-rank-num{font-size:12px;font-weight:800;color:var(--ink3);}
.ldb-name{font-size:13px;font-weight:700;color:var(--ink);}
.ldb-city{font-size:11px;color:var(--ink4);margin-top:1px;}
.ldb-badge{background:var(--green-l);color:var(--green-d);font-size:10px;font-weight:800;padding:4px 10px;border-radius:100px;flex-shrink:0;}
.app.dark .ldb-list{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .ldb-row{border-color:#1E293B !important;}
.app.dark .ldb-name{color:#F1F5F9 !important;}
.app.dark .ldb-city{color:#94A3B8 !important;}

/* ── ANNOUNCEMENTS ── */
.ann-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:8px;position:relative;padding-right:36px;}
.ann-msg{font-size:13px;font-weight:600;color:var(--ink2);line-height:1.5;}
.ann-meta{font-size:10px;color:var(--ink4);margin-top:5px;}
.ann-delete{position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:8px;background:var(--border2);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink3);}
.app.dark .ann-card{background:#111827 !important;border-color:#1E293B !important;}
.app.dark .ann-msg{color:#F1F5F9 !important;}

/* ── OWNER BLOCK BUTTON ── */
.odash-block-btn{display:flex;align-items:center;justify-content:center;gap:7px;width:calc(100% - 36px);margin:8px 18px 4px;background:#FEF2F2;border:1.5px solid #FECACA;border-radius:14px;padding:11px;font-size:13px;font-weight:700;color:#DC2626;cursor:pointer;font-family:'Inter',sans-serif;}
.app.dark .odash-block-btn{background:#2D1515 !important;border-color:#7F1D1D !important;color:#FCA5A5 !important;}
`;

/* ─── ICON HELPERS ─── */
const Ico = ({icon:I, size=16, color="currentColor", strokeWidth=2}) =>
  <I size={size} color={color} strokeWidth={strokeWidth}/>;

/* ─── LOCATION PICKER COMPONENT ─── */
function LocationPicker({ lat, lng, onChange, darkMode }) {
  const DEFAULT = [24.8607, 67.0011];
  const [pos, setPos] = useState([lat || DEFAULT[0], lng || DEFAULT[1]]);
  const markerRef = useRef(null);

  const TILE_URL = darkMode
    ? 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const TILE_ATTR = darkMode ? '© CartoDB' : '© OpenStreetMap contributors';

  const pinIcon = L.divIcon({ className:'', html:'<div class="map-pin"></div>', iconSize:[28,36], iconAnchor:[14,36] });

  const handleGPS = () => {
    navigator.geolocation?.getCurrentPosition(
      p => { const c = [p.coords.latitude, p.coords.longitude]; setPos(c); onChange(c[0], c[1]); },
      () => {}
    );
  };

  return (
    <div>
      <div style={{borderRadius:12,overflow:'hidden',height:220,width:'100%',border:'1.5px solid var(--border)'}}>
        <MapContainer
          center={pos} zoom={13}
          style={{height:'100%',width:'100%'}}
          zoomControl={false}
        >
          <TileLayer key={darkMode?'dark':'light'} url={TILE_URL} attribution={TILE_ATTR}/>
          <Marker
            position={pos}
            icon={pinIcon}
            draggable={true}
            ref={markerRef}
            eventHandlers={{
              dragend: () => {
                const m = markerRef.current;
                if (m) { const {lat:la,lng:lo} = m.getLatLng(); const c=[la,lo]; setPos(c); onChange(la,lo); }
              }
            }}
          />
        </MapContainer>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8,gap:10}}>
        <div style={{fontSize:11,color:'var(--ink4)',lineHeight:1.4}}>
          Drag the pin to your ground's exact location
        </div>
        <button
          type="button"
          onClick={handleGPS}
          style={{flexShrink:0,display:'flex',alignItems:'center',gap:5,background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:100,padding:'6px 12px',fontSize:11,fontWeight:700,color:'var(--ink3)',cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap'}}
        >
          <Navigation size={11} strokeWidth={2}/> Use My Location
        </button>
      </div>
    </div>
  );
}

/* ─── MAP SCREEN COMPONENT ─── */
function MapScreen({ grounds, darkMode, onBookGround }) {
  const [tileMode, setTileMode] = useState(() => darkMode ? 'dark' : 'osm');
  const [userPos,  setUserPos]  = useState(null);
  const [selected, setSelected] = useState(null);

  // Sync tile with dark mode changes
  useEffect(() => {
    if (darkMode) setTileMode('dark');
    else setTileMode(prev => prev === 'dark' ? 'osm' : prev);
  }, [darkMode]);

  // Request GPS once on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {} // silently fall back to default Karachi centre
    );
  }, []);

  const TILES = {
    osm:       { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                                                     attr: '© OpenStreetMap contributors' },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
    dark:      { url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',                    attr: '© CartoDB' },
  };

  const greenIcon = L.divIcon({ className:'', html:'<div class="map-pin"></div>',      iconSize:[28,36], iconAnchor:[14,36] });
  const userIcon  = L.divIcon({ className:'', html:'<div class="map-user-dot"></div>', iconSize:[20,20], iconAnchor:[10,10] });

  return (
    <div style={{position:'relative', flex:1, overflow:'hidden', height:'100%'}}>
      <MapContainer
        center={[24.8607, 67.0011]}
        zoom={12}
        style={{height:'100%', width:'100%'}}
        zoomControl={false}
      >
        <TileLayer key={tileMode} url={TILES[tileMode].url} attribution={TILES[tileMode].attr}/>

        {grounds.map(g => g.latitude && g.longitude ? (
          <Marker
            key={g.id}
            position={[g.latitude, g.longitude]}
            icon={greenIcon}
            eventHandlers={{ click: () => setSelected(g) }}
          />
        ) : null)}

        {userPos && <Marker position={userPos} icon={userIcon}/>}
      </MapContainer>

      {/* Satellite toggle — only shown in light mode */}
      {!darkMode && (
        <button className="map-tile-btn"
          onClick={() => setTileMode(t => t === 'satellite' ? 'osm' : 'satellite')}>
          {tileMode === 'satellite' ? '🗺 Map' : '🛰 Satellite'}
        </button>
      )}

      {/* Ground popup card */}
      {selected && (
        <div className="map-popup">
          <button className="map-popup-close" onClick={() => setSelected(null)}>
            <X size={15} strokeWidth={2.5}/>
          </button>
          <div className="map-popup-name">{selected.name}</div>
          <div className="map-popup-area">
            <MapPin size={11} strokeWidth={2}/> {selected.area}
          </div>
          <div className="map-popup-meta">
            {selected.rating && (
              <span className="map-popup-rating">
                <Star size={11} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/> {selected.rating}
              </span>
            )}
            <span className="map-popup-price">from Rs {(selected.priceFrom||2000).toLocaleString()}</span>
          </div>
          <button className="map-popup-book" onClick={() => { onBookGround(selected); setSelected(null); }}>
            Book Now
          </button>
        </div>
      )}
    </div>
  );
}

export default function Outfield() {
  const [screen, setScreen]   = useState("splash");
  const [nav, setNav]         = useState("home");
  const [tabIndex, setTabIndex] = useState(0);
  const [sport, setSport]     = useState("all");
  const [search, setSearch]   = useState("");
  const [ground, setGround]   = useState(null);
  const [slot, setSlot]       = useState(null);
  const [pay, setPay]         = useState("cash");
  const [joined, setJoined]   = useState({});
  const [toast, setToast]     = useState(null);
  const [lfp, setLfp]         = useState(false);
  const [faved, setFaved]     = useState({});
  const [ownerSports, setOwnerSports] = useState([]);
  const [ownerImg, setOwnerImg] = useState(null);
  const [ownerSlotDur, setOwnerSlotDur] = useState("2 hr");
  const [ownerBreaks, setOwnerBreaks] = useState([{from:"13:00",to:"14:00"}]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [ownerAmenities, setOwnerAmenities] = useState([]);
  const [ownerSection, setOwnerSection] = useState("list");
  const [ownerFormStep, setOwnerFormStep] = useState("facility");
  const [ownerCourts, setOwnerCourts] = useState([
    {id:1, name:"Ground 1", sports:[], type:"Outdoor", capacity:"", priceBase:"", pricePeak:"", slotDur:"2 hr", notes:"", pricingType:"fixed"}
  ]);
  const [ownerFacilityName, setOwnerFacilityName] = useState("");
  const [ownerPhone, setOwnerPhone]               = useState("");
  const [ownerLat, setOwnerLat]                   = useState(24.8607);
  const [ownerLng, setOwnerLng]                   = useState(67.0011);
  const [ownerFormError, setOwnerFormError]       = useState("");
  const [heroIdx, setHeroIdx] = useState(0);
  const [court, setCourt]       = useState(null);
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingVal, setRatingVal]     = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingDone, setRatingDone]   = useState(false);
  const [matchTab, setMatchTab]   = useState("players");
  const [teamReqs, setTeamReqs]   = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [timeFilterFrom, setTimeFilterFrom]   = useState("");
  const [timeFilterTo, setTimeFilterTo]       = useState("");
  const [playerCount, setPlayerCount]         = useState(1);
  const [bookingCount, setBookingCount]       = useState(0);
  const [bookingHistory, setBookingHistory]   = useState([]);
  const [bookingHistoryLoading, setBookingHistoryLoading] = useState(false);
  const [myBookings, setMyBookings]           = useState([]);
  const [ownerGrounds, setOwnerGrounds]       = useState([]);
  const [ownerBookings, setOwnerBookings]     = useState([]);
  const [ownerDashLoading, setOwnerDashLoading] = useState(false);
  const [ownerDashTab, setOwnerDashTab]       = useState("grounds");
  const [darkMode, setDarkMode]               = useState(() => localStorage.getItem('otf-dark') === 'true');
  const [autoDarkMode, setAutoDarkMode]       = useState(() => localStorage.getItem('otf-auto-dark') === 'true');
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [editProfileSaving, setEditProfileSaving] = useState(false);
  const [editName, setEditName]               = useState("");
  const [editPhone, setEditPhone]             = useState("");
  const [editCity, setEditCity]               = useState("");
  const [ratingComment, setRatingComment]     = useState("");
  const [showForgotPwd, setShowForgotPwd]     = useState(false);
  const [forgotEmail, setForgotEmail]         = useState("");
  const [forgotSent, setForgotSent]           = useState(false);
  const [favGroundIds, setFavGroundIds]       = useState(new Set());
  const [showFavScreen, setShowFavScreen]     = useState(false);
  const [favGrounds, setFavGrounds]           = useState([]);
  const [ownerRegDate, setOwnerRegDate]       = useState(() => new Date().toISOString().split('T')[0]);
  const [ownerRegBookings, setOwnerRegBookings] = useState([]);
  const [ownerRegLoading, setOwnerRegLoading]   = useState(false);
  // Bug 1 — owner form pill state
  const [ownerFacilityType, setOwnerFacilityType] = useState("Outdoor");
  const [ownerDaysOpen, setOwnerDaysOpen]         = useState(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]);
  const [ownerCancPolicy, setOwnerCancPolicy]     = useState("Flexible");
  const [ownerLateGrace, setOwnerLateGrace]       = useState("Not allowed");
  const [ownerMinAdvance, setOwnerMinAdvance]     = useState("1 hr");
  const [ownerOpenFrom, setOwnerOpenFrom]         = useState("06:00");
  const [ownerOpenTill, setOwnerOpenTill]         = useState("23:00");
  const [ownerArea, setOwnerArea]                 = useState("");
  const [ownerDescription, setOwnerDescription]  = useState("");
  // Bug 5 — exit confirmation for owner form
  const [showOwnerExitConfirm, setShowOwnerExitConfirm] = useState(false);
  // Feature 4 — announcements
  const [ownerAnnouncements, setOwnerAnnouncements] = useState([]);
  const [ownerAnnMsg, setOwnerAnnMsg]             = useState("");
  const [ownerAnnLoading, setOwnerAnnLoading]     = useState(false);
  // Feature 5 — quick block slot sheet
  const [showBlockSheet, setShowBlockSheet]       = useState(false);
  const [blockDate, setBlockDate]                 = useState(() => new Date().toISOString().split('T')[0]);
  const [blockFrom, setBlockFrom]                 = useState("12:00");
  const [blockTo, setBlockTo]                     = useState("14:00");
  const [blockReason, setBlockReason]             = useState("");
  const [blockGroundId, setBlockGroundId]         = useState("");
  // Feature 10 — leaderboard
  const [leaderboard, setLeaderboard]             = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  // Feature 11 — ground of the week
  const [groundOfWeek, setGroundOfWeek]           = useState(null);
  // Real slot system
  const [realSlots, setRealSlots]     = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  // Feature: notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications]         = useState([]);
  const [notifLoading, setNotifLoading]           = useState(false);
  // Feature: city filter
  const [filterCity, setFilterCity]               = useState("all");
  // Feature: photo upload URLs
  const [uploadedImgUrls, setUploadedImgUrls]     = useState([]);
  const [photoUploading, setPhotoUploading]       = useState(false);
  // Feature: owner listing email state
  const [ownerSubmitSuccess, setOwnerSubmitSuccess] = useState(false);
  const MAX_BOOKINGS = 2;
  const [dbGrounds, setDbGrounds]             = useState([]);
  const [bookedSlotKeys, setBookedSlotKeys]   = useState(new Set());
  const [session, setSession]                 = useState(null);
  const [authUser, setAuthUser]               = useState(null);
  const [authMode, setAuthMode]               = useState("login"); // "login" | "signup"
  const [authName, setAuthName]               = useState("");
  const [authPhone, setAuthPhone]             = useState("");
  const [authCity, setAuthCity]               = useState("");
  const [authRole, setAuthRole]               = useState("player");
  const [authEmail, setAuthEmail]             = useState("");
  const [authPassword, setAuthPassword]       = useState("");
  const [authLoading, setAuthLoading]         = useState(false);
  const [authError, setAuthError]             = useState("");
  const [authChecked, setAuthChecked]         = useState(false);
  const [authDob, setAuthDob]                 = useState("");
  const [bookRef]                 = useState("OTF-" + Math.random().toString(36).substring(2,6).toUpperCase());
  const fileRef               = useRef(null);
  const [date, setDate]       = useState(DATES[0]);
  const touchStartX           = useRef(null);
  const touchStartY           = useRef(null);
  const swipeIgnored          = useRef(false);

  // Tab order for swipe navigation
  const TAB_ORDER = ["home","explore","map","match","profile"];

  const handleTouchStart = (e) => {
    swipeIgnored.current = !!e.target.closest('[data-swipe-ignore]');
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (swipeIgnored.current) { swipeIgnored.current = false; return; }
    const mainTabScreens = ['home','explore','match','profile'];
    if (!mainTabScreens.includes(screen)) return;
    if(touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if(Math.abs(dx) > 110 && Math.abs(dx) > Math.abs(dy) * 3.5) {
      const idx = TAB_ORDER.indexOf(nav);
      if(dx < 0 && idx < TAB_ORDER.length - 1) {
        goNav(TAB_ORDER[idx + 1]);
      } else if(dx > 0 && idx > 0) {
        goNav(TAB_ORDER[idx - 1]);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => { const t = setTimeout(() => setScreen("onboard"), 2200); return () => clearTimeout(t); }, []);

  // Prevent zoom on double-tap
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if(meta) {
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    } else {
      const m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(m);
    }
  }, []);

  // Check for existing session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).single()
          .then(({ data }) => { if (data) setAuthUser(data); });
      }
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).single()
          .then(({ data }) => { if (data) setAuthUser(data); });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (screen !== "home") return;
    const t = setInterval(() => setHeroIdx(i => (i+1) % 5), 3600);
    return () => clearInterval(t);
  }, [screen]);

  // Fetch real grounds from Supabase
  useEffect(() => {
    supabase
      .from('grounds')
      .select('*')
      .eq('status', 'live')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped = data.map(g => ({
            id: g.id,
            name: g.name,
            area: g.area,
            city: g.city,
            distance: "—",
            rating: g.rating || 4.5,
            reviews: 0,
            priceFrom: 2000,
            sports: ["cricket","football"],
            amenities: g.amenities ? g.amenities.split(',') : [],
            openFrom: g.open_from || "06:00",
            openTill: g.open_till || "23:00",
            description: g.description,
            img: g.img_url,
            latitude: g.latitude || null,
            longitude: g.longitude || null,
            customImage: null,
            isFacility: false,
            courts: [],
            slots: {"default":[]}
          }));
          setDbGrounds(mapped);
        }
      });
  }, []);

  // Fetch owner dashboard — grounds with nested courts + booking counts
  useEffect(() => {
    if (screen !== "home" || authUser?.role !== "owner" || !session?.user) return;
    setOwnerDashLoading(true);
    supabase
      .from('grounds')
      .select('*, courts(id, bookings(id, status, total_price, booking_date))')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const gList = data || [];
        setOwnerGrounds(gList);
        // Flatten all bookings so header totals still work
        setOwnerBookings(gList.flatMap(g => (g.courts||[]).flatMap(c => c.bookings||[])));
        setOwnerDashLoading(false);
      });
  }, [screen, authUser, session]);

  // Fetch booking history when profile or bookingHistory screen is active
  useEffect(() => {
    if (!["profile","bookingHistory"].includes(screen) || !session?.user) return;
    setBookingHistoryLoading(true);
    supabase
      .from('bookings')
      .select('*, courts(name, grounds(name))')
      .eq('player_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setBookingHistory(data);
        setBookingHistoryLoading(false);
      });
  }, [screen, session]);

  useEffect(() => {
    if (screen !== 'profile' || !session?.user) return;
    supabase.from('bookings').select('*').eq('player_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMyBookings(data); });
  }, [screen, session]);

  // Load favourite ground IDs on login
  useEffect(() => {
    if (!session?.user) return;
    supabase.from('favourites').select('ground_id').eq('user_id', session.user.id)
      .then(({ data }) => { if (data) setFavGroundIds(new Set(data.map(f => f.ground_id))); });
  }, [session]);

  // Load favourite grounds list when fav screen opens
  useEffect(() => {
    if (!showFavScreen || !session?.user) return;
    supabase
      .from('favourites')
      .select('ground_id, grounds(id, name, area, rating, img_url)')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        if (data) setFavGrounds(data.map(f => f.grounds).filter(Boolean));
      });
  }, [showFavScreen, session]);

  // Load owner register bookings
  useEffect(() => {
    if (screen !== 'owner' || !session?.user || authUser?.role !== 'owner') return;
    setOwnerRegLoading(true);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const [y, m, d] = ownerRegDate.split('-').map(Number);
    const dateLabel = `${months[m-1]} ${d}`;
    supabase
      .from('courts')
      .select('id, name, grounds!inner(id, name, owner_id)')
      .eq('grounds.owner_id', session.user.id)
      .then(async ({ data: courts }) => {
        const courtIds = (courts || []).map(c => c.id);
        if (courtIds.length === 0) { setOwnerRegBookings([]); setOwnerRegLoading(false); return; }
        const { data: bks } = await supabase
          .from('bookings')
          .select('*, users!player_id(name, phone)')
          .in('court_id', courtIds)
          .eq('booking_date', dateLabel)
          .order('start_time', { ascending: true });
        const withCourt = (bks || []).map(b => ({
          ...b,
          courtName: courts.find(c => c.id === b.court_id)?.name || '—',
          groundName: courts.find(c => c.id === b.court_id)?.grounds?.name || '—',
        }));
        setOwnerRegBookings(withCourt);
        setOwnerRegLoading(false);
      });
  }, [screen, ownerRegDate, session, authUser]);

  // Ground of the week — fetch highest rated live ground
  useEffect(() => {
    supabase.from('grounds').select('*').eq('status','live').order('rating',{ascending:false}).limit(1)
      .then(({ data }) => { if (data && data[0]) setGroundOfWeek(data[0]); });
  }, []);

  // Sync city filter default when authUser loads
  useEffect(() => {
    if (authUser?.city) setFilterCity(authUser.city);
  }, [authUser]);

  // fetchRealSlots: generate + overlay bookings/blocks from Supabase
  const fetchRealSlots = async (groundObj, courtObj, selectedDate) => {
    setSlotsLoading(true);
    const activeGround = groundObj || ground;
    const activeCourt  = courtObj  || court;
    if (!activeGround) { setSlotsLoading(false); return; }

    const openFrom  = activeGround.openFrom || activeGround.open_from || '06:00';
    const openTill  = activeGround.openTill || activeGround.open_till || '23:00';
    const duration  = activeCourt?.slot_duration_mins || 120;
    const priceBase = activeCourt?.price_base || activeCourt?.priceBase || activeGround.priceFrom || 2000;
    const pricePeak = activeCourt?.price_peak || activeCourt?.pricePeak || priceBase;

    let generated = generateTimeSlots(openFrom, openTill, duration, priceBase, pricePeak);

    const courtId   = activeCourt?.id;
    const isRealId  = courtId && typeof courtId === 'string' && courtId.includes('-');

    if (isRealId && selectedDate) {
      const [bookedRes, blockedRes] = await Promise.all([
        supabase.from('bookings').select('start_time').eq('court_id', courtId).eq('booking_date', selectedDate).eq('status', 'confirmed'),
        supabase.from('blocked_slots').select('start_time').eq('court_id', courtId).eq('date', selectedDate)
      ]);
      const bookedTimes  = new Set((bookedRes.data  || []).map(b => b.start_time));
      const blockedTimes = new Set((blockedRes.data || []).map(b => b.start_time));
      generated = generated.map(s => ({
        ...s,
        booked:  bookedTimes.has(s.startTime),
        blocked: blockedTimes.has(s.startTime)
      }));
    }

    setRealSlots(generated);
    setSlotsLoading(false);
  };

  // Re-fetch whenever date or court changes while on the detail screen
  useEffect(() => {
    if (screen === 'detail' && ground) {
      fetchRealSlots(ground, court, date);
    }
  }, [date, court]);

  // Leaderboard — top 10 active players this month
  useEffect(() => {
    if (nav !== 'match') return;
    setLeaderboardLoading(true);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const monthLabels = Array.from({length:now.getDate()},(_,i)=>{
      const d = new Date(now.getFullYear(),now.getMonth(),i+1);
      return `${months[d.getMonth()]} ${d.getDate()}`;
    });
    supabase
      .from('bookings')
      .select('player_id, users!player_id(name, city)')
      .in('booking_date', monthLabels)
      .eq('status','confirmed')
      .then(({ data }) => {
        if (!data) { setLeaderboardLoading(false); return; }
        const counts = {};
        data.forEach(b => {
          const k = b.player_id;
          if (!counts[k]) counts[k] = { name: b.users?.name||'Player', city: b.users?.city||'', count: 0 };
          counts[k].count++;
        });
        const sorted = Object.entries(counts)
          .sort((a,b)=>b[1].count-a[1].count)
          .slice(0,10)
          .map(([id,v])=>({id,...v}));
        setLeaderboard(sorted);
        setLeaderboardLoading(false);
      });
  }, [nav]);

  // Announcements — load for owner
  useEffect(() => {
    if (screen !== 'owner' || !session?.user || authUser?.role !== 'owner') return;
    supabase.from('announcements').select('*').eq('owner_id', session.user.id)
      .order('created_at',{ascending:false}).limit(10)
      .then(({ data }) => { if (data) setOwnerAnnouncements(data); });
  }, [screen, session, authUser]);

  // Bug 5 — Android back button: push history state on screen change
  useEffect(() => {
    window.history.pushState({ screen }, '');
  }, [screen]);

  useEffect(() => {
    const handler = (e) => {
      const prev = e.state?.screen;
      if (screen === 'owner') { setShowOwnerExitConfirm(true); window.history.pushState({ screen }, ''); return; }
      if (screen === 'detail') { setScreen('home'); setNav('home'); window.history.pushState({ screen: 'home' }, ''); return; }
      if (screen === 'confirm') { setScreen('detail'); window.history.pushState({ screen: 'detail' }, ''); return; }
      if (screen === 'success') { setScreen('home'); setNav('home'); window.history.pushState({ screen: 'home' }, ''); return; }
      if (screen === 'editProfile') { setScreen('profile'); window.history.pushState({ screen: 'profile' }, ''); return; }
      if (screen === 'bookingHistory') { setScreen('profile'); window.history.pushState({ screen: 'profile' }, ''); return; }
      if (['home','explore','map','match','profile'].includes(screen)) {
        const idx = TAB_ORDER.indexOf(nav);
        if (idx > 0) { goNav(TAB_ORDER[idx-1]); }
        else { window.history.pushState({ screen }, ''); }
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [screen, nav]);

  useEffect(() => { localStorage.setItem('otf-dark', darkMode); }, [darkMode]);
  useEffect(() => { localStorage.setItem('otf-auto-dark', autoDarkMode); }, [autoDarkMode]);
  useEffect(() => {
    if (!autoDarkMode) return;
    const check = () => { const h = new Date().getHours(); setDarkMode(h >= 18 || h < 6); };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [autoDarkMode]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2700); };

  const PAKISTAN_CITIES = [
    "Karachi","Lahore","Islamabad","Rawalpindi","Peshawar",
    "Quetta","Multan","Hyderabad","Faisalabad","Sialkot",
    "Gujranwala","Bahawalpur","Sargodha","Sukkur","Larkana"
  ];

  const calcAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSignUp = async () => {
    if (!authName.trim())   { setAuthError("Full name is required."); return; }
    if (!authPhone.trim())  { setAuthError("Phone number is required."); return; }
    if (!authCity.trim())   { setAuthError("Please select your city."); return; }
    if (!authDob.trim())    { setAuthError("Date of birth is required."); return; }
    const age = calcAge(authDob);
    if (!age || age < 13)   { setAuthError("You must be at least 13 years old."); return; }
    if (!authEmail.trim())  { setAuthError("Email is required."); return; }
    if (authPassword.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
    setAuthLoading(true); setAuthError("");
    // Check phone uniqueness before creating auth user
    const { data: existing } = await supabase
      .from('users').select('id').eq('phone', authPhone).maybeSingle();
    if (existing) { setAuthError("This phone number is already registered."); setAuthLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('unique')) {
        setAuthError("This email is already registered. Please log in.");
      } else {
        setAuthError(error.message);
      }
      setAuthLoading(false); return;
    }
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        name: authName,
        phone: authPhone,
        role: authRole,
        city: authCity
      });
      setAuthUser({ name: authName, phone: authPhone, role: authRole, city: authCity, dob: authDob, age });
    }
    setAuthLoading(false);
  };

  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword.trim()) { setAuthError("Please enter your email and password."); return; }
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        setAuthError("Incorrect email or password. Please try again.");
      } else {
        setAuthError(error.message);
      }
      setAuthLoading(false); return;
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setAuthUser(null);
    showToast("Logged out successfully");
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
    setForgotSent(true);
    showToast("Password reset email sent — check your inbox");
  };

  // Share booking
  const handleShareBooking = async () => {
    const text = `Booked ${ground?.name || "a ground"} on ${date} at ${curSlot?.time || "—"}. Join me! — Outfield`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Outfield Booking', text, url: 'https://outfield-weld.vercel.app' }); }
      catch (e) {}
    } else {
      navigator.clipboard?.writeText(text);
      showToast("Copied to clipboard");
    }
  };

  // Toggle favourite ground (Supabase)
  /*
    SQL to create favourites table:
    CREATE TABLE favourites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      ground_id uuid NOT NULL REFERENCES grounds(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      UNIQUE(user_id, ground_id)
    );
    ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users manage own favourites" ON favourites
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  */
  const handleToggleFav = async (groundId) => {
    if (!session?.user) return;
    const isFaved = favGroundIds.has(groundId);
    if (isFaved) {
      await supabase.from('favourites').delete().eq('user_id', session.user.id).eq('ground_id', groundId);
      setFavGroundIds(prev => { const n = new Set(prev); n.delete(groundId); return n; });
      setFavGrounds(prev => prev.filter(g => g.id !== groundId));
      showToast("Removed from favourites");
    } else {
      await supabase.from('favourites').insert({ user_id: session.user.id, ground_id: groundId });
      setFavGroundIds(prev => new Set([...prev, groundId]));
      showToast("Added to favourites");
    }
  };

  // Feature 2 — cancel booking
  const handleCancelBooking = async (id) => {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    setBookingHistory(prev => prev.map(b => b.id === id ? {...b, status: 'cancelled'} : b));
    setMyBookings(prev => prev.map(b => b.id === id ? {...b, status: 'cancelled'} : b));
    setCancelConfirmId(null);
    showToast("Booking cancelled");
  };

  // Feature 3 — save profile edits
  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setEditProfileSaving(true);
    await supabase.from('users').update({ name: editName, phone: editPhone, city: editCity })
      .eq('id', session.user.id);
    setAuthUser(prev => ({...prev, name: editName, phone: editPhone, city: editCity}));
    setEditProfileSaving(false);
    setScreen("profile");
    showToast("Profile updated!");
  };

  // Feature 4 — submit review to Supabase
  const handleSubmitRating = async () => {
    setRatingDone(true);
    setRatingModal(false);
    showToast("Thanks for your rating!");
    if (session?.user && ground?.id && typeof ground.id === 'string' && ground.id.includes('-')) {
      await supabase.from('reviews').insert({
        ground_id: ground.id,
        player_id: session.user.id,
        rating: ratingVal,
        comment: ratingComment || null
      });
      const { data: allReviews } = await supabase
        .from('reviews').select('rating').eq('ground_id', ground.id);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await supabase.from('grounds').update({ rating: Math.round(avg * 10) / 10 }).eq('id', ground.id);
      }
    }
    setRatingComment("");
  };

  // Feature 5 — toggle ground live/paused
  const handleToggleGroundStatus = async (g) => {
    const newStatus = g.status === 'live' ? 'paused' : 'live';
    await supabase.from('grounds').update({ status: newStatus }).eq('id', g.id);
    setOwnerGrounds(prev => prev.map(og => og.id === g.id ? {...og, status: newStatus} : og));
    showToast(newStatus === 'live' ? "Ground is now live!" : "Ground paused");
  };

  // Helper: is booking_date today or future?
  const isFutureBooking = (dateStr) => {
    const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
    const parts = (dateStr || '').split(' ');
    if (parts.length < 2) return true;
    const d = new Date(new Date().getFullYear(), months[parts[0]] ?? 0, parseInt(parts[1]) || 1);
    d.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    return d >= today;
  };

  const handleConfirmBooking = async () => {
    if (!curSlot || !ground) return;
    setBookingCount(p => p + 1);
    if (session?.user && ground.id && typeof ground.id === 'string' && ground.id.includes('-')) {
      const ref = "OTF-" + Math.random().toString(36).substring(2,6).toUpperCase();
      const timeFrom = curSlot.startTime || curSlot.time?.split("–")[0] || "00:00";
      const timeTo   = curSlot.endTime   || curSlot.time?.split("–")[1] || "02:00";
      const courtId  = court?.id || null;
      await supabase.from('bookings').insert({
        court_id:       courtId,
        player_id:      session.user.id,
        booking_date:   date,
        start_time:     timeFrom,
        end_time:       timeTo,
        total_price:    (curSlot.price || 0) * playerCount,
        player_count:   playerCount,
        payment_method: pay,
        status:         "confirmed",
        booking_ref:    ref,
        lfp_on:         lfp
      });
      // Mark slot as booked immediately in local state
      setRealSlots(prev => prev.map(s => s.startTime === timeFrom ? {...s, booked: true} : s));
      setBookedSlotKeys(prev => new Set([...prev, `${courtId}_${date}_${timeFrom}`]));
      // Feature 2: Insert announcement for the owner so they see it in dashboard
      // Find owner_id from ground data
      supabase.from('grounds').select('owner_id, name').eq('id', ground.id).single()
        .then(({ data: gd }) => {
          if (gd?.owner_id) {
            supabase.from('announcements').insert({
              owner_id: gd.owner_id,
              ground_id: ground.id,
              message: `New booking received for ${gd.name} on ${date} at ${curSlot.time} — ${authUser?.name || 'A player'}`
            });
          }
        });
    }
    setScreen("success");
  };

  const goNav = (n) => {
    const idx = TAB_ORDER.indexOf(n);
    setTabIndex(idx);
    setNav(n);
    setScreen({home:"home",explore:"explore",map:"map",match:"match",profile:"profile"}[n]);
  };

  const navigate = (toScreen, transition="fade") => {
    setScreen(toScreen);
  };

  const activeGrounds = dbGrounds.length > 0 ? dbGrounds : GROUNDS;

  const filtered = activeGrounds.filter(g => {
    const ms = sport === "all" || g.sports.includes(sport);
    const mq = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.area.toLowerCase().includes(search.toLowerCase());
    // City filter
    const mc = filterCity === "all" || !g.city || g.city === filterCity;
    // Time filter — check if any slot in the ground falls within the selected time range
    let mt = true;
    if (timeFilterFrom && timeFilterTo) {
      const allSlots = g.isFacility
        ? (g.courts||[]).flatMap(c => c.slots?.["Mar 10"] || [])
        : (g.slots?.["Mar 10"] || []);
      mt = allSlots.some(s => {
        if (s.booked) return false;
        const slotFrom = s.time.split("–")[0];
        return slotFrom >= timeFilterFrom && slotFrom < timeFilterTo;
      });
    }
    return ms && mq && mc && mt;
  });

  const curSlot  = ground && slot !== null ? getSlots(ground, date)[slot] : null;

  const allLfp = GROUNDS.flatMap(g =>
    Object.entries(g.slots).flatMap(([d, slots]) =>
      slots.filter(s => s.lfp).map(s => ({ ...s, groundName:g.name, groundArea:g.area, dateLabel:d, groundId:g.id }))
    )
  );

  const openGround = (g) => {
    setGround(g);
    setCourt(null);
    setSlot(null);
    setLfp(false);
    setScreen('detail');
    setRealSlots([]);
    // For non-facility DB grounds, fetch first court to get pricing/duration
    if (g.id && typeof g.id === 'string' && g.id.includes('-') && !g.isFacility) {
      supabase.from('courts').select('*').eq('ground_id', g.id).limit(1)
        .then(({ data }) => {
          const firstCourt = data?.[0] || null;
          fetchRealSlots(g, firstCourt, date);
        });
    } else {
      fetchRealSlots(g, null, date);
    }
  };
  const activeCourt = ground?.isFacility ? court : null;
  const getSlots = (g, d) => {
    if (realSlots.length > 0) return realSlots;
    if (g?.isFacility && court) return court.slots?.[d] || court.slots?.['Mar 10'] || [];
    return g?.slots?.[d] || g?.slots?.['Mar 10'] || [];
  };

  const featGrounds = [...activeGrounds].sort((a,b) => b.rating-a.rating).slice(0,5);

  /* amenity icon helper */
  const AmenityIcon = ({name}) => {
    const I = AMENITY_ICONS[name] || Shield;
    return <I size={11} strokeWidth={2}/>;
  };

  return (
    <>
      <style>{css}</style>
      {toast && (
        <div className="toast">
          <CheckCircle size={14} color="var(--green-v)" strokeWidth={2.5}/>
          {toast}
        </div>
      )}
      <div className={darkMode ? 'app dark' : 'app'} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {/* ═══ AUTH LOADING ═══ */}
        {!authChecked && (
          <div style={{minHeight:"100svh",background:"#040608",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:"Sora,sans-serif",fontSize:40,fontWeight:900,color:"#fff",letterSpacing:"-2px"}}>Out<span style={{color:"#00ff78"}}>field</span></div>
          </div>
        )}

        {/* ═══ AUTH SCREEN ═══ */}
        {authChecked && !session && (
          <div className="auth-screen">
            <div className="auth-logo">Out<em>field</em></div>
            <div className="auth-tagline">Book. Show up. Play.</div>
            <div className="auth-card">
              <div className="auth-tabs">
                <button className={`auth-tab ${authMode==="login"?"on":""}`} onClick={()=>{setAuthMode("login");setAuthError("");}}>Log In</button>
                <button className={`auth-tab ${authMode==="signup"?"on":""}`} onClick={()=>{setAuthMode("signup");setAuthError("");}}>Sign Up</button>
              </div>

              {authError && (
                <div className="auth-error">
                  <AlertCircle size={13} color="#DC2626" strokeWidth={2}/> {authError}
                </div>
              )}

              {authMode === "signup" && (
                <>
                  <div className="auth-field">
                    <label className="auth-label">Full Name <span style={{color:"#DC2626"}}>*</span></label>
                    <input className="auth-input" placeholder="Your full name" value={authName} onChange={e=>setAuthName(e.target.value)}/>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Phone Number <span style={{color:"#DC2626"}}>*</span></label>
                    <input className="auth-input" placeholder="03XX-XXXXXXX" type="tel" value={authPhone} onChange={e=>setAuthPhone(e.target.value)}/>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">City <span style={{color:"#DC2626"}}>*</span></label>
                    <select className="auth-input" style={{cursor:"pointer"}} value={authCity} onChange={e=>setAuthCity(e.target.value)}>
                      <option value="">Select your city</option>
                      {PAKISTAN_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Date of Birth <span style={{color:"#DC2626"}}>*</span></label>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <input className="auth-input" type="date" value={authDob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e=>setAuthDob(e.target.value)}
                        style={{flex:1}}/>
                      {authDob && calcAge(authDob) !== null && (
                        <div style={{
                          background:"var(--green-l)",border:"1px solid var(--green)",
                          borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:800,
                          color:"var(--green-d)",whiteSpace:"nowrap",flexShrink:0
                        }}>
                          {calcAge(authDob)} yrs
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">I am a</label>
                    <div className="auth-role-row">
                      <div className={`auth-role-btn ${authRole==="player"?"on":""}`} onClick={()=>setAuthRole("player")}>⚽ Player</div>
                      <div className={`auth-role-btn ${authRole==="owner"?"on":""}`} onClick={()=>setAuthRole("owner")}>🏟️ Ground Owner</div>
                    </div>
                  </div>
                </>
              )}

              <div className="auth-field">
                <label className="auth-label">Email *</label>
                <input className="auth-input" placeholder="you@email.com" type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/>
              </div>
              <div className="auth-field">
                <label className="auth-label">Password *</label>
                <input className="auth-input" placeholder={authMode==="signup"?"At least 6 characters":"Your password"} type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/>
                {authMode === "login" && (
                  <div style={{textAlign:"right",marginTop:6}}>
                    <span className="forgot-link" onClick={()=>{setShowForgotPwd(true);setForgotSent(false);setForgotEmail("");setAuthError("");}}>
                      Forgot password?
                    </span>
                  </div>
                )}
              </div>

              {/* Forgot password panel */}
              {showForgotPwd && authMode === "login" && (
                <div className="forgot-panel">
                  <div className="forgot-panel-title">Reset your password</div>
                  {forgotSent ? (
                    <div className="forgot-sent">
                      <CheckCircle size={14} color="var(--green)" strokeWidth={2}/>
                      Email sent! Check your inbox for the reset link.
                    </div>
                  ) : (
                    <>
                      <input className="auth-input" type="email" placeholder="Enter your email"
                        value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}/>
                      <div style={{display:"flex",gap:8,marginTop:8}}>
                        <button className="forgot-cancel" onClick={()=>setShowForgotPwd(false)}>Cancel</button>
                        <button className="forgot-submit" onClick={handleForgotPassword} disabled={!forgotEmail.trim()}>Send Reset Email</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button className="auth-submit" disabled={authLoading}
                onClick={authMode==="signup" ? handleSignUp : handleLogin}>
                {authLoading ? "Please wait..." : authMode==="signup" ? "Create Account" : "Log In"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ MAIN APP (only shown when logged in) ═══ */}
        {authChecked && session && (<>

        {/* ═══ RATING MODAL ═══ */}
        {ratingModal && !ratingDone && (
          <div className="rating-overlay" onClick={e=>{if(e.target.className==="rating-overlay")setRatingModal(false);}}>
            <div className="rating-sheet">
              <div className="rating-ico">
                <Star size={26} color="var(--green-d)" strokeWidth={2}/>
              </div>
              <div className="rating-title">How was your game?</div>
              <div className="rating-sub">
                {ground?.name || "Your recent booking"} · {court ? court.name+" · " : ""}{date}
              </div>
              <div className="rating-stars">
                {[1,2,3,4,5].map(n=>(
                  <div key={n} className="rating-star"
                    onMouseEnter={()=>setRatingHover(n)}
                    onMouseLeave={()=>setRatingHover(0)}
                    onClick={()=>setRatingVal(n)}>
                    <Star size={38}
                      color={(ratingHover||ratingVal)>=n?"#F59E0B":"#E5E7EB"}
                      fill={(ratingHover||ratingVal)>=n?"#F59E0B":"#E5E7EB"}
                      strokeWidth={1}/>
                  </div>
                ))}
              </div>
              <div className="rating-labels">
                <span>Poor</span><span>Average</span><span>Excellent</span>
              </div>
              {ratingVal > 0 && (
                <textarea className="rating-textarea"
                  value={ratingComment}
                  onChange={e=>setRatingComment(e.target.value)}
                  placeholder={ratingVal>=4 ? "What did you love? (optional)" : "What could be improved? (optional)"}/>
              )}
              <button className="rating-submit" disabled={ratingVal===0}
                style={ratingVal===0?{opacity:.4,cursor:"not-allowed"}:{}}
                onClick={handleSubmitRating}>
                Submit Rating
              </button>
              <button className="rating-skip" onClick={()=>setRatingModal(false)}>Skip for now</button>
            </div>
          </div>
        )}

        {/* ═══ SPLASH ═══ */}
        {screen === "splash" && (
          <div className="screen active splash">
            <div className="splash-bg-grad"/>

            {/* ── NEON CRICKET ANIMATION ── */}
            <div className="splash-neon-wrap">
              <div className="splash-neon-orb"/>
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="neon">
                    <feGaussianBlur stdDeviation="2.5" result="blur1"/>
                    <feGaussianBlur stdDeviation="7" result="blur2"/>
                    <feMerge><feMergeNode in="blur2"/><feMergeNode in="blur1"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="neonsoft">
                    <feGaussianBlur stdDeviation="1.5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="neonred">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* Ground oval */}
                <ellipse cx="80" cy="142" rx="52" ry="7" stroke="#00ff78" strokeWidth="1" strokeOpacity=".2" fill="none" filter="url(#neonsoft)"/>

                {/* LEFT STUMP */}
                <line x1="60" y1="58" x2="60" y2="132" stroke="#00ff78" strokeWidth="3" strokeLinecap="round" filter="url(#neon)"
                  style={{strokeDasharray:"80",strokeDashoffset:"80",animation:"neonOn 0.9s 0s ease forwards, neonFlicker 3s 1.1s infinite"}}/>
                {/* CENTER STUMP */}
                <line x1="80" y1="53" x2="80" y2="132" stroke="#00ff78" strokeWidth="3" strokeLinecap="round" filter="url(#neon)"
                  style={{strokeDasharray:"80",strokeDashoffset:"80",animation:"neonOn 0.9s 0.15s ease forwards, neonFlicker 3s 1.25s infinite"}}/>
                {/* RIGHT STUMP */}
                <line x1="100" y1="58" x2="100" y2="132" stroke="#00ff78" strokeWidth="3" strokeLinecap="round" filter="url(#neon)"
                  style={{strokeDasharray:"80",strokeDashoffset:"80",animation:"neonOn 0.9s 0.3s ease forwards, neonFlicker 3s 1.4s infinite"}}/>

                {/* BAIL LEFT */}
                <line x1="57" y1="58" x2="72" y2="55" stroke="#00ff78" strokeWidth="2.5" strokeLinecap="round" filter="url(#neon)"
                  style={{animation:"neonFlicker 3s 1.5s infinite"}}/>
                {/* BAIL RIGHT */}
                <line x1="88" y1="55" x2="103" y2="58" stroke="#00ff78" strokeWidth="2.5" strokeLinecap="round" filter="url(#neon)"
                  style={{animation:"neonFlicker 3s 1.6s infinite"}}/>

                {/* BAT */}
                <g style={{transformOrigin:"28px 118px", animation:"batSwing 0.9s 0.5s cubic-bezier(.34,1.56,.64,1) forwards"}}>
                  <rect x="18" y="88" width="17" height="38" rx="4" fill="none" stroke="#7DF9FF" strokeWidth="2.5" filter="url(#neonsoft)"
                    style={{animation:"neonFlicker 3.5s 1.8s infinite"}}/>
                  <line x1="26.5" y1="88" x2="26.5" y2="72" stroke="#7DF9FF" strokeWidth="2" strokeLinecap="round" filter="url(#neonsoft)"
                    style={{animation:"neonFlicker 3.5s 1.9s infinite"}}/>
                </g>

                {/* BALL */}
                <g style={{animation:"ballLaunch 0.9s 0.85s ease-out forwards", opacity:0}}>
                  <circle cx="42" cy="100" r="8" fill="none" stroke="#FF6B6B" strokeWidth="2.5" filter="url(#neonred)"/>
                  <path d="M38 97 Q42 101 46 97" stroke="#FF6B6B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <path d="M38 103 Q42 99 46 103" stroke="#FF6B6B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </g>

                {/* SPARKS on impact */}
                {[0,45,90,135,180,225,270,315].map((deg,i)=>(
                  <line key={i}
                    x1="50" y1="98"
                    x2={50+14*Math.cos(deg*Math.PI/180)}
                    y2={98+14*Math.sin(deg*Math.PI/180)}
                    stroke={i%2===0?"#FFD700":"#FF6B6B"} strokeWidth="1.5" strokeLinecap="round"
                    style={{animation:`sparkle 0.5s ${1.0+i*0.04}s ease-out forwards`, opacity:0}}/>
                ))}
              </svg>
            </div>

            <div className="splash-inner">
              <div className="splash-pill">
                <div className="splash-pill-dot"/>
                Book. Show up. Play.
              </div>
              <div className="splash-logo">Out<em>field</em></div>
              <div className="splash-tagline">Find your field. Own your game.</div>
            </div>
            <div className="splash-loader" style={{width:"55%",marginTop:28}}>
              <div className="splash-bar-wrap" style={{flex:1}}><div className="splash-bar-fill"/></div>
            </div>
          </div>
        )}

        {/* ═══ ONBOARD ═══ */}
        {screen === "onboard" && (
          <div className="screen active onboard fade">
            <div className="ob-bg">
              <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=700&q=80" alt=""/>
              <div className="ob-bg-fade"/>
            </div>

            {/* Top logo badge */}
            <div className="ob-top-badge">
              <div className="ob-live-dot"/>
              <div className="ob-top-logo">Out<em>field</em></div>
            </div>

            <div className="ob-content">
              <div className="ob-mid">
                <div className="ob-pretag">Find your field. Own your game.</div>
                <div className="ob-h">Book grounds.<br/><em>Find your game.</em></div>
                <div className="ob-sub">No more calling around. Browse real-time availability, book your slot, and find teammates — all in one place.</div>

                {/* Stats row */}
                <div className="ob-stats">
                  {[["200+","Grounds"],["11","Sports"],["24/7","Booking"]].map(([n,l])=>(
                    <div key={l} className="ob-stat">
                      <div className="ob-stat-n">{n}</div>
                      <div className="ob-stat-l">{l}</div>
                    </div>
                  ))}
                </div>

                {/* Sports tags scroll */}
                <div className="ob-sports-scroll">
                  {SPORTS.filter(s=>s.id!=="all").map(s=>(
                    <div key={s.id} className="ob-sport-tag" style={{borderColor:`${s.bg}50`,background:`${s.bg}20`,color:s.fg}}>
                      <NeonSportIcon id={s.id} color={s.neon} size={14}/>{s.label}
                    </div>
                  ))}
                </div>

                <div className="ob-divider"/>

                {/* Role selector */}
                <div className="ob-role-label">I want to</div>
                <div className="ob-roles">
                  <div className="ob-role-card player" onClick={()=>{setScreen("home");setNav("home");}}>
                    <div className="ob-role-ico">
                      <span style={{fontSize:22}}>⚽</span>
                    </div>
                    <div className="ob-role-title">Find & Book</div>
                    <div className="ob-role-desc">Browse grounds, book slots & find teammates</div>
                    <div className="ob-role-arrow">
                      <ChevronRight size={13} color="var(--green-v)" strokeWidth={2.5}/>
                    </div>
                  </div>
                  <div className="ob-role-card owner" onClick={()=>{setScreen("owner");setNav("home");}}>
                    <div className="ob-role-ico">
                      <span style={{fontSize:22}}>🏟️</span>
                    </div>
                    <div className="ob-role-title">List My Ground</div>
                    <div className="ob-role-desc">Manage your venue & get bookings for free</div>
                    <div className="ob-role-arrow">
                      <ChevronRight size={13} color="var(--orange)" strokeWidth={2.5}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB STRIP ═══ */}
        {['home','explore','map','match','profile'].includes(screen) && (
          <div style={{overflow:'hidden',width:'100%',position:'relative',flex:1}}>
            <div style={{display:'flex',width:'500%',transform:`translateX(-${tabIndex * 20}%)`,transition:'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',willChange:'transform'}}>
              {/* HOME PANEL */}
              <div style={{width:'20%',flexShrink:0,overflowY:'auto',minHeight:'calc(100svh - 72px)'}}>
        {authUser?.role === "owner" && (() => {
          const totalBookings = ownerBookings.length;
          const totalRevenue  = ownerBookings.reduce((s,b) => s + (b.total_price||0), 0);
          // Revenue by date range (booking_date stored as "Apr 14" format)
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const toLabel = (d) => `${months[d.getMonth()]} ${d.getDate()}`;
          const todayLabel = toLabel(new Date());
          const confirmedBks = ownerBookings.filter(b => b.status === 'confirmed');
          const todayEarnings = confirmedBks.filter(b => b.booking_date === todayLabel).reduce((s,b)=>s+(b.total_price||0),0);
          const weekDates = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); return toLabel(d); });
          const weekEarnings = confirmedBks.filter(b => weekDates.includes(b.booking_date)).reduce((s,b)=>s+(b.total_price||0),0);
          const monthDates = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); return toLabel(d); });
          const monthEarnings = confirmedBks.filter(b => monthDates.includes(b.booking_date)).reduce((s,b)=>s+(b.total_price||0),0);
          return (
          <div style={{background:"var(--bg)",paddingBottom:88,minHeight:"100%"}}>

            {/* ── Header ── */}
            <div className="odash-head">
              <div className="odash-head-glow"/>
              <div className="odash-greeting">Owner Dashboard</div>
              <div className="odash-title">Your <em>Grounds</em></div>
              <div className="odash-sub">{authUser?.name || "Owner"} · {authUser?.city || "Pakistan"}</div>
              <div className="odash-stats">
                <div className="odash-stat">
                  <div className="odash-stat-n">{ownerDashLoading ? "…" : ownerGrounds.length}</div>
                  <div className="odash-stat-l">Grounds</div>
                </div>
                <div className="odash-stat">
                  <div className="odash-stat-n">{ownerDashLoading ? "…" : totalBookings}</div>
                  <div className="odash-stat-l">Bookings</div>
                </div>
                <div className="odash-stat">
                  <div className="odash-stat-n" style={{fontSize:13}}>
                    {ownerDashLoading ? "…" : `Rs ${totalRevenue.toLocaleString()}`}
                  </div>
                  <div className="odash-stat-l">All-time</div>
                </div>
              </div>
              {/* Revenue tracker */}
              <div className="rev-tracker-row">
                <div className="rev-card">
                  <div className="rev-label">Today</div>
                  <div className="rev-val">{ownerDashLoading ? "…" : todayEarnings > 0 ? `Rs ${todayEarnings.toLocaleString()}` : "—"}</div>
                </div>
                <div className="rev-card">
                  <div className="rev-label">This Week</div>
                  <div className="rev-val">{ownerDashLoading ? "…" : weekEarnings > 0 ? `Rs ${weekEarnings.toLocaleString()}` : "—"}</div>
                </div>
                <div className="rev-card">
                  <div className="rev-label">This Month</div>
                  <div className="rev-val">{ownerDashLoading ? "…" : monthEarnings > 0 ? `Rs ${monthEarnings.toLocaleString()}` : "—"}</div>
                </div>
              </div>
            </div>

            {/* ── Ground list ── */}
            <div className="odash-body">
              {ownerDashLoading ? (
                <div className="bh-loading">
                  <RefreshCw size={16} color="var(--ink4)" strokeWidth={2}/> Loading…
                </div>

              ) : ownerGrounds.length === 0 ? (
                <div className="odash-empty">
                  <div className="odash-empty-ico">
                    <MapPin size={22} color="var(--ink4)" strokeWidth={1.5}/>
                  </div>
                  <div className="odash-empty-t">No grounds listed yet</div>
                  <div className="odash-empty-s">List your ground to start receiving bookings from players.</div>
                  <button className="odash-list-btn" onClick={()=>setScreen("owner")}>
                    + List a Ground
                  </button>
                </div>

              ) : (<>
                {ownerGrounds.map(g => {
                  const gBookings  = (g.courts||[]).flatMap(c => c.bookings||[]);
                  const confirmed  = gBookings.filter(b => b.status === "confirmed").length;
                  const cancelled  = gBookings.filter(b => b.status === "cancelled").length;
                  const revenue    = gBookings
                    .filter(b => b.status === "confirmed")
                    .reduce((s,b) => s + (b.total_price||0), 0);
                  const statusKey  = g.status || "pending";

                  return (
                    <div key={g.id} className="odash-ground-card">
                      {/* Image */}
                      {g.img_url
                        ? <img className="odash-ground-img" src={g.img_url} alt={g.name}
                            onError={e=>{e.target.style.display="none";}}/>
                        : <div className="odash-ground-img-placeholder">
                            <MapPin size={28} color="rgba(255,255,255,.2)" strokeWidth={1.5}/>
                          </div>
                      }

                      <div className="odash-ground-body">
                        {/* Name + status */}
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
                          <div className="odash-ground-name">{g.name}</div>
                          <div className={`odash-ground-status ${statusKey}`}>{statusKey}</div>
                        </div>

                        {/* Area */}
                        <div className="odash-ground-area">
                          <MapPin size={10} strokeWidth={2}/>
                          {g.area}{g.city ? ` · ${g.city}` : ""}
                        </div>

                        {/* Booking stats row */}
                        <div className="odash-bkstat-row">
                          <div className="odash-bkstat">
                            <div className="odash-bkstat-n">{confirmed}</div>
                            <div className="odash-bkstat-l">Confirmed</div>
                          </div>
                          <div className="odash-bkstat">
                            <div className="odash-bkstat-n">{cancelled}</div>
                            <div className="odash-bkstat-l">Cancelled</div>
                          </div>
                          <div className="odash-bkstat">
                            <div className="odash-bkstat-n" style={{fontSize:12}}>
                              {revenue > 0 ? `Rs ${revenue.toLocaleString()}` : "—"}
                            </div>
                            <div className="odash-bkstat-l">Revenue</div>
                          </div>
                        </div>

                        {/* Footer: toggle */}
                        <div className="odash-ground-footer">
                          <div style={{fontSize:10,color:"var(--ink4)",fontWeight:600}}>
                            {g.open_from||"—"} – {g.open_till||"—"}
                          </div>
                          <button
                            className={`status-toggle ${statusKey === "live" ? "live" : "paused"}`}
                            onClick={()=>handleToggleGroundStatus(g)}>
                            {statusKey === "live" ? "⏸ Pause" : "▶ Go Live"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button className="odash-list-btn" style={{marginTop:4}} onClick={()=>setScreen("owner")}>
                  + List Another Ground
                </button>
                <button className="odash-block-btn" onClick={()=>{setBlockGroundId(ownerGrounds[0]?.id||"");setShowBlockSheet(true);}}>
                  <X size={14} strokeWidth={2.5}/> Quick Block a Slot
                </button>
              </>)}
            </div>
          </div>
          );
        })()}

        {/* ═══ HOME ═══ */}
        {!authUser?.role?.includes("owner") && (
          <div className="screen active home">
            <div className="home-head">
              <div className="home-head-blob"/><div className="home-head-blob2"/>
              <div className="hrow">
                <div>
                  <div className="hgreet">Good evening</div>
                  <div className="hname">Find a Ground</div>
                  <div className="hloc">
                    <MapPin size={10} color="rgba(255,255,255,.35)" strokeWidth={2}/> Karachi, Pakistan
                  </div>
                </div>
                <div className="head-actions">
                  <div className="icon-btn">
                    <Bell size={17} color="rgba(255,255,255,.7)" strokeWidth={2}/>
                    <div className="notif-dot"/>
                  </div>
                </div>
              </div>
              <div className="search-wrap">
                <div className="search-row">
                  <div className="search-box">
                    <Search size={15} color="rgba(255,255,255,.3)" strokeWidth={2}/>
                    <input className="search-input" placeholder="Search grounds, areas..."
                      value={search} onChange={e=>setSearch(e.target.value)}/>
                    {search && <X size={13} color="rgba(255,255,255,.3)" strokeWidth={2} style={{cursor:"pointer"}} onClick={()=>setSearch("")}/>}
                  </div>
                  <div className="filter-btn">
                    <SlidersHorizontal size={16} color="rgba(255,255,255,.65)" strokeWidth={2}/>
                  </div>
                </div>
              </div>
              <div style={{height:28}}/>
            </div>

            {/* Ground of the Week */}
            {groundOfWeek && (
              <div style={{padding:"12px 18px 0"}}>
                <div className="gotw-card" onClick={()=>openGround({
                  id:groundOfWeek.id, name:groundOfWeek.name, area:groundOfWeek.area||"", city:groundOfWeek.city||"",
                  distance:"—", rating:groundOfWeek.rating||0, reviews:0, priceFrom:2000,
                  sports:["cricket","football"], amenities:groundOfWeek.amenities?groundOfWeek.amenities.split(','):[],
                  openFrom:groundOfWeek.open_from||"06:00", openTill:groundOfWeek.open_till||"23:00",
                  description:groundOfWeek.description||"", img:groundOfWeek.img_url, latitude:groundOfWeek.latitude,
                  longitude:groundOfWeek.longitude, customImage:null, isFacility:false, courts:[], slots:{"default":[]}
                })}>
                  {groundOfWeek.img_url
                    ? <img className="gotw-img" src={groundOfWeek.img_url} alt={groundOfWeek.name} onError={e=>{e.target.style.display="none";}}/>
                    : <div className="gotw-img" style={{background:"linear-gradient(135deg,#0a2a1a,#16a34a33)"}}/>
                  }
                  <div className="gotw-overlay"/>
                  <div className="gotw-badge">⭐ Ground of the Week</div>
                  <div className="gotw-content">
                    <div className="gotw-name">{groundOfWeek.name}</div>
                    <div className="gotw-meta">
                      <MapPin size={10} strokeWidth={2}/> {groundOfWeek.area}
                      {groundOfWeek.rating > 0 && <><span style={{margin:"0 5px"}}>·</span><Star size={10} color="var(--amber)" fill="var(--amber)" strokeWidth={0}/> {groundOfWeek.rating}</>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Carousel */}
            <div className="hero-section">
              <div className="section-header">
                <div className="section-title">
                  <span style={{display:"flex",alignItems:"center",gap:6}}>
                    <Trophy size={14} color="var(--amber)" strokeWidth={2.5}/>
                    Top Rated Near You
                  </span>
                </div>
                <div className="section-link">
                  See all <ChevronRight size={13} strokeWidth={2.5}/>
                </div>
              </div>
              <div className="hero-scroll-wrap" data-swipe-ignore="true">
                <div className="hero-scroll" data-swipe-ignore="true">
                  {[...featGrounds, ...featGrounds].map((g,i) => {
                    return (
                      <div key={i} className="hero-card" onClick={()=>openGround(g)}>
                        <img className="hero-card-img" src={gImg(g)} alt={g.name}
                          onError={e=>{e.target.style.display="none";}}/>
                        <div className="hero-grad"/>
                        <div className="hero-top-row">
                          <div className="hero-rating-pill">
                            <Star size={9} color="var(--amber)" fill="var(--amber)"/> {g.rating}
                          </div>
                          <div className="hero-price-pill">Rs {g.priceFrom.toLocaleString()}</div>
                        </div>
                        <div className="hero-bottom">
                          <div className="hero-name">{g.name}</div>
                          <div className="hero-meta">
                            <div className="hero-meta-item"><MapPin size={9} strokeWidth={2}/>{g.area}</div>
                            <div className="hero-meta-item"><Navigation size={9} strokeWidth={2}/>{g.distance}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sport Filter */}
            <div className="sport-section">
              <div className="sport-scroll" data-swipe-ignore="true">
                {SPORTS.map(s=>{
                  const on = sport===s.id;
                  return (
                    <div key={s.id} className={`sport-chip ${on?"on":""}`}
                      style={on?{background:s.bg}:{}}
                      onClick={()=>setSport(s.id)}>
                      <div className="sport-chip-ico" style={{background:on?"rgba(255,255,255,.15)":s.bg}}>
                        <NeonSportIcon id={s.id} color={on?"#fff":s.neon} size={15}/>
                      </div>
                      <span className="sport-chip-label" style={on?{color:s.fg}:{}}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ground List */}
            <div className="glist-section">
              <div className="section-header">
                <div className="section-title">All Grounds</div>
                <div className="section-link" style={{color:"var(--ink3)",fontSize:11}}>
                  {filtered.length} found
                </div>
              </div>
              {filtered.length===0 && (
                <div className="empty">
                  <div className="empty-ico-wrap"><Search size={24} color="var(--ink4)" strokeWidth={1.5}/></div>
                  <div className="empty-t">No grounds found</div>
                  <div className="empty-s">Try a different sport or search term</div>
                </div>
              )}
              <div className="glist">
                {filtered.map(g => {
                  const slots = getSlots(g,"Mar 10");
                  const freeN = slots.filter(s=>!s.booked).length;
                  const hasLfp = slots.some(s=>s.lfp);
                  return (
                    <div key={g.id} className="gcard" onClick={()=>openGround(g)}>
                      <div className="gcard-img-wrap">
                        <img className="gcard-img" src={gImg(g)} alt={g.name} onError={e=>{e.target.style.display="none";}}/>
                        <div className="gcard-overlay"/>
                        <div className="gcard-tl">
                          <div className="img-pill">
                            <Clock size={9} strokeWidth={2}/> {g.openFrom}–{g.openTill}
                          </div>
                          {hasLfp && <div className="img-pill orange">Need Players</div>}
                        </div>
                        <div className="gcard-tr">
                          <div className="img-pill" style={{background:"rgba(0,0,0,.55)"}}>
                            <Star size={9} color="var(--amber)" fill="var(--amber)" strokeWidth={0}/> {g.rating}
                          </div>
                        </div>
                        <div className="gcard-bl">
                          <div className="gcard-name">{g.name}</div>
                          <div className="gcard-area">
                            <MapPin size={9} color="rgba(255,255,255,.6)" strokeWidth={2}/> {g.area}
                          </div>
                        </div>
                        <div className="gcard-br">
                          <div className="img-pill green">
                            from Rs {g.priceFrom.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="gcard-body">
                        <div className="gcard-info-row">
                          <div className="gcard-info-item">
                            <Navigation size={12} color="var(--ink4)" strokeWidth={2}/> {g.distance}
                          </div>
                          <div className="gcard-info-item">
                            <Users size={12} color="var(--ink4)" strokeWidth={2}/> {g.reviews} reviews
                          </div>
                        </div>
                        <div className="gcard-amenities">
                          {g.amenities.map(a => (
                            <div key={a} className="amenity-chip">
                              <AmenityIcon name={a}/> {a}
                            </div>
                          ))}
                        </div>
                        <div className="slot-dots-row">
                          {slots.slice(0,9).map((s,i)=>(
                            <div key={i} className={`sdot ${s.lfp?"lfp":s.booked?"bkd":"free"}`}/>
                          ))}
                          <span className="sdot-text">{freeN} slots free today</span>
                        </div>
                        <div className="gcard-bottom">
                          <div className="sports-mini">
                            {g.sports.map(sid=>{
                              const sp=sportObj(sid);
                              return (
                                <div key={sid} className="sport-dot-chip" style={{background:sp.bg}} title={sp.label}>
                                  <NeonSportIcon id={sid} color={sp.neon} size={13}/>
                                </div>
                              );
                            })}
                          </div>
                          <div className="gcard-price">Rs {g.priceFrom.toLocaleString()}<span>/slot</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
              </div>

              {/* EXPLORE PANEL */}
              <div style={{width:'20%',flexShrink:0,overflowY:'auto',minHeight:'calc(100svh - 72px)'}}>
                <div className="screen active explore">
            <div className="exp-head">
              <div className="exp-title" style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Compass size={17} color="#fff" strokeWidth={2}/>
                </div>
                Explore Grounds
              </div>
              <div className="exp-sub">Browse all venues across Karachi</div>
            </div>
            <div style={{height:14}}/>
            <div className="sport-section" style={{paddingBottom:8}}>
              <div className="sport-scroll" data-swipe-ignore="true">
                {SPORTS.map(s=>{
                  const on=sport===s.id;
                  return (
                    <div key={s.id} className={`sport-chip ${on?"on":""}`}
                      style={on?{background:s.bg}:{}} onClick={()=>setSport(s.id)}>
                      <div className="sport-chip-ico" style={{background:on?"rgba(255,255,255,.15)":s.bg}}>
                        <NeonSportIcon id={s.id} color={on?"#fff":s.neon} size={14}/>
                      </div>
                      <span className="sport-chip-label" style={on?{color:s.fg}:{}}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{padding:"0 18px 8px",display:"flex",alignItems:"center",gap:8}}>
              <div className="search-box" style={{background:"#fff",border:"1.5px solid var(--border)",flex:1}}>
                <Search size={14} color="var(--ink4)" strokeWidth={2}/>
                <input className="search-input" style={{color:"var(--ink)"}} placeholder="Search by name or area..."
                  value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div style={{width:42,height:42,borderRadius:12,background:showFilterPanel||timeFilterFrom?"var(--ink)":"#fff",border:`1.5px solid ${showFilterPanel||timeFilterFrom?"var(--ink)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .2s"}}
                onClick={()=>setShowFilterPanel(p=>!p)}>
                <SlidersHorizontal size={16} color={showFilterPanel||timeFilterFrom?"#fff":"var(--ink4)"} strokeWidth={2}/>
              </div>
            </div>
            {showFilterPanel && (
              <div className="filter-panel">
                <div className="filter-panel-title">
                  Filters
                  {(timeFilterFrom||timeFilterTo) && (
                    <span className="filter-clear" onClick={()=>{setTimeFilterFrom("");setTimeFilterTo("");}}>Clear all</span>
                  )}
                </div>
                <div style={{fontSize:11,fontWeight:700,color:"var(--ink2)",marginBottom:8}}>Available Time</div>
                <div className="time-filter-row">
                  <span className="time-filter-label">From</span>
                  <select className="time-filter-select" value={timeFilterFrom} onChange={e=>setTimeFilterFrom(e.target.value)}>
                    <option value="">Any time</option>
                    {["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"].map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="time-filter-row">
                  <span className="time-filter-label">To</span>
                  <select className="time-filter-select" value={timeFilterTo} onChange={e=>setTimeFilterTo(e.target.value)}>
                    <option value="">Any time</option>
                    {["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"].map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {timeFilterFrom && timeFilterTo && (
                  <div className="filter-active-badge" style={{marginTop:4}}>
                    <CheckCircle size={10} strokeWidth={2.5}/>
                    Showing grounds with slots {timeFilterFrom}–{timeFilterTo}
                  </div>
                )}
              </div>
            )}
            <div style={{padding:"0 18px 0"}}>
              {filtered.length===0 && (
                <div className="empty">
                  <div className="empty-ico-wrap"><Search size={24} color="var(--ink4)" strokeWidth={1.5}/></div>
                  <div className="empty-t">{timeFilterFrom?"No grounds available at that time":"No results"}</div>
                  <div className="empty-s">{timeFilterFrom?"Try adjusting your time filter":"Try a different search or sport"}</div>
                </div>
              )}
              <div className="glist">
                {filtered.map(g=>(
                  <div key={g.id} className="gcard" onClick={()=>openGround(g)}>
                    <div className="gcard-img-wrap">
                      <img className="gcard-img" src={gImg(g)} alt={g.name} onError={e=>{e.target.style.display="none";}}/>
                      <div className="gcard-overlay"/>
                      <div className="gcard-bl">
                        <div className="gcard-name">{g.name}</div>
                        <div className="gcard-area"><MapPin size={9} color="rgba(255,255,255,.6)" strokeWidth={2}/>{g.area}</div>
                      </div>
                      <div className="gcard-tr">
                        <div className="img-pill"><Star size={9} color="var(--amber)" fill="var(--amber)" strokeWidth={0}/> {g.rating}</div>
                      </div>
                      <div className="gcard-br"><div className="img-pill green">Rs {g.priceFrom.toLocaleString()}</div></div>
                    </div>
                    <div className="gcard-body">
                      <div className="gcard-info-row">
                        <div className="gcard-info-item"><Navigation size={12} color="var(--ink4)" strokeWidth={2}/>{g.distance}</div>
                        <div className="gcard-info-item"><Clock size={12} color="var(--ink4)" strokeWidth={2}/>{g.openFrom}–{g.openTill}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
                </div>
              </div>

              {/* MAP PANEL */}
              <div style={{width:'20%',flexShrink:0,height:'calc(100svh - 72px)'}}>
                <div className="map-screen">
                  <MapScreen
                    grounds={dbGrounds.length > 0 ? dbGrounds : GROUNDS}
                    darkMode={darkMode}
                    onBookGround={(g) => { setGround(g); setScreen("ground"); }}
                  />
                </div>
              </div>

              {/* MATCH PANEL */}
              <div style={{width:'20%',flexShrink:0,overflowY:'auto',minHeight:'calc(100svh - 72px)'}}>
                <div className="screen active match">
            <div className="match-head">
              <div className="match-glow"/>
              <div className="match-title" style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:34,height:34,borderRadius:10,background:"rgba(249,115,22,.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <UserPlus size={17} color="var(--orange)" strokeWidth={2}/>
                </div>
                Matchmaking
              </div>
              <div className="match-sub">Find players or challenge a team</div>
            </div>
            <div style={{height:12}}/>
            <div className="match-tabs">
              <button className={`match-tab ${matchTab==="players"?"on":""}`} onClick={()=>setMatchTab("players")}>
                <UserPlus size={13} strokeWidth={2}/> Find Players
              </button>
              <button className={`match-tab ${matchTab==="teams"?"on":""}`} onClick={()=>setMatchTab("teams")}>
                <Users size={13} strokeWidth={2}/> Team vs Team
              </button>
            </div>
            <div style={{height:10}}/>
            {matchTab === "players" && (
              <div style={{padding:"0 18px"}}>
                {allLfp.length === 0 ? (
                  <div className="empty">
                    <div className="empty-ico-wrap"><UserPlus size={24} color="var(--ink4)" strokeWidth={1.5}/></div>
                    <div className="empty-t">No open games yet</div>
                    <div className="empty-s">Book a slot and toggle "Looking for players" to appear here</div>
                  </div>
                ) : allLfp.map((s,i)=>{
                  const jk = `m-${s.groundId}-${s.dateLabel}-${i}`;
                  const jnd = joined[jk];
                  const sp = sportObj(s.sport);
                  const spotsLeft = Math.max(0,(s.need||0)-(s.joined||0)-(jnd?1:0));
                  return (
                    <div key={i} className="mc">
                      <div className="mc-top">
                        <div style={{flex:1}}>
                          <div className="mc-name">{s.groundName}</div>
                          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                            <span className={`player-style-badge ${s.style||"casual"}`}>
                              {s.style==="competitive"?"🏆 Competitive":"😊 Casual"}
                            </span>
                            {s.position && (
                              <span style={{fontSize:9,color:"var(--ink4)",fontWeight:600}}>{s.position}</span>
                            )}
                          </div>
                        </div>
                        <div className="mc-sport-tag"
                          style={{background:`${sp.bg}15`,color:sp.fg,border:`1px solid ${sp.bg}30`}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <NeonSportIcon id={sp.id} color={sp.neon} size={12}/> {sp.label}
                          </div>
                        </div>
                      </div>
                      <div className="mc-detail">
                        <div className="mc-detail-row"><Calendar size={11} strokeWidth={2}/>{s.dateLabel} · {s.time}</div>
                        <div className="mc-detail-row"><MapPin size={11} strokeWidth={2}/>{s.groundArea} · Booked by {s.bookedBy}</div>
                      </div>
                      <div className="mc-bottom">
                        <div className="mc-avs">
                          {Array.from({length:Math.min((s.joined||0)+(jnd?1:0),5)}).map((_,j)=>(
                            <div key={j} className="mc-av">{String.fromCharCode(65+j)}</div>
                          ))}
                        </div>
                        <div className="mc-spots">
                          {spotsLeft>0?`${spotsLeft} spot${spotsLeft!==1?"s":""} needed`:"Full"}
                        </div>
                        <button className={`mc-join ${jnd?"done":""}`}
                          onClick={()=>{const nv=!jnd;setJoined(p=>({...p,[jk]:nv}));showToast(nv?"Request sent!":"Request cancelled");}}
                          disabled={spotsLeft<=0&&!jnd}>
                          {jnd ? <><Check size={11} strokeWidth={2.5}/>Requested</> : <><UserPlus size={11} strokeWidth={2}/>I'm in!</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* ── LEADERBOARD ── */}
            <div style={{padding:"0 18px",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10,marginTop:6}}>
                <Trophy size={15} color="var(--amber)" strokeWidth={2}/>
                <div style={{fontSize:13,fontWeight:800,color:"var(--ink)"}}>Top Players This Month</div>
              </div>
              {leaderboardLoading ? (
                <div className="bh-loading"><RefreshCw size={14} color="var(--ink4)" strokeWidth={2}/> Loading…</div>
              ) : leaderboard.length === 0 ? (
                <div style={{fontSize:12,color:"var(--ink4)",textAlign:"center",padding:"16px 0",background:"var(--card)",borderRadius:14,border:"1px solid var(--border)"}}>No bookings recorded yet this month</div>
              ) : (
                <div className="ldb-list">
                  {leaderboard.map((p,i) => (
                    <div key={p.id} className="ldb-row">
                      <div className="ldb-rank">
                        {i === 0 ? <span style={{fontSize:16}}>👑</span> : <span className="ldb-rank-num">{i+1}</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div className="ldb-name">{p.name}</div>
                        <div className="ldb-city">{p.city || "Pakistan"}</div>
                      </div>
                      <div className="ldb-badge">{p.count} booking{p.count!==1?"s":""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {matchTab === "teams" && (
              <div style={{padding:"0 18px"}}>
                <div style={{fontSize:11,color:"var(--ink4)",fontWeight:500,marginBottom:12,lineHeight:1.5,background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:10,padding:"9px 12px",display:"flex",gap:7,alignItems:"flex-start"}}>
                  <AlertCircle size={13} color="#F97316" strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                  <span>Teams listed below have a booked ground and are looking for an opponent. Request to challenge — the captain will accept or decline.</span>
                </div>
                {TEAM_CHALLENGES.map((tc)=>{
                  const sp = sportObj(tc.sport);
                  const reqKey = tc.id;
                  const reqSent = teamReqs[reqKey];
                  return (
                    <div key={tc.id} className="tc">
                      <div className="tc-banner" style={{background:`linear-gradient(90deg,${sp.bg},${sp.fg}55)`}}/>
                      <div className="tc-body">
                        <div className="tc-top">
                          <div>
                            <div className="tc-team">{tc.teamName}</div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:sp.neon}}>
                                <NeonSportIcon id={tc.sport} color={sp.neon} size={13}/>{sp.label}
                              </div>
                            </div>
                          </div>
                          <div className="tc-format-tag">{tc.format}</div>
                        </div>
                        <div className="tc-detail">
                          <div className="tc-detail-row"><MapPin size={11} strokeWidth={2}/>{tc.groundName} · {tc.area}</div>
                          <div className="tc-detail-row"><Calendar size={11} strokeWidth={2}/>{tc.date} · {tc.time}</div>
                          <div className="tc-detail-row"><Users size={11} strokeWidth={2}/>{tc.teamSize} players per side needed</div>
                        </div>
                        {reqSent ? (
                          <div>
                            <div style={{fontSize:11,color:"var(--ink3)",fontWeight:600,marginBottom:8}}>📩 Challenge request received:</div>
                            <div className="tc-captain-row">
                              <div className="tc-captain-av">M</div>
                              <div>
                                <div className="tc-captain-name">Maaz's Team</div>
                                <div className="tc-phone">📞 {tc.phone} · Tap to call before accepting</div>
                              </div>
                            </div>
                            <div className="tc-accept-row">
                              <button className="tc-reject"
                                onClick={()=>{setTeamReqs(p=>({...p,[reqKey]:false}));showToast("Challenge declined");}}>
                                Decline
                              </button>
                              <button className="tc-accept"
                                onClick={()=>{showToast("Challenge accepted! Contact them to confirm.");}}>
                                <Check size={13} strokeWidth={2.5}/> Accept Challenge
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="tc-captain-row" style={{marginBottom:0}}>
                              <div className="tc-captain-av">{tc.captain[0]}</div>
                              <div>
                                <div className="tc-captain-name">Captain: {tc.captain}</div>
                                <div className="tc-phone">Contact shown after acceptance</div>
                              </div>
                            </div>
                            <div style={{height:10}}/>
                            <button className="tc-challenge-btn"
                              onClick={()=>{setTeamReqs(p=>({...p,[reqKey]:true}));showToast("Challenge sent! Waiting for captain to respond.");}}>
                              <Swords size={13} strokeWidth={2}/> Challenge This Team
                            </button>
                            <div className="tc-pending-note">
                              <Shield size={10} strokeWidth={2}/> Captain's number revealed only after acceptance
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
                </div>
              </div>

              {/* PROFILE PANEL */}
              <div style={{width:'20%',flexShrink:0,overflowY:'auto',minHeight:'calc(100svh - 72px)'}}>
                <div className="screen active profile">
            {/* Cancel confirmation dialog */}
            {cancelConfirmId && (
              <div className="cancel-overlay" onClick={e=>{if(e.target.className==="cancel-overlay")setCancelConfirmId(null);}}>
                <div className="cancel-sheet">
                  <div className="cancel-title">Cancel this booking?</div>
                  <div className="cancel-sub">This action cannot be undone. The slot will become available to other players.</div>
                  <div className="cancel-actions">
                    <button className="cancel-no" onClick={()=>setCancelConfirmId(null)}>Keep it</button>
                    <button className="cancel-yes" onClick={()=>handleCancelBooking(cancelConfirmId)}>Yes, cancel</button>
                  </div>
                </div>
              </div>
            )}
            <div className="prof-head">
              <div className="prof-glow"/>
              <button className="prof-edit-btn"
                onClick={()=>{setEditName(authUser?.name||"");setEditPhone(authUser?.phone||"");setEditCity(authUser?.city||"");setScreen("editProfile");}}>
                Edit Profile
              </button>
              <div className="prof-av-wrap">
                <div className="prof-av">
                  <User size={30} color="#fff" strokeWidth={1.5}/>
                </div>
                <div className="prof-av-badge">
                  <Check size={11} color="#fff" strokeWidth={3}/>
                </div>
              </div>
              <div className="prof-name">{authUser?.name || "Player"}</div>
              <div className="prof-sub">{authUser?.city || "Pakistan"} · {authUser?.role === "owner" ? "Ground Owner" : "Player"}</div>
            </div>
            <div style={{height:14}}/>
            <div className="prof-body">
              <div className="stat-row">
                {[
                  [String(myBookings.length), "Bookings"],
                  ["0","Sports"],
                  ["0","Matches"]
                ].map(([n,l])=>(
                  <div key={l} className="stat-card">
                    <div className="stat-n">{n}</div>
                    <div className="stat-l">{l}</div>
                  </div>
                ))}
              </div>
              <div className="prof-section-head">
                <div className="prof-section-title">My Bookings</div>
                {myBookings.length > 0 && (
                  <div className="prof-section-count">{myBookings.length}</div>
                )}
              </div>
              {myBookings.length === 0 ? (
                <div className="prof-bookings-empty">
                  <Calendar size={20} color="var(--ink4)" strokeWidth={1.5}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--ink2)"}}>No bookings yet</div>
                    <div style={{fontSize:11,color:"var(--ink4)",marginTop:2}}>Book a ground to see it here</div>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                  {myBookings.map((b, i) => {
                    const statusCls = b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending";
                    const canCancel = b.status === "confirmed" && isFutureBooking(b.booking_date);
                    return (
                      <div key={b.id || i} className="bh-card">
                        <div className="bh-card-top">
                          <div className="bh-ground">{b.booking_ref || `Booking #${i+1}`}</div>
                          <div className={`bh-status ${statusCls}`}>{b.status || "confirmed"}</div>
                        </div>
                        <div className="bh-meta">
                          <div className="bh-meta-item">
                            <Calendar size={11} strokeWidth={2.5}/>{b.booking_date}
                          </div>
                          <div className="bh-meta-item">
                            <Clock size={11} strokeWidth={2.5}/>{b.start_time} – {b.end_time}
                          </div>
                        </div>
                        <div className="bh-divider"/>
                        <div className="bh-bottom">
                          <div className="bh-ref">{b.booking_ref || "—"}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {canCancel && (
                              <button className="bh-cancel-btn" onClick={()=>setCancelConfirmId(b.id)}>Cancel</button>
                            )}
                            <div className="bh-price">Rs {(b.total_price || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="prof-list">
                {[
                  {I:UserPlus, bg:"#FEF3C7", c:"#D97706", t:"Matchmaking History", s:"Games joined or hosted", action:null},
                  {I:Heart,    bg:"#FCE7F3", c:"#DB2777", t:"Favourite Grounds",   s:favGroundIds.size > 0 ? `${favGroundIds.size} saved` : "Your saved venues", action:()=>setShowFavScreen(true)},
                  {I:Bell,     bg:"#DCFCE7", c:"#16A34A", t:"Notifications",       s:"Booking alerts & requests", action:null},
                ].map((r,i)=>(
                  <div key={i} className="prof-row" onClick={r.action || undefined}>
                    <div className="prof-row-ico" style={{background:r.bg}}>
                      <r.I size={17} color={r.c} strokeWidth={2}/>
                    </div>
                    <div>
                      <div className="prof-row-t">{r.t}</div>
                      <div className="prof-row-s">{r.s}</div>
                    </div>
                    <div className="prof-row-arr"><ChevronRight size={16} strokeWidth={2}/></div>
                  </div>
                ))}
                <div className="dm-section">
                  <div className="dm-row">
                    <div className="dm-row-left">
                      <div className="dm-row-ico" style={{background:"#F3F4F6"}}>
                        <SlidersHorizontal size={17} color="#4B5563" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="dm-row-t">Dark mode</div>
                        <div className="dm-row-s">Override theme manually</div>
                      </div>
                    </div>
                    <button
                      className={`dm-toggle ${darkMode ? 'on' : 'off'}`}
                      onClick={() => { if (!autoDarkMode) setDarkMode(d => !d); }}
                      style={autoDarkMode ? {opacity:.4,pointerEvents:'none'} : {}}
                    />
                  </div>
                  <div className="dm-row">
                    <div className="dm-row-left">
                      <div className="dm-row-ico" style={{background:"#EFF6FF"}}>
                        <Clock size={17} color="#3B82F6" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="dm-row-t">Auto dark mode</div>
                        <div className="dm-row-s">Dark after 6 PM · Light after 6 AM</div>
                      </div>
                    </div>
                    <button
                      className={`dm-toggle ${autoDarkMode ? 'on' : 'off'}`}
                      onClick={() => setAutoDarkMode(a => !a)}
                    />
                  </div>
                  <div className="dm-note">Auto mode overrides the manual toggle above.</div>
                </div>
                <div className="prof-row" style={{marginTop:8}} onClick={handleLogout}>
                  <div className="prof-row-ico" style={{background:"#FEF2F2"}}>
                    <ArrowLeft size={17} color="#DC2626" strokeWidth={2}/>
                  </div>
                  <div>
                    <div className="prof-row-t" style={{color:"#DC2626"}}>Sign Out</div>
                    <div className="prof-row-s">{session?.user?.email}</div>
                  </div>
                  <div className="prof-row-arr"><ChevronRight size={16} strokeWidth={2}/></div>
                </div>
              </div>
            </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DETAIL ═══ */}
        {screen === "detail" && ground && (
          <div className="screen active detail scale-in">
            <div style={{overflowY:"auto",flex:1,paddingBottom:98}}>
              <div className="detail-hero">
                {gImg(ground)
                  ? <img src={gImg(ground)} alt={ground.name}/>
                  : <div className="detail-hero-ph"><Activity size={64} color="rgba(255,255,255,.2)" strokeWidth={1}/></div>}
                <div className="detail-hero-grad"/>
                <div className="detail-hero-actions">
                  <button className="dhero-btn" onClick={()=>setScreen("home")}>
                    <ArrowLeft size={18} strokeWidth={2}/>
                  </button>
                  <div className="dhero-actions-right">
                    <button className="dhero-btn" onClick={()=>handleToggleFav(ground.id)}>
                      <Heart size={16} strokeWidth={2} fill={favGroundIds.has(ground.id)?"#ef4444":"none"} color={favGroundIds.has(ground.id)?"#ef4444":"#fff"}/>
                    </button>
                    <button className="dhero-btn" onClick={()=>showToast("Share link copied!")}>
                      <Share2 size={16} strokeWidth={2}/>
                    </button>
                  </div>
                </div>
                <div className="detail-hero-bottom">
                  <div className="detail-hero-name">{ground.name}</div>
                  <div className="detail-hero-meta">
                    <div className="detail-hero-meta-item"><MapPin size={10} strokeWidth={2}/>{ground.area}</div>
                    <div className="detail-hero-meta-item"><Navigation size={10} strokeWidth={2}/>{ground.distance}</div>
                    <div className="detail-hero-meta-item">
                      <Star size={10} color="var(--amber)" fill="var(--amber)" strokeWidth={0}/>
                      {ground.rating} ({ground.reviews})
                    </div>
                  </div>
                </div>
              </div>
              <div className="detail-sheet">
                <div className="detail-stat-row">
                  <div className="detail-stat">
                    <div className="dstat-label">Opens</div>
                    <div className="dstat-val">{ground.openFrom}</div>
                  </div>
                  <div className="detail-stat">
                    <div className="dstat-label">Closes</div>
                    <div className="dstat-val">{ground.openTill}</div>
                  </div>
                  <div className="detail-stat">
                    <div className="dstat-label">From</div>
                    <div className="dstat-val">Rs {ground.priceFrom.toLocaleString()}</div>
                  </div>
                </div>
                <div className="detail-tags-row">
                  {ground.amenities.map(a=>(
                    <div key={a} className="dtag"><AmenityIcon name={a}/>{a}</div>
                  ))}
                </div>
                <div className="detail-desc">{ground.description}</div>
                <div className="detail-sec">Sports Available</div>
                <div className="sports-row">
                  {ground.sports.map(sid=>{
                    const sp=sportObj(sid);
                    return (
                      <div key={sid} className="sport-pill-detail"
                        style={{background:`${sp.bg}18`,borderColor:`${sp.bg}40`,color:sp.fg}}>
                        <NeonSportIcon id={sid} color={sp.neon} size={15}/> {sp.label}
                      </div>
                    );
                  })}
                </div>

                {/* ── COURT PICKER for facilities ── */}
                {ground.isFacility && ground.courts && (
                  <>
                    <div className="detail-sec" style={{display:"flex",alignItems:"center",gap:7}}>
                      Select a Ground
                      <span style={{fontSize:10,fontWeight:600,color:"var(--ink4)",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:100,padding:"2px 8px"}}>
                        {ground.courts.length} available
                      </span>
                    </div>
                    <div className="court-picker-banner">
                      <div className="court-picker-title">{ground.name}</div>
                      <div className="court-picker-sub">Pick the specific ground you want to book below</div>
                    </div>
                    <div className="court-pick-cards">
                      {ground.courts.map(c=>{
                        const sp = sportObj(c.sports[0]);
                        const freeSlots = (c.slots?.["Mar 10"]||[]).filter(s=>!s.booked).length;
                        return (
                          <div key={c.id} className={`court-pick-card ${court?.id===c.id?"sel":""}`}
                            onClick={()=>{setCourt(c);setSlot(null);fetchRealSlots(ground,c,date);}}>
                            <div className="court-pick-ico" style={{background:`${sp.bg}25`}}>
                              <NeonSportIcon id={c.sports[0]} color={sp.neon} size={22}/>
                            </div>
                            <div style={{flex:1}}>
                              <div className="court-pick-name">{c.name}</div>
                              <div className="court-pick-meta">
                                <div className="court-pick-tag"><Activity size={9} strokeWidth={2}/>{c.surface}</div>
                                <div className="court-pick-tag"><Users size={9} strokeWidth={2}/>{c.capacity} players</div>
                                <div className="court-pick-tag" style={{color:freeSlots>0?"var(--green-d)":"var(--ink4)"}}>
                                  <CheckCircle size={9} strokeWidth={2}/>{freeSlots} free today
                                </div>
                              </div>
                              <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                                {c.sports.map(sid=>{
                                  const s2=sportObj(sid);
                                  return <span key={sid} style={{fontSize:9,fontWeight:700,background:`${s2.bg}15`,color:s2.fg,border:`1px solid ${s2.bg}30`,borderRadius:100,padding:"2px 7px",display:"flex",alignItems:"center",gap:3}}><NeonSportIcon id={sid} color={s2.neon} size={10}/>{s2.label}</span>;
                                })}
                              </div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                              <div className="court-pick-price">Rs {c.priceBase.toLocaleString()}</div>
                              <ChevronRight size={15} color={court?.id===c.id?"var(--green-d)":"var(--ink4)"} strokeWidth={2.5}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                <div className="detail-sec">Location</div>
                <div className="map-block">
                  <Map size={26} color="#2563EB" strokeWidth={1.5}/>
                  <div className="map-block-t">{ground.area}, Karachi</div>
                  <div className="map-block-s">Tap to open Google Maps</div>
                </div>
                <div className="detail-sec">Select Date</div>
                <div className="date-row" data-swipe-ignore="true">
                  {DATES.map(d=>(
                    <button key={d} className={`date-btn ${date===d?"on":""}`}
                      onClick={()=>{setDate(d);setSlot(null);}}>{d}</button>
                  ))}
                </div>

                {/* If facility but no court selected yet */}
                {ground.isFacility && !court && (
                  <div className="empty" style={{padding:"28px 18px"}}>
                    <div className="empty-ico-wrap"><Calendar size={22} color="var(--ink4)" strokeWidth={1.5}/></div>
                    <div className="empty-t">Select a ground above</div>
                    <div className="empty-s">Pick which ground you want to book to see available slots</div>
                  </div>
                )}

                {/* Show slots only if not a facility OR a court has been selected */}
                {(!ground.isFacility || court) && (<>
                  {court && (
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--green-l)",border:"1px solid var(--green)",borderRadius:10,padding:"8px 13px",marginBottom:10}}>
                      <CheckCircle size={13} color="var(--green-d)" strokeWidth={2.5}/>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--green-d)"}}>Booking: {court.name}</div>
                      <div style={{marginLeft:"auto",fontSize:10,color:"var(--green-d)",cursor:"pointer",fontWeight:600}}
                        onClick={()=>{setCourt(null);setSlot(null);}}>Change</div>
                    </div>
                  )}
                <div className="slot-legend">
                  <div className="sl"><div className="sl-sq" style={{background:"#22C55E"}}/>Available</div>
                  <div className="sl"><div className="sl-sq" style={{background:"#FCA5A5"}}/>Booked</div>
                  <div className="sl"><div className="sl-sq" style={{background:"var(--orange)"}}/>Need Players</div>
                  <div style={{marginLeft:"auto",fontSize:10,color:"var(--green-d)",fontWeight:700}}>
                    {slotsLoading ? "…" : `${getSlots(ground,date).filter(s=>!s.booked&&!s.blocked).length} free`}
                  </div>
                </div>
                <div className="late-badge" style={{marginBottom:10}}>
                  <Clock size={10} strokeWidth={2}/> Late booking allowed up to 10 mins into slot
                </div>
                {/* Loading skeleton */}
                {slotsLoading ? (
                  <div className="slots-grid">
                    {Array.from({length:6}).map((_,i)=>(
                      <div key={i} style={{borderRadius:13,padding:12,background:"var(--border2)",border:"1.5px solid var(--border)",minHeight:72,animation:"pulse 1.2s ease-in-out infinite"}}/>
                    ))}
                  </div>
                ) : (
                <div className="slots-grid">
                  {getSlots(ground,date).map((s,i)=>{
                    const isBlocked       = s.blocked === true;
                    const isBooked        = s.booked  === true;
                    const isLfp           = isBooked && s.lfp && !isBlocked;
                    const jk              = `d-${ground.id}-${date}-${i}`;
                    const jnd             = joined[jk];
                    const spotsLeft       = Math.max(0,(s.need||0)-(s.joined||0)-(jnd?1:0));
                    const clickable       = !isBooked && !isBlocked;
                    return (
                      <div key={i}
                        className={`slot-card ${isBlocked?"bkd":isLfp?"lfp":isBooked?"bkd":"free"} ${slot===i?"sel":""}`}
                        style={!clickable?{cursor:"not-allowed"}:{}}
                        onClick={()=>{ if(clickable) setSlot(slot===i?null:i); }}>
                        <div className="slot-time">{s.time}</div>
                        <div className="slot-status" style={{color:isBlocked?"#9CA3AF":isLfp?"var(--orange)":isBooked?"var(--ink4)":"var(--green)"}}>
                          {isBlocked ? (
                            <span style={{display:"flex",alignItems:"center",gap:3}}>
                              <Lock size={10} strokeWidth={2.5}/>Unavailable
                            </span>
                          ) : isLfp ? (
                            <span style={{display:"flex",alignItems:"center",gap:3}}>
                              <UserPlus size={10} strokeWidth={2}/>Need Players
                            </span>
                          ) : isBooked ? (
                            <span style={{display:"flex",alignItems:"center",gap:3}}>
                              <X size={10} strokeWidth={2.5}/>Booked
                            </span>
                          ) : (
                            <span style={{display:"flex",alignItems:"center",gap:3}}>
                              <CheckCircle size={10} strokeWidth={2.5}/>Available
                            </span>
                          )}
                        </div>
                        <div className="slot-price">Rs {s.price?.toLocaleString()}</div>
                        {isLfp && (
                          <>
                            <div className="lfp-badge">
                              <Users size={9} strokeWidth={2}/> {spotsLeft} spot{spotsLeft!==1?"s":""} left
                            </div>
                            <button className={`join-btn ${jnd?"done":""}`}
                              onClick={e=>{e.stopPropagation();const nv=!jnd;setJoined(p=>({...p,[jk]:nv}));showToast(nv?"Request sent! You'll hear back soon.":"Request cancelled");}}>
                              {jnd ? <><Check size={10} strokeWidth={2.5}/>Requested</> : <><UserPlus size={10} strokeWidth={2}/>I'm in!</>}
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
                {slot!==null && (
                  <div className="lfp-toggle">
                    <div className="lfp-toggle-left">
                      <div className="lfp-toggle-t" style={{display:"flex",alignItems:"center",gap:6}}>
                        <UserPlus size={14} color="var(--orange)" strokeWidth={2}/> Looking for players?
                      </div>
                      <div className="lfp-toggle-s">Alert others — they can request to join your slot</div>
                    </div>
                    <button className={`sw ${lfp?"on":"off"}`} onClick={()=>setLfp(!lfp)}>
                      <div className="sw-knob"/>
                    </button>
                  </div>
                )}
                </>)}
              </div>
            </div>
            <div className="book-bar">
              <button className="book-btn"
                disabled={slot===null || (ground.isFacility && !court)}
                onClick={()=>setScreen("confirm")}>
                {ground.isFacility && !court
                  ? "Select a Ground First"
                  : slot!==null
                    ? `Book ${getSlots(ground,date)[slot].time}${court?" — "+court.name:""}`
                    : "Select a Slot to Book"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ CONFIRM ═══ */}
        {screen === "confirm" && ground && curSlot && (
          <div className="screen active confirm slide-in-right">
            <div className="confirm-head">
              <div className="confirm-head-glow"/>
              <button className="confirm-back-btn" onClick={()=>setScreen("detail")}>
                <ArrowLeft size={14} strokeWidth={2}/> Back
              </button>
              <div className="confirm-title">Confirm Booking</div>
              <div className="confirm-sub">Review your details before confirming</div>
            </div>
            <div className="confirm-body">
              <div className="c-block">
                <div className="c-block-title">Booking Summary</div>
                {bookingCount >= MAX_BOOKINGS && (
                  <div className="booking-limit-note">
                    <AlertCircle size={13} color="#F97316" strokeWidth={2}/>
                    You've reached the 2-booking limit. This lifts once a previous slot ends.
                  </div>
                )}
                {[
                  ["Facility", ground.name],
                  ...(court ? [["Ground", court.name]] : []),
                  ["Date", `${date}, 2026`],
                  ["Time Slot", curSlot.time],
                  ["Location", ground.area],
                  ...(lfp ? [["Matchmaking","Alert ON"]] : []),
                ].map(([l,v]) => (
                  <div key={l} className="c-row">
                    <span className="c-label">{l}</span>
                    <span className="c-val" style={l==="Matchmaking"?{color:"var(--orange)"}:{}}>{v}</span>
                  </div>
                ))}
                {/* Player count pricing */}
                <div className="player-count-row">
                  <div className="player-count-label">Number of Players</div>
                  <div className="player-count-ctrl">
                    <div className="pcc-btn" onClick={()=>setPlayerCount(p=>Math.max(1,p-1))}>−</div>
                    <div className="pcc-val">{playerCount}</div>
                    <div className="pcc-btn" onClick={()=>setPlayerCount(p=>Math.min(22,p+1))}>+</div>
                  </div>
                </div>
                <div className="price-calc-row">
                  <div className="price-calc-label">Rs {curSlot.price?.toLocaleString()} × {playerCount} player{playerCount!==1?"s":""}</div>
                  <div className="price-calc-total">Rs {(curSlot.price * playerCount)?.toLocaleString()}</div>
                </div>
                <div className="c-row">
                  <span className="c-label">Total Amount</span>
                  <span className="c-total">Rs {(curSlot.price * playerCount)?.toLocaleString()}</span>
                </div>
              </div>
              <div className="c-block">
                <div className="c-block-title">Payment Method</div>
                <div className="pay-list">
                  {[
                    {id:"cash",   ico:"💵", label:"Pay at Ground"},
                    {id:"easy",   ico:"📱", label:"EasyPaisa"},
                    {id:"sada",   ico:"💳", label:"SadaPay"},
                    {id:"jazz",   ico:"🎵", label:"JazzCash"},
                  ].map(p=>(
                    <div key={p.id} className={`pay-item ${pay===p.id?"sel":""}`} onClick={()=>setPay(p.id)}>
                      <div className="pay-ico-wrap">{p.ico}</div>
                      <span className="pay-label">{p.label}</span>
                      <div className={`pay-radio ${pay===p.id?"sel":""}`}/>
                    </div>
                  ))}
                </div>
                {pay!=="cash" && (
                  <div className="soon-note">
                    <AlertCircle size={14} color="#D97706" strokeWidth={2}/>
                    <span>In-app payments launching soon. You'll be redirected to the payment app.</span>
                  </div>
                )}
              </div>
              <button className="book-btn"
                disabled={bookingCount >= MAX_BOOKINGS}
                style={bookingCount >= MAX_BOOKINGS ? {opacity:.5,cursor:"not-allowed"} : {}}
                onClick={()=>{
                    if(bookingCount >= MAX_BOOKINGS) return;
                    handleConfirmBooking();
                  }}>
                {bookingCount >= MAX_BOOKINGS
                  ? "Booking Limit Reached (2 max)"
                  : `Confirm Booking · Rs ${(curSlot.price * playerCount)?.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* ═══ SUCCESS ═══ */}
        {screen === "success" && (
          <div className="screen active success slide-in-right">
            <div className="success-ring">
              <Check size={40} color="#fff" strokeWidth={3}/>
            </div>
            <div className="success-title">You're booked!</div>
            <div className="success-sub">
              Slot confirmed. Just show up and play.
              {lfp && <><br/><span style={{color:"var(--orange)",fontWeight:700}}>Matchmaking alert is live!</span></>}
            </div>
            {/* Feature 2: email confirmation note */}
            {session?.user?.email && (
              <div style={{display:"flex",alignItems:"center",gap:7,background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"9px 14px",marginTop:10,fontSize:11,color:"var(--green-d)",fontWeight:600,width:"100%",textAlign:"left"}}>
                <CheckCircle size={13} color="var(--green-d)" strokeWidth={2.5}/>
                A confirmation has been sent to {session.user.email}
              </div>
            )}
            <div className="ref-box">
              <div className="ref-label">Booking Reference</div>
              <div className="ref-code">{bookRef}</div>
            </div>
            {ground && curSlot && (
              <div className="success-detail-box">
                {[
                  [MapPin, ground.name],
                  [Clock, curSlot.time],
                  [Calendar, `${date}, 2026`],
                  [Navigation, ground.area],
                ].map(([I,v],i)=>(
                  <div key={i} className="sdb-row"><I size={13} color="var(--ink4)" strokeWidth={2}/>{v}</div>
                ))}
              </div>
            )}
            <button className="book-btn" style={{marginTop:22,width:"100%"}}
              onClick={()=>{setScreen("home");setNav("home");setGround(null);setSlot(null);setLfp(false);}}>
              Back to Home
            </button>
            {/* Feature 4: WhatsApp share */}
            <button className="share-booking-btn" style={{background:"#25D366",borderColor:"#25D366",color:"#fff",marginTop:10}}
              onClick={()=>{
                const msg = encodeURIComponent(`I just booked ${ground?.name} on Outfield! ${date} at ${curSlot?.time}. Download the app: https://outfield-weld.vercel.app`);
                window.open(`https://wa.me/?text=${msg}`,'_blank');
              }}>
              <span style={{fontSize:16}}>💬</span> Share on WhatsApp
            </button>
            <button className="share-booking-btn" onClick={()=>{
              const text = `Booked ${ground?.name} on ${date} at ${curSlot?.time}. Booking ref: ${bookRef} — Outfield`;
              navigator.clipboard?.writeText(text);
              showToast("Copied to clipboard");
            }}>
              <Share2 size={15} strokeWidth={2}/> Copy booking details
            </button>
            {!ratingDone && (
              <div style={{marginTop:10,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}
                onClick={()=>setRatingModal(true)}>
                <Star size={18} color="#F59E0B" fill="#F59E0B" strokeWidth={0}/>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:"#92400E"}}>Rate your experience after your game</div>
                  <div style={{fontSize:10,color:"#B45309",marginTop:2}}>You'll get a notification when your slot ends</div>
                </div>
                <ChevronRight size={14} color="#92400E" style={{marginLeft:"auto"}} strokeWidth={2.5}/>
              </div>
            )}
          </div>
        )}

        {/* MAP + MATCH — rendered inside tab strip above */}
        {false && (
          <div>
            <div className="match-head">
              <div className="match-glow"/>
              <div className="match-title" style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:34,height:34,borderRadius:10,background:"rgba(249,115,22,.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <UserPlus size={17} color="var(--orange)" strokeWidth={2}/>
                </div>
                Matchmaking
              </div>
              <div className="match-sub">Find players or challenge a team</div>
            </div>
            <div style={{height:12}}/>

            {/* ── TABS ── */}
            <div className="match-tabs">
              <button className={`match-tab ${matchTab==="players"?"on":""}`} onClick={()=>setMatchTab("players")}>
                <UserPlus size={13} strokeWidth={2}/> Find Players
              </button>
              <button className={`match-tab ${matchTab==="teams"?"on":""}`} onClick={()=>setMatchTab("teams")}>
                <Users size={13} strokeWidth={2}/> Team vs Team
              </button>
            </div>

            <div style={{height:10}}/>

            {/* ── FIND PLAYERS TAB ── */}
            {matchTab === "players" && (
              <div style={{padding:"0 18px"}}>
                {allLfp.length === 0 ? (
                  <div className="empty">
                    <div className="empty-ico-wrap"><UserPlus size={24} color="var(--ink4)" strokeWidth={1.5}/></div>
                    <div className="empty-t">No open games yet</div>
                    <div className="empty-s">Book a slot and toggle "Looking for players" to appear here</div>
                  </div>
                ) : allLfp.map((s,i)=>{
                  const jk = `m-${s.groundId}-${s.dateLabel}-${i}`;
                  const jnd = joined[jk];
                  const sp = sportObj(s.sport);
                  const spotsLeft = Math.max(0,(s.need||0)-(s.joined||0)-(jnd?1:0));
                  return (
                    <div key={i} className="mc">
                      <div className="mc-top">
                        <div style={{flex:1}}>
                          <div className="mc-name">{s.groundName}</div>
                          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                            <span className={`player-style-badge ${s.style||"casual"}`}>
                              {s.style==="competitive"?"🏆 Competitive":"😊 Casual"}
                            </span>
                            {s.position && (
                              <span style={{fontSize:9,color:"var(--ink4)",fontWeight:600}}>{s.position}</span>
                            )}
                          </div>
                        </div>
                        <div className="mc-sport-tag"
                          style={{background:`${sp.bg}15`,color:sp.fg,border:`1px solid ${sp.bg}30`}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <NeonSportIcon id={sp.id} color={sp.neon} size={12}/> {sp.label}
                          </div>
                        </div>
                      </div>
                      <div className="mc-detail">
                        <div className="mc-detail-row"><Calendar size={11} strokeWidth={2}/>{s.dateLabel} · {s.time}</div>
                        <div className="mc-detail-row"><MapPin size={11} strokeWidth={2}/>{s.groundArea} · Booked by {s.bookedBy}</div>
                      </div>
                      <div className="mc-bottom">
                        <div className="mc-avs">
                          {Array.from({length:Math.min((s.joined||0)+(jnd?1:0),5)}).map((_,j)=>(
                            <div key={j} className="mc-av">{String.fromCharCode(65+j)}</div>
                          ))}
                        </div>
                        <div className="mc-spots">
                          {spotsLeft>0?`${spotsLeft} spot${spotsLeft!==1?"s":""} needed`:"Full"}
                        </div>
                        <button className={`mc-join ${jnd?"done":""}`}
                          onClick={()=>{const nv=!jnd;setJoined(p=>({...p,[jk]:nv}));showToast(nv?"Request sent!":"Request cancelled");}}
                          disabled={spotsLeft<=0&&!jnd}>
                          {jnd ? <><Check size={11} strokeWidth={2.5}/>Requested</> : <><UserPlus size={11} strokeWidth={2}/>I'm in!</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TEAM VS TEAM TAB ── */}
            {matchTab === "teams" && (
              <div style={{padding:"0 18px"}}>
                <div style={{fontSize:11,color:"var(--ink4)",fontWeight:500,marginBottom:12,lineHeight:1.5,background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:10,padding:"9px 12px",display:"flex",gap:7,alignItems:"flex-start"}}>
                  <AlertCircle size={13} color="#F97316" strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                  <span>Teams listed below have a booked ground and are looking for an opponent. Request to challenge — the captain will accept or decline.</span>
                </div>
                {TEAM_CHALLENGES.map((tc)=>{
                  const sp = sportObj(tc.sport);
                  const reqKey = tc.id;
                  const reqSent = teamReqs[reqKey];
                  return (
                    <div key={tc.id} className="tc">
                      <div className="tc-banner" style={{background:`linear-gradient(90deg,${sp.bg},${sp.fg}55)`}}/>
                      <div className="tc-body">
                        <div className="tc-top">
                          <div>
                            <div className="tc-team">{tc.teamName}</div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:sp.neon}}>
                                <NeonSportIcon id={tc.sport} color={sp.neon} size={13}/>{sp.label}
                              </div>
                            </div>
                          </div>
                          <div className="tc-format-tag">{tc.format}</div>
                        </div>
                        <div className="tc-detail">
                          <div className="tc-detail-row"><MapPin size={11} strokeWidth={2}/>{tc.groundName} · {tc.area}</div>
                          <div className="tc-detail-row"><Calendar size={11} strokeWidth={2}/>{tc.date} · {tc.time}</div>
                          <div className="tc-detail-row"><Users size={11} strokeWidth={2}/>{tc.teamSize} players per side needed</div>
                        </div>

                        {reqSent ? (
                          /* Captain view — sees incoming challenge request */
                          <div>
                            <div style={{fontSize:11,color:"var(--ink3)",fontWeight:600,marginBottom:8}}>📩 Challenge request received:</div>
                            <div className="tc-captain-row">
                              <div className="tc-captain-av">M</div>
                              <div>
                                <div className="tc-captain-name">Maaz's Team</div>
                                <div className="tc-phone">📞 {tc.phone} · Tap to call before accepting</div>
                              </div>
                            </div>
                            <div className="tc-accept-row">
                              <button className="tc-reject"
                                onClick={()=>{setTeamReqs(p=>({...p,[reqKey]:false}));showToast("Challenge declined");}}>
                                Decline
                              </button>
                              <button className="tc-accept"
                                onClick={()=>{showToast("Challenge accepted! Contact them to confirm.");}}>
                                <Check size={13} strokeWidth={2.5}/> Accept Challenge
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Player view — challenge button */
                          <div>
                            <div className="tc-captain-row" style={{marginBottom:0}}>
                              <div className="tc-captain-av">{tc.captain[0]}</div>
                              <div>
                                <div className="tc-captain-name">Captain: {tc.captain}</div>
                                <div className="tc-phone">Contact shown after acceptance</div>
                              </div>
                            </div>
                            <div style={{height:10}}/>
                            <button className="tc-challenge-btn"
                              onClick={()=>{setTeamReqs(p=>({...p,[reqKey]:true}));showToast("Challenge sent! Waiting for captain to respond.");}}>
                              <Swords size={13} strokeWidth={2}/> Challenge This Team
                            </button>
                            <div className="tc-pending-note">
                              <Shield size={10} strokeWidth={2}/> Captain's number revealed only after acceptance
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EXPLORE — rendered inside tab strip above */}
        {false && (
          <div>
            <div className="exp-head">
              <div className="exp-title" style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Compass size={17} color="#fff" strokeWidth={2}/>
                </div>
                Explore Grounds
              </div>
              <div className="exp-sub">Browse all venues across Karachi</div>
            </div>
            <div style={{height:14}}/>
            <div className="sport-section" style={{paddingBottom:8}}>
              <div className="sport-scroll" data-swipe-ignore="true">
                {SPORTS.map(s=>{
                  const on=sport===s.id;
                  return (
                    <div key={s.id} className={`sport-chip ${on?"on":""}`}
                      style={on?{background:s.bg}:{}} onClick={()=>setSport(s.id)}>
                      <div className="sport-chip-ico" style={{background:on?"rgba(255,255,255,.15)":s.bg}}>
                        <NeonSportIcon id={s.id} color={on?"#fff":s.neon} size={14}/>
                      </div>
                      <span className="sport-chip-label" style={on?{color:s.fg}:{}}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter button row */}
            <div style={{padding:"0 18px 8px",display:"flex",alignItems:"center",gap:8}}>
              <div className="search-box" style={{background:"#fff",border:"1.5px solid var(--border)",flex:1}}>
                <Search size={14} color="var(--ink4)" strokeWidth={2}/>
                <input className="search-input" style={{color:"var(--ink)"}} placeholder="Search by name or area..."
                  value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div style={{width:42,height:42,borderRadius:12,background:showFilterPanel||timeFilterFrom?"var(--ink)":"#fff",border:`1.5px solid ${showFilterPanel||timeFilterFrom?"var(--ink)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .2s"}}
                onClick={()=>setShowFilterPanel(p=>!p)}>
                <SlidersHorizontal size={16} color={showFilterPanel||timeFilterFrom?"#fff":"var(--ink4)"} strokeWidth={2}/>
              </div>
            </div>

            {/* Time filter panel */}
            {showFilterPanel && (
              <div className="filter-panel">
                <div className="filter-panel-title">
                  Filters
                  {(timeFilterFrom||timeFilterTo) && (
                    <span className="filter-clear" onClick={()=>{setTimeFilterFrom("");setTimeFilterTo("");}}>Clear all</span>
                  )}
                </div>
                <div style={{fontSize:11,fontWeight:700,color:"var(--ink2)",marginBottom:8}}>Available Time</div>
                <div className="time-filter-row">
                  <span className="time-filter-label">From</span>
                  <select className="time-filter-select" value={timeFilterFrom} onChange={e=>setTimeFilterFrom(e.target.value)}>
                    <option value="">Any time</option>
                    {["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"].map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="time-filter-row">
                  <span className="time-filter-label">To</span>
                  <select className="time-filter-select" value={timeFilterTo} onChange={e=>setTimeFilterTo(e.target.value)}>
                    <option value="">Any time</option>
                    {["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"].map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {timeFilterFrom && timeFilterTo && (
                  <div className="filter-active-badge" style={{marginTop:4}}>
                    <CheckCircle size={10} strokeWidth={2.5}/>
                    Showing grounds with slots {timeFilterFrom}–{timeFilterTo}
                  </div>
                )}
              </div>
            )}
            <div style={{padding:"0 18px 0"}}>
              {filtered.length===0 && (
                <div className="empty">
                  <div className="empty-ico-wrap"><Search size={24} color="var(--ink4)" strokeWidth={1.5}/></div>
                  <div className="empty-t">{timeFilterFrom?"No grounds available at that time":"No results"}</div>
                  <div className="empty-s">{timeFilterFrom?"Try adjusting your time filter":"Try a different search or sport"}</div>
                </div>
              )}
              <div className="glist">
                {filtered.map(g=>(
                  <div key={g.id} className="gcard" onClick={()=>openGround(g)}>
                    <div className="gcard-img-wrap">
                      <img className="gcard-img" src={gImg(g)} alt={g.name} onError={e=>{e.target.style.display="none";}}/>
                      <div className="gcard-overlay"/>
                      <div className="gcard-bl">
                        <div className="gcard-name">{g.name}</div>
                        <div className="gcard-area"><MapPin size={9} color="rgba(255,255,255,.6)" strokeWidth={2}/>{g.area}</div>
                      </div>
                      <div className="gcard-tr">
                        <div className="img-pill"><Star size={9} color="var(--amber)" fill="var(--amber)" strokeWidth={0}/> {g.rating}</div>
                      </div>
                      <div className="gcard-br"><div className="img-pill green">Rs {g.priceFrom.toLocaleString()}</div></div>
                    </div>
                    <div className="gcard-body">
                      <div className="gcard-info-row">
                        <div className="gcard-info-item"><Navigation size={12} color="var(--ink4)" strokeWidth={2}/>{g.distance}</div>
                        <div className="gcard-info-item"><Clock size={12} color="var(--ink4)" strokeWidth={2}/>{g.openFrom}–{g.openTill}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ OWNER ═══ */}
        {screen === "owner" && (
          <div className="screen active owner fade">
            <div className="owner-head">
              <button style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.08)",border:"none",borderRadius:9,padding:"7px 12px",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"Inter,sans-serif"}}
                onClick={()=>{
                  if (ownerSection === "list") setShowOwnerExitConfirm(true);
                  else { setScreen("home"); setNav("home"); }
                }}>
                <ArrowLeft size={14} strokeWidth={2}/> Back
              </button>
              <div className="owner-title">Ground Owner Portal</div>
              <div className="owner-sub">Manage your listing & availability</div>
            </div>

            {/* Tabs */}
            <div className="owner-tabs">
              <button className={`owner-tab ${ownerSection==="list"?"on":""}`} onClick={()=>setOwnerSection("list")}>
                <Upload size={13} strokeWidth={2}/> List Ground
              </button>
              <button className={`owner-tab ${ownerSection==="manage"?"on":""}`} onClick={()=>setOwnerSection("manage")}>
                <X size={13} strokeWidth={2}/> Block Slots
              </button>
              <button className={`owner-tab ${ownerSection==="register"?"on":""}`} onClick={()=>setOwnerSection("register")}>
                <Calendar size={13} strokeWidth={2}/> Register
              </button>
              <button className={`owner-tab ${ownerSection==="announce"?"on":""}`} onClick={()=>setOwnerSection("announce")}>
                <Bell size={13} strokeWidth={2}/> Board
              </button>
            </div>

            <div style={{height:14}}/>
            <div className="owner-body">

              {/* ── LIST GROUND TAB ── */}
              {ownerSection === "list" && (<>

                {/* Step indicator */}
                <div className="form-steps">
                  {[
                    {key:"facility", label:"Facility Info", num:"1"},
                    {key:"courts",   label:"Individual Grounds", num:"2"},
                  ].map(s=>(
                    <div key={s.key}
                      className={`form-step ${ownerFormStep===s.key?"on":ownerFormStep==="courts"&&s.key==="facility"?"done":""}`}
                      onClick={()=>setOwnerFormStep(s.key)}>
                      <div className="form-step-num">
                        {ownerFormStep==="courts"&&s.key==="facility" ? <Check size={10} strokeWidth={3}/> : s.num}
                      </div>
                      {s.label}
                    </div>
                  ))}
                </div>

                {/* ── STEP 1: FACILITY INFO ── */}
                {ownerFormStep === "facility" && (<>

                  {/* Photos — Supabase Storage upload */}
                  {/* SQL: INSERT INTO storage.buckets (id, name, public) VALUES ('ground-images', 'ground-images', true); */}
                  <div className="form-block">
                    <div className="form-block-t">Facility Photos</div>
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}}
                      onChange={async e => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        setPhotoUploading(true);
                        const urls = [];
                        for (const file of files.slice(0, 8)) {
                          const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                          const { data, error } = await supabase.storage.from('ground-images').upload(path, file, { upsert: true });
                          if (!error && data) {
                            const { data: pub } = supabase.storage.from('ground-images').getPublicUrl(data.path);
                            if (pub?.publicUrl) urls.push(pub.publicUrl);
                          }
                        }
                        if (urls.length) {
                          setUploadedImgUrls(prev => [...prev, ...urls]);
                          setOwnerImg(urls[0]);
                        }
                        setPhotoUploading(false);
                      }}
                    />
                    <div className={`photo-drop ${uploadedImgUrls.length > 0 || ownerImg ? "has-img" : ""}`}
                      onClick={() => !photoUploading && fileRef.current?.click()}>
                      {photoUploading ? (
                        <div style={{padding:"28px 18px",textAlign:"center"}}>
                          <RefreshCw size={22} color="var(--ink4)" strokeWidth={1.5} style={{animation:"spin 1s linear infinite"}}/>
                          <div style={{fontSize:12,color:"var(--ink4)",marginTop:8}}>Uploading…</div>
                        </div>
                      ) : uploadedImgUrls.length > 0 ? (
                        <div style={{padding:10}}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {uploadedImgUrls.map((url, idx) => (
                              <div key={idx} style={{position:"relative"}}>
                                <img src={url} alt="" style={{width:80,height:70,objectFit:"cover",borderRadius:10,display:"block"}}
                                  onError={e=>{e.target.style.display="none";}}/>
                                {idx === 0 && <div style={{position:"absolute",top:3,left:3,background:"var(--green-v)",color:"#fff",fontSize:8,fontWeight:800,borderRadius:5,padding:"2px 5px"}}>Cover</div>}
                                <div style={{position:"absolute",top:3,right:3,width:18,height:18,borderRadius:50,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                                  onClick={e=>{e.stopPropagation();setUploadedImgUrls(p=>p.filter((_,j)=>j!==idx));if(idx===0)setOwnerImg(uploadedImgUrls[1]||null);}}>
                                  <X size={10} color="#fff" strokeWidth={2.5}/>
                                </div>
                              </div>
                            ))}
                            {uploadedImgUrls.length < 8 && (
                              <div style={{width:80,height:70,borderRadius:10,border:"2px dashed var(--border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                                <Plus size={20} color="var(--ink4)" strokeWidth={1.5}/>
                              </div>
                            )}
                          </div>
                          <div style={{fontSize:10,color:"var(--ink4)",marginTop:8}}>{uploadedImgUrls.length} photo{uploadedImgUrls.length!==1?"s":""} uploaded · tap to add more</div>
                        </div>
                      ) : ownerImg ? (
                        <>
                          <img className="photo-preview-img" src={ownerImg} alt=""/>
                          <div className="photo-change-btn">
                            <Camera size={12} strokeWidth={2}/> Change Photo
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="upload-ico-wrap"><Upload size={22} color="var(--ink4)" strokeWidth={1.5}/></div>
                          <div className="upload-t">Upload Facility Photos</div>
                          <div className="upload-s">Up to 8 photos · tap to browse<br/>High quality photos get 3× more bookings</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Facility Details */}
                  <div className="form-block">
                    <div className="form-block-t">Facility Details</div>
                    <div className="info-note" style={{marginBottom:12}}>
                      <AlertCircle size={13} color="#92400E" strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                      This is your overall facility/complex profile. You will add each individual ground separately in Step 2.
                    </div>
                    {[
                      ["Facility / Complex Name","e.g. DHA Sports Complex", true],
                      ["Owner / Manager Name","Your full name", true],
                      ["Area / Neighbourhood","e.g. DHA Phase 6, Karachi", true],
                      ["City","e.g. Karachi, Lahore, Islamabad", false],
                      ["Full Address","Street, Block, Area — shown to players for directions", false],
                      ["Google Maps Link","Paste your Google Maps share link", false],
                    ].map(([l,p,required])=>(
                      <div key={l} className="fg">
                        <label className="flbl">{l}{required && <span style={{color:"var(--red)",marginLeft:3}}>*</span>}</label>
                        <input className="finput" placeholder={p}
                          value={l==="Facility / Complex Name" ? ownerFacilityName : l==="Area / Neighbourhood" ? ownerArea : undefined}
                          onChange={l==="Facility / Complex Name" ? e=>setOwnerFacilityName(e.target.value) : l==="Area / Neighbourhood" ? e=>setOwnerArea(e.target.value) : undefined}
                          style={required && ownerFormError && !ownerFacilityName && l==="Facility / Complex Name" ? {borderColor:"var(--red)"} : {}}
                        />
                      </div>
                    ))}
                    <div className="fg">
                      <label className="flbl">Facility Description</label>
                      <textarea className="finput fta" style={{height:80}} placeholder="Tell players about your complex — how many grounds, surface quality, facilities available, history..."
                        value={ownerDescription} onChange={e=>setOwnerDescription(e.target.value)}/>
                    </div>
                    <div className="fg">
                      <label className="flbl">Total Number of Grounds in this Facility</label>
                      <input className="finput" type="number" placeholder="e.g. 5"/>
                    </div>
                    <div className="fg">
                      <label className="flbl">Facility Type</label>
                      <div className="slot-dur-opts">
                        {["Indoor","Outdoor","Mixed"].map(t=>(
                          <div key={t} className={`slot-dur-opt ${ownerFacilityType===t?"on":""}`}
                            style={{fontSize:11}}
                            onClick={()=>setOwnerFacilityType(t)}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ground Location */}
                  <div className="form-block">
                    <div className="form-block-t">Ground Location</div>
                    <LocationPicker
                      lat={ownerLat} lng={ownerLng}
                      darkMode={darkMode}
                      onChange={(la, lo) => { setOwnerLat(la); setOwnerLng(lo); }}
                    />
                  </div>

                  {/* Operating Hours */}
                  <div className="form-block">
                    <div className="form-block-t">Facility Operating Hours</div>
                    <div className="time-pair">
                      <div className="fg"><label className="flbl">Opens At</label><input className="finput" type="time" value={ownerOpenFrom} onChange={e=>setOwnerOpenFrom(e.target.value)}/></div>
                      <div className="fg"><label className="flbl">Closes At</label><input className="finput" type="time" value={ownerOpenTill} onChange={e=>setOwnerOpenTill(e.target.value)}/></div>
                    </div>
                    <div className="fg">
                      <label className="flbl">Days Open</label>
                      <div className="slot-dur-opts" style={{flexWrap:"wrap",gap:6}}>
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
                          <div key={d}
                            className={`slot-dur-opt ${ownerDaysOpen.includes(d)?"on":""}`}
                            style={{minWidth:40,padding:"8px 6px",fontSize:11}}
                            onClick={()=>setOwnerDaysOpen(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d])}>
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="fg">
                      <label className="flbl">Break / Prayer Times (facility-wide)</label>
                      <div style={{fontSize:11,color:"var(--ink4)",marginBottom:8}}>These apply to all grounds. You can add ground-specific breaks in Step 2.</div>
                      {ownerBreaks.map((b,i)=>(
                        <div key={i} className="break-row">
                          <div className="break-label">Break {i+1}</div>
                          <input className="block-time-input" type="time" value={b.from}
                            onChange={e=>{const nb=[...ownerBreaks];nb[i].from=e.target.value;setOwnerBreaks(nb);}}/>
                          <div style={{fontSize:11,color:"var(--ink4)",fontWeight:600}}>to</div>
                          <input className="block-time-input" type="time" value={b.to}
                            onChange={e=>{const nb=[...ownerBreaks];nb[i].to=e.target.value;setOwnerBreaks(nb);}}/>
                          <button className="break-remove" onClick={()=>setOwnerBreaks(p=>p.filter((_,j)=>j!==i))}>
                            <X size={12} color="#DC2626" strokeWidth={2.5}/>
                          </button>
                        </div>
                      ))}
                      <button style={{display:"flex",alignItems:"center",gap:5,background:"transparent",border:"1.5px dashed var(--border)",borderRadius:10,padding:"8px 14px",fontSize:11,fontWeight:700,color:"var(--ink4)",cursor:"pointer",width:"100%",justifyContent:"center",fontFamily:"Inter,sans-serif"}}
                        onClick={()=>setOwnerBreaks(p=>[...p,{from:"13:00",to:"14:00"}])}>
                        <Plus size={13} strokeWidth={2.5}/> Add Break Period
                      </button>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="form-block">
                    <div className="form-block-t">Shared Amenities & Facilities</div>
                    <div className="amenity-grid">
                      {["Parking","Washrooms","Changing Room","Showers","Seating","Canteen","Café","Pro Shop","AC Lounge","Security","CCTV","First Aid","Prayer Area","Generator Backup","Wi-Fi","Spectator Area","Wheelchair Access","Valet Parking"].map(a=>(
                        <div key={a} className={`amenity-toggle ${ownerAmenities.includes(a)?"on":""}`}
                          onClick={()=>setOwnerAmenities(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a])}>
                          {ownerAmenities.includes(a) && <Check size={10} strokeWidth={3}/>} {a}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cancellation */}
                  <div className="form-block">
                    <div className="form-block-t">Booking Policy</div>
                    <div className="fg">
                      <label className="flbl">Late Booking Grace Period</label>
                      <div className="slot-dur-opts">
                        {["Not allowed","5 mins","10 mins","15 mins"].map(t=>(
                          <div key={t}
                            className={`slot-dur-opt ${ownerLateGrace===t?"on":""}`}
                            style={{fontSize:10,padding:"8px 6px"}}
                            onClick={()=>setOwnerLateGrace(t)}>
                            {t}
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:10,color:"var(--ink4)",marginTop:6,lineHeight:1.5}}>
                        Allow players to book a slot even after it has started — up to the selected grace period. Encourages walk-in bookings.
                      </div>
                    </div>
                    <div className="fg">
                      <label className="flbl">Cancellation Policy</label>
                      <div className="slot-dur-opts">
                        {["Flexible","Moderate","Strict"].map(p=>(
                          <div key={p}
                            className={`slot-dur-opt ${ownerCancPolicy===p?"on":""}`}
                            style={{fontSize:11}}
                            onClick={()=>setOwnerCancPolicy(p)}>
                            {p}
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:10,color:"var(--ink4)",marginTop:6}}>Flexible = free cancel 1hr before · Moderate = 3hr · Strict = no refund</div>
                    </div>
                    <div className="fg"><label className="flbl">Security Deposit per Booking (Rs, optional)</label>
                      <input className="finput" type="number" placeholder="e.g. 500"/>
                    </div>
                    <div className="fg"><label className="flbl">Minimum Advance Booking Time</label>
                      <div className="slot-dur-opts">
                        {["30 min","1 hr","2 hr","Same day","1 day prior"].map(t=>(
                          <div key={t}
                            className={`slot-dur-opt ${ownerMinAdvance===t?"on":""}`}
                            style={{fontSize:10,padding:"8px 6px"}}
                            onClick={()=>setOwnerMinAdvance(t)}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="fg"><label className="flbl">Facility Rules (optional)</label>
                      <textarea className="finput fta" placeholder="e.g. No smoking, Proper sports footwear required, No outside food..."/>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="form-block">
                    <div className="form-block-t">Contact</div>
                    <div className="fg">
                      <label className="flbl">Phone Number <span style={{color:"var(--red)"}}>*</span></label>
                      <input className="finput" type="tel" placeholder="03XX-XXXXXXX"
                        value={ownerPhone} onChange={e=>setOwnerPhone(e.target.value)}
                        style={ownerFormError && !ownerPhone ? {borderColor:"var(--red)"} : {}}/>
                    </div>
                    <div className="fg"><label className="flbl">WhatsApp (optional)</label><input className="finput" type="tel" placeholder="03XX-XXXXXXX"/></div>
                    <div className="fg"><label className="flbl">Instagram Handle (optional)</label><input className="finput" placeholder="@yourfacility"/></div>
                    <div className="fg"><label className="flbl">Facebook Page (optional)</label><input className="finput" placeholder="facebook.com/yourfacility"/></div>
                  </div>

                  {ownerFormError && (
                    <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:12,color:"#DC2626",fontWeight:600,display:"flex",alignItems:"center",gap:7}}>
                      <AlertCircle size={14} color="#DC2626" strokeWidth={2}/> {ownerFormError}
                    </div>
                  )}

                  <button className="book-btn" onClick={()=>{
                    if(!ownerFacilityName.trim()) {
                      setOwnerFormError("Please enter your facility name to continue.");
                      return;
                    }
                    if(!ownerPhone.trim()) {
                      setOwnerFormError("Please enter a phone number to continue.");
                      return;
                    }
                    setOwnerFormError("");
                    setOwnerFormStep("courts");
                  }}>
                    Continue — Add Individual Grounds →
                  </button>
                  <div style={{textAlign:"center",fontSize:11,color:"var(--ink4)",marginTop:10,marginBottom:20}}>
                    Step 1 of 2 · Fields marked <span style={{color:"var(--red)"}}>*</span> are required
                  </div>
                </>)}

                {/* ── STEP 2: INDIVIDUAL COURTS ── */}
                {ownerFormStep === "courts" && (<>

                  {/* Facility summary pill */}
                  <div className="facility-summary">
                    <div className="facility-summary-ico">
                      <MapPin size={16} color="var(--green-v)" strokeWidth={2}/>
                    </div>
                    <div>
                      <div className="facility-summary-name">Your Facility</div>
                      <div className="facility-summary-sub">Tap Edit to go back and update facility info</div>
                    </div>
                    <div className="facility-summary-edit" onClick={()=>setOwnerFormStep("facility")}>Edit</div>
                  </div>

                  <div className="info-note" style={{marginBottom:14}}>
                    <AlertCircle size={13} color="#92400E" strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                    <span>Add each ground separately. Each ground gets its own availability, sports, and pricing. Players will see them as individual listings under your facility name.</span>
                  </div>

                  {/* Court cards */}
                  {ownerCourts.map((court, ci)=>(
                    <div key={court.id} className="court-card">
                      <div className="court-card-header">
                        <div>
                          <div className="court-card-title">Ground {ci+1}</div>
                          <div style={{fontSize:10,color:"var(--ink4)",marginTop:2}}>Listed as a separate bookable ground</div>
                        </div>
                        {ownerCourts.length > 1 && (
                          <button className="court-remove-btn"
                            onClick={()=>setOwnerCourts(p=>p.filter(c=>c.id!==court.id))}>
                            <X size={11} strokeWidth={2.5}/> Remove
                          </button>
                        )}
                      </div>
                      <div className="court-card-body">
                        <div className="fg">
                          <label className="flbl">Ground Name / Label</label>
                          <input className="finput" placeholder="e.g. Cricket Ground, Football Pitch A, Tennis Court 1"
                            value={court.name}
                            onChange={e=>{const nc=[...ownerCourts];nc[ci].name=e.target.value;setOwnerCourts(nc);}}/>
                        </div>
                        <div className="fg">
                          <label className="flbl">Sports Playable on This Ground</label>
                          <div className="court-sport-mini">
                            {SPORTS.filter(s=>s.id!=="all").map(s=>(
                              <div key={s.id}
                                className={`court-sport-btn ${court.sports.includes(s.id)?"on":""}`}
                                onClick={()=>{
                                  const nc=[...ownerCourts];
                                  nc[ci].sports = court.sports.includes(s.id)
                                    ? court.sports.filter(x=>x!==s.id)
                                    : [...court.sports, s.id];
                                  setOwnerCourts(nc);
                                }}>
                                <NeonSportIcon id={s.id} color={court.sports.includes(s.id)?s.neon:s.bg} size={11}/>{s.label}
                              </div>
                            ))}
                          </div>
                          {court.sports.length > 1 && (
                            <div className="info-note" style={{marginTop:8}}>
                              <AlertCircle size={12} color="#92400E" strokeWidth={2} style={{flexShrink:0}}/>
                              <span>Multi-sport ground: when any sport is booked for a slot, the entire slot is locked — preventing double-bookings across sports.</span>
                            </div>
                          )}
                        </div>
                        <div className="fg">
                          <label className="flbl">Surface / Ground Type</label>
                          <div className="slot-dur-opts" style={{flexWrap:"wrap",gap:6}}>
                            {["Natural Grass","Artificial Turf","Hard Court","Clay","Wooden","Concrete","Synthetic"].map(t=>(
                              <div key={t} className={`slot-dur-opt ${court.type===t?"on":""}`}
                                style={{fontSize:10,padding:"7px 10px"}}
                                onClick={()=>{const nc=[...ownerCourts];nc[ci].type=t;setOwnerCourts(nc);}}>
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="time-pair">
                          <div className="fg">
                            <label className="flbl">Capacity (players)</label>
                            <input className="finput" type="number" placeholder="e.g. 22"
                              value={court.capacity}
                              onChange={e=>{const nc=[...ownerCourts];nc[ci].capacity=e.target.value;setOwnerCourts(nc);}}/>
                          </div>
                          <div className="fg">
                            <label className="flbl">Slot Duration</label>
                            <select className="finput" style={{cursor:"pointer"}}
                              value={court.slotDur}
                              onChange={e=>{const nc=[...ownerCourts];nc[ci].slotDur=e.target.value;setOwnerCourts(nc);}}>
                              {["1 hr","1.5 hr","2 hr","3 hr"].map(d=><option key={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="fg">
                          <label className="flbl">Pricing Model</label>
                          <div className="slot-dur-opts">
                            {[["fixed","Fixed Price (per slot)"],["per_person","Per Person (×players)"]].map(([v,l])=>(
                              <div key={v}
                                className={`slot-dur-opt ${court.pricingType===v?"on":""}`}
                                style={{fontSize:11}}
                                onClick={()=>{const nc=[...ownerCourts];nc[ci].pricingType=v;setOwnerCourts(nc);}}>
                                {l}
                              </div>
                            ))}
                          </div>
                          <div style={{fontSize:10,color:"var(--ink4)",marginTop:5}}>
                            {court.pricingType==="per_person" ? "Price entered is per player — total = price × number of players at booking" : "Price entered is the total for the entire slot regardless of player count"}
                          </div>
                        </div>
                        <div className="time-pair">
                          <div className="fg">
                            <label className="flbl">{court.pricingType==="per_person"?"Price Per Person (Rs)":"Base Price (Rs/slot)"}</label>
                            <input className="finput" type="number" placeholder={court.pricingType==="per_person"?"e.g. 300":"e.g. 2500"}
                              value={court.priceBase}
                              onChange={e=>{const nc=[...ownerCourts];nc[ci].priceBase=e.target.value;setOwnerCourts(nc);}}/>
                          </div>
                          <div className="fg">
                            <label className="flbl">{court.pricingType==="per_person"?"Peak Per Person (Rs)":"Peak Price (Rs/slot)"}</label>
                            <input className="finput" type="number" placeholder={court.pricingType==="per_person"?"e.g. 400":"e.g. 3500"}
                              value={court.pricePeak}
                              onChange={e=>{const nc=[...ownerCourts];nc[ci].pricePeak=e.target.value;setOwnerCourts(nc);}}/>
                          </div>
                        </div>
                        <div className="fg">
                          <label className="flbl">Ground-Specific Amenities (optional)</label>
                          <input className="finput" placeholder="e.g. Floodlit, Turf, Net provided, Scoreboard..."/>
                        </div>
                        <div className="fg">
                          <label className="flbl">Additional Notes (optional)</label>
                          <textarea className="finput fta" placeholder="Any specific info about this ground — dimensions, condition, special equipment..."
                            value={court.notes}
                            onChange={e=>{const nc=[...ownerCourts];nc[ci].notes=e.target.value;setOwnerCourts(nc);}}/>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add court button */}
                  <button className="add-court-btn"
                    onClick={()=>setOwnerCourts(p=>[...p,{id:Date.now(),name:`Ground ${p.length+1}`,sports:[],type:"",capacity:"",priceBase:"",pricePeak:"",slotDur:"2 hr",notes:"",pricingType:"fixed"}])}>
                    <Plus size={16} strokeWidth={2.5}/> Add Another Ground to This Facility
                  </button>

                  <div style={{background:"var(--green-l)",border:"1px solid var(--green)",borderRadius:12,padding:"12px 14px",marginBottom:13,fontSize:11,color:"var(--green-d)",fontWeight:600,lineHeight:1.5}}>
                    ✓ {ownerCourts.length} ground{ownerCourts.length!==1?"s":""} ready to list under your facility. Each will appear as a separate bookable listing on Outfield.
                  </div>

                  <button className="book-btn"
                    onClick={()=>{
                      // Validate at least one court has a name and sport
                      const invalid = ownerCourts.find(c => !c.name.trim() || c.sports.length === 0 || !c.priceBase);
                      if(invalid) {
                        showToast("Each ground needs a name, sport, and base price.");
                        return;
                      }
                      if (!session?.user?.id) {
                        showToast("You must be logged in to submit.");
                        return;
                      }
                      // Save to Supabase
                      (async () => {
                        const { data: groundData, error: gErr } = await supabase
                          .from('grounds')
                          .insert({
                            owner_id:      session.user.id,
                            name:          ownerFacilityName.trim() || "My Ground",
                            area:          ownerArea.trim() || "Karachi",
                            city:          authUser?.city || "Karachi",
                            description:   ownerDescription.trim() || "",
                            open_from:     ownerOpenFrom || "06:00",
                            open_till:     ownerOpenTill || "23:00",
                            amenities:     ownerAmenities.join(','),
                            contact_phone: ownerPhone.trim() || "",
                            img_url:       null,
                            rating:        0,
                            status:        "pending",
                            latitude:      ownerLat || 24.8607,
                            longitude:     ownerLng || 67.0011
                          })
                          .select()
                          .single();
                        if (gErr) {
                          console.error("Ground insert error:", gErr);
                          showToast("Submission failed: " + (gErr.message || "Please try again."));
                          return;
                        }
                        if (groundData) {
                          // Insert each court
                          const courtRows = ownerCourts.map(c => ({
                            ground_id:          groundData.id,
                            name:               c.name.trim() || "Ground",
                            sports:             c.sports.join(','),
                            surface_type:       c.type || "Outdoor",
                            capacity:           parseInt(c.capacity) || null,
                            price_base:         parseInt(c.priceBase) || 0,
                            price_peak:         parseInt(c.pricePeak) || parseInt(c.priceBase) || 0,
                            slot_duration_mins: c.slotDur === "1 hr" ? 60 : c.slotDur === "1.5 hr" ? 90 : c.slotDur === "3 hr" ? 180 : 120,
                            notes:              c.notes || "",
                            pricing_type:       c.pricingType || "fixed"
                          }));
                          const { error: cErr } = await supabase.from('courts').insert(courtRows);
                          if (cErr) console.error("Courts insert error:", cErr);
                          showToast("Submitted! We'll review and go live within 24 hours.");
                          // Navigate to owner dashboard
                          setOwnerSection("list");
                          setOwnerFormStep("facility");
                          setScreen("home");
                          setNav("home");
                          setTabIndex(0);
                        }
                      })();
                    }}>
                    Submit Facility for Review
                  </button>
                  <div style={{textAlign:"center",fontSize:11,color:"var(--ink4)",marginTop:10,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <Shield size={12} color="var(--ink4)" strokeWidth={2}/> Free to list · Reviewed within 24 hours
                  </div>
                </>)}
              </>)}

              {/* ── BLOCK SLOTS TAB ── */}
              {ownerSection === "manage" && (<>
                <div className="info-note" style={{marginBottom:16}}>
                  <AlertCircle size={13} color="#92400E" strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                  <span>Block specific slots to make them <strong>unavailable</strong> — for maintenance, personal use, or any reason. Blocked slots cannot be booked by players but are <strong>not</strong> marked as booked.</span>
                </div>

                <div style={{fontSize:11,fontWeight:800,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Currently Blocked</div>

                {blockedSlots.length===0 && (
                  <div className="empty" style={{padding:"28px 24px"}}>
                    <div className="empty-ico-wrap"><X size={20} color="var(--ink4)" strokeWidth={1.5}/></div>
                    <div className="empty-t">No blocked slots</div>
                    <div className="empty-s">Add a block below to hide a slot from players</div>
                  </div>
                )}

                {blockedSlots.map((b,i)=>(
                  <div key={i} className="block-slot-row">
                    <div>
                      <div className="block-slot-time">{b.date} · {b.from} – {b.to}</div>
                      <div className="block-slot-reason">{b.reason || "No reason specified"}</div>
                    </div>
                    <div className="block-slot-badge">Blocked</div>
                    <button style={{marginLeft:6,width:28,height:28,borderRadius:8,background:"#FEF2F2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}
                      onClick={()=>setBlockedSlots(p=>p.filter((_,j)=>j!==i))}>
                      <X size={12} color="#DC2626" strokeWidth={2.5}/>
                    </button>
                  </div>
                ))}

                <div style={{fontSize:11,fontWeight:800,color:"var(--ink3)",textTransform:"uppercase",letterSpacing:"1px",margin:"16px 0 10px"}}>Block a New Slot</div>

                <div className="form-block" style={{marginBottom:10}}>
                  <div className="fg"><label className="flbl">Date</label>
                    <input className="finput" type="date"/>
                  </div>
                  <div className="time-pair">
                    <div className="fg"><label className="flbl">From</label><input className="finput" type="time" defaultValue="12:00"/></div>
                    <div className="fg"><label className="flbl">To</label><input className="finput" type="time" defaultValue="14:00"/></div>
                  </div>
                  <div className="fg"><label className="flbl">Reason (optional)</label>
                    <input className="finput" placeholder="e.g. Maintenance, Private event..."/>
                  </div>
                  <button className="block-add-btn" style={{width:"100%",justifyContent:"center",marginTop:4,borderRadius:12,padding:"12px"}}
                    onClick={()=>{
                      setBlockedSlots(p=>[...p,{date:"Mar 12",from:"12:00",to:"14:00",reason:"Maintenance"}]);
                      showToast("Slot blocked successfully");
                    }}>
                    <X size={13} strokeWidth={2.5}/> Block This Slot
                  </button>
                </div>

                <div className="info-note">
                  <Shield size={13} color="#92400E" strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                  <span>Blocked slots are hidden from players instantly. They will see "Unavailable" if they try to access that time. Only you can unblock them.</span>
                </div>
              </>)}

              {/* ── REGISTER TAB ── */}
              {ownerSection === "register" && (<>
                <div className="reg-header">
                  <div style={{fontSize:13,fontWeight:800,color:"var(--ink2)",marginBottom:6}}>Daily Booking Register</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <input
                      type="date"
                      className="finput"
                      style={{flex:1,fontSize:13}}
                      value={ownerRegDate}
                      onChange={e=>setOwnerRegDate(e.target.value)}
                    />
                    <div style={{fontSize:11,color:"var(--ink4)",flexShrink:0,fontWeight:600}}>
                      {(() => {
                        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                        const [y,m,d] = ownerRegDate.split('-').map(Number);
                        return `${months[m-1]} ${d}, ${y}`;
                      })()}
                    </div>
                  </div>
                </div>

                {ownerRegLoading ? (
                  <div className="bh-loading"><RefreshCw size={14} color="var(--ink4)" strokeWidth={2}/> Loading…</div>
                ) : ownerRegBookings.length === 0 ? (
                  <div className="reg-empty">
                    <Calendar size={24} color="var(--ink4)" strokeWidth={1.5}/>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--ink3)",marginTop:8}}>No bookings on this date</div>
                  </div>
                ) : (<>
                  {/* Register table */}
                  <div className="reg-table">
                    <div className="reg-row reg-row-head">
                      <div className="reg-col reg-col-time">Time</div>
                      <div className="reg-col reg-col-ground">Ground</div>
                      <div className="reg-col reg-col-player">Player</div>
                      <div className="reg-col reg-col-price">Amount</div>
                    </div>
                    {ownerRegBookings.map((b, i) => (
                      <div key={b.id || i} className={`reg-row ${i % 2 === 0 ? "even" : "odd"}`}>
                        <div className="reg-col reg-col-time">
                          <div style={{fontWeight:700,fontSize:11}}>{b.start_time}</div>
                          <div style={{fontSize:10,color:"var(--ink4)"}}>–{b.end_time}</div>
                        </div>
                        <div className="reg-col reg-col-ground">
                          <div style={{fontWeight:600,fontSize:11,color:"var(--ink2)"}}>{b.groundName}</div>
                          <div style={{fontSize:10,color:"var(--ink4)"}}>{b.courtName}</div>
                        </div>
                        <div className="reg-col reg-col-player">
                          <div style={{fontWeight:600,fontSize:11,color:"var(--ink2)"}}>{b.users?.name || "—"}</div>
                          <div style={{fontSize:10,color:"var(--ink4)"}}>{b.users?.phone || ""}</div>
                          {b.player_count > 1 && <div style={{fontSize:10,color:"var(--ink4)"}}>{b.player_count} players</div>}
                        </div>
                        <div className="reg-col reg-col-price">
                          <div style={{fontWeight:700,fontSize:12,color:"var(--green-d)"}}>Rs {(b.total_price||0).toLocaleString()}</div>
                          <div className={`reg-status ${b.status}`}>{b.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Daily totals */}
                  <div className="reg-totals">
                    <div className="reg-total-row">
                      <span>Total Bookings</span>
                      <span style={{fontWeight:800}}>{ownerRegBookings.length}</span>
                    </div>
                    <div className="reg-total-row">
                      <span>Total Revenue</span>
                      <span style={{fontWeight:800,color:"var(--green-d)"}}>
                        Rs {ownerRegBookings.filter(b=>b.status==="confirmed").reduce((s,b)=>s+(b.total_price||0),0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>)}
              </>)}

              {/* ── ANNOUNCEMENTS TAB ── */}
              {ownerSection === "announce" && (<>
                <div className="info-note" style={{marginBottom:14}}>
                  <AlertCircle size={13} color="#92400E" strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
                  <span>Post a notice for players who have booked your ground. e.g. "Ground closed Friday for maintenance."</span>
                </div>
                <div className="form-block" style={{marginBottom:14}}>
                  <div className="form-block-t">New Announcement</div>
                  {ownerGrounds.length > 1 && (
                    <div className="fg" style={{marginBottom:10}}>
                      <label className="flbl">Ground</label>
                      <select className="finput" style={{cursor:"pointer"}}
                        value={blockGroundId}
                        onChange={e=>setBlockGroundId(e.target.value)}>
                        <option value="">All my grounds</option>
                        {ownerGrounds.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  )}
                  <textarea className="finput fta" style={{height:72}}
                    placeholder="Type your announcement here..."
                    value={ownerAnnMsg} onChange={e=>setOwnerAnnMsg(e.target.value)}/>
                  <button className="book-btn" style={{marginTop:10}}
                    disabled={!ownerAnnMsg.trim() || ownerAnnLoading}
                    onClick={async()=>{
                      if (!ownerAnnMsg.trim() || !session?.user) return;
                      setOwnerAnnLoading(true);
                      const groundId = blockGroundId || (ownerGrounds[0]?.id || null);
                      const { data, error } = await supabase.from('announcements').insert({
                        owner_id: session.user.id,
                        ground_id: groundId,
                        message: ownerAnnMsg.trim()
                      }).select().single();
                      if (!error && data) {
                        setOwnerAnnouncements(p=>[data,...p]);
                        setOwnerAnnMsg("");
                        showToast("Announcement posted!");
                      } else {
                        console.error("Announcement error:", error);
                        showToast("Failed to post announcement");
                      }
                      setOwnerAnnLoading(false);
                    }}>
                    {ownerAnnLoading ? "Posting…" : "Post Announcement"}
                  </button>
                </div>
                {ownerAnnouncements.length === 0 ? (
                  <div className="reg-empty">
                    <Bell size={22} color="var(--ink4)" strokeWidth={1.5}/>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--ink3)",marginTop:8}}>No announcements yet</div>
                  </div>
                ) : ownerAnnouncements.map((a,i)=>(
                  <div key={a.id||i} className="ann-card">
                    <div className="ann-msg">{a.message}</div>
                    <div className="ann-meta">{new Date(a.created_at).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})}</div>
                    <button className="ann-delete" onClick={async()=>{
                      await supabase.from('announcements').delete().eq('id',a.id);
                      setOwnerAnnouncements(p=>p.filter(x=>x.id!==a.id));
                    }}>
                      <X size={12} strokeWidth={2.5}/>
                    </button>
                  </div>
                ))}
              </>)}
            </div>
          </div>
        )}

        {/* ═══ BOOKING HISTORY ═══ */}
        {screen === "bookingHistory" && (
          <div className="screen active fade" style={{background:"var(--bg)",overflowY:"auto",paddingBottom:88,minHeight:"100svh"}}>
            {/* Cancel confirmation dialog */}
            {cancelConfirmId && (
              <div className="cancel-overlay" onClick={e=>{if(e.target.className==="cancel-overlay")setCancelConfirmId(null);}}>
                <div className="cancel-sheet">
                  <div className="cancel-title">Cancel this booking?</div>
                  <div className="cancel-sub">This action cannot be undone. The slot will become available to other players.</div>
                  <div className="cancel-actions">
                    <button className="cancel-no" onClick={()=>setCancelConfirmId(null)}>Keep it</button>
                    <button className="cancel-yes" onClick={()=>handleCancelBooking(cancelConfirmId)}>Yes, cancel</button>
                  </div>
                </div>
              </div>
            )}
            <div className="bh-head">
              <div className="bh-back" onClick={()=>setScreen("profile")}>
                <ArrowLeft size={18} color="#fff" strokeWidth={2.5}/>
              </div>
              <div className="bh-title">My Bookings</div>
            </div>
            <div className="bh-body">
              {bookingHistoryLoading ? (
                <div className="bh-loading">
                  <RefreshCw size={16} color="var(--ink4)" strokeWidth={2}/>
                  Loading bookings…
                </div>
              ) : bookingHistory.length === 0 ? (
                <div className="bh-empty">
                  <div className="bh-empty-ico">
                    <Calendar size={24} color="var(--ink4)" strokeWidth={1.5}/>
                  </div>
                  <div className="bh-empty-t">No bookings yet</div>
                  <div className="bh-empty-s">Your confirmed bookings will appear here once you book a ground.</div>
                </div>
              ) : bookingHistory.map((b, i) => {
                const groundName = b.courts?.grounds?.name || b.courts?.name || "Ground";
                const courtName  = b.courts?.name || null;
                const statusCls  = b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending";
                const canCancel  = b.status === "confirmed" && isFutureBooking(b.booking_date);
                return (
                  <div key={b.id || i} className="bh-card">
                    <div className="bh-card-top">
                      <div className="bh-ground">{groundName}{courtName && courtName !== groundName ? ` · ${courtName}` : ""}</div>
                      <div className={`bh-status ${statusCls}`}>{b.status || "confirmed"}</div>
                    </div>
                    <div className="bh-meta">
                      <div className="bh-meta-item">
                        <Calendar size={11} strokeWidth={2.5}/>
                        {b.booking_date}
                      </div>
                      <div className="bh-meta-item">
                        <Clock size={11} strokeWidth={2.5}/>
                        {b.start_time} – {b.end_time}
                      </div>
                    </div>
                    <div className="bh-divider"/>
                    <div className="bh-bottom">
                      <div className="bh-ref">{b.booking_ref || "—"}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {canCancel && (
                          <button className="bh-cancel-btn" onClick={()=>setCancelConfirmId(b.id)}>
                            Cancel
                          </button>
                        )}
                        <div className="bh-price">Rs {(b.total_price || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ EDIT PROFILE ═══ */}
        {screen === "editProfile" && (
          <div className="screen active fade" style={{background:"var(--bg)",overflowY:"auto",paddingBottom:88,minHeight:"100svh"}}>
            <div className="bh-head">
              <div className="bh-back" onClick={()=>setScreen("profile")}>
                <ArrowLeft size={18} color="#fff" strokeWidth={2.5}/>
              </div>
              <div className="bh-title">Edit Profile</div>
            </div>
            <div style={{padding:"20px 18px",display:"flex",flexDirection:"column",gap:14}}>
              <div className="fg">
                <label className="flbl">Full Name <span style={{color:"var(--red)"}}>*</span></label>
                <input className="finput" placeholder="Your full name" value={editName} onChange={e=>setEditName(e.target.value)}/>
              </div>
              <div className="fg">
                <label className="flbl">Phone Number</label>
                <input className="finput" type="tel" placeholder="03XX-XXXXXXX" value={editPhone} onChange={e=>setEditPhone(e.target.value)}/>
              </div>
              <div className="fg">
                <label className="flbl">City</label>
                <select className="finput" style={{cursor:"pointer"}} value={editCity} onChange={e=>setEditCity(e.target.value)}>
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button className="book-btn" style={{marginTop:6}}
                disabled={!editName.trim() || editProfileSaving}
                onClick={handleSaveProfile}>
                {editProfileSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* PROFILE — rendered inside tab strip above */}
        {false && (
          <div>
            <div className="prof-head">
              <div className="prof-glow"/>
              <button className="prof-edit-btn"
                onClick={()=>{setEditName(authUser?.name||"");setEditPhone(authUser?.phone||"");setEditCity(authUser?.city||"");setScreen("editProfile");}}>
                Edit Profile
              </button>
              <div className="prof-av-wrap">
                <div className="prof-av">
                  <User size={30} color="#fff" strokeWidth={1.5}/>
                </div>
                <div className="prof-av-badge">
                  <Check size={11} color="#fff" strokeWidth={3}/>
                </div>
              </div>
              <div className="prof-name">{authUser?.name || "Player"}</div>
              <div className="prof-sub">{authUser?.city || "Pakistan"} · {authUser?.role === "owner" ? "Ground Owner" : "Player"}</div>
            </div>
            <div style={{height:14}}/>
            <div className="prof-body">
              {/* ── Stats ── */}
              <div className="stat-row">
                {[
                  [bookingHistoryLoading ? "…" : String(bookingHistory.length), "Bookings"],
                  ["0","Sports"],
                  ["0","Matches"]
                ].map(([n,l])=>(
                  <div key={l} className="stat-card">
                    <div className="stat-n">{n}</div>
                    <div className="stat-l">{l}</div>
                  </div>
                ))}
              </div>

              {/* ── My Bookings ── */}
              <div className="prof-section-head">
                <div className="prof-section-title">My Bookings</div>
                {bookingHistory.length > 0 && (
                  <div className="prof-section-count">{bookingHistory.length}</div>
                )}
              </div>

              {bookingHistoryLoading ? (
                <div className="bh-loading" style={{padding:"18px 0"}}>
                  <RefreshCw size={14} color="var(--ink4)" strokeWidth={2}/> Loading…
                </div>
              ) : bookingHistory.length === 0 ? (
                <div className="prof-bookings-empty">
                  <Calendar size={20} color="var(--ink4)" strokeWidth={1.5}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--ink2)"}}>No bookings yet</div>
                    <div style={{fontSize:11,color:"var(--ink4)",marginTop:2}}>Book a ground to see it here</div>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                  {bookingHistory.map((b, i) => {
                    const groundName = b.courts?.grounds?.name || b.courts?.name || "Ground";
                    const courtLabel = b.courts?.name && b.courts.name !== groundName ? ` · ${b.courts.name}` : "";
                    const statusCls  = b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending";
                    return (
                      <div key={b.id || i} className="bh-card">
                        <div className="bh-card-top">
                          <div className="bh-ground">{groundName}{courtLabel}</div>
                          <div className={`bh-status ${statusCls}`}>{b.status || "confirmed"}</div>
                        </div>
                        <div className="bh-meta">
                          <div className="bh-meta-item">
                            <Calendar size={11} strokeWidth={2.5}/>{b.booking_date}
                          </div>
                          <div className="bh-meta-item">
                            <Clock size={11} strokeWidth={2.5}/>{b.start_time} – {b.end_time}
                          </div>
                        </div>
                        <div className="bh-divider"/>
                        <div className="bh-bottom">
                          <div className="bh-ref">{b.booking_ref || "—"}</div>
                          <div className="bh-price">Rs {(b.total_price || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Menu rows ── */}
              <div className="prof-list">
                {[
                  {I:UserPlus, bg:"#FEF3C7", c:"#D97706", t:"Matchmaking History", s:"Games joined or hosted", action:null},
                  {I:Heart,    bg:"#FCE7F3", c:"#DB2777", t:"Favourite Grounds",   s:"Your saved venues",      action:null},
                  {I:Bell,     bg:"#DCFCE7", c:"#16A34A", t:"Notifications",       s:"Booking alerts & requests", action:null},
                ].map((r,i)=>(
                  <div key={i} className="prof-row" onClick={r.action || undefined}>
                    <div className="prof-row-ico" style={{background:r.bg}}>
                      <r.I size={17} color={r.c} strokeWidth={2}/>
                    </div>
                    <div>
                      <div className="prof-row-t">{r.t}</div>
                      <div className="prof-row-s">{r.s}</div>
                    </div>
                    <div className="prof-row-arr"><ChevronRight size={16} strokeWidth={2}/></div>
                  </div>
                ))}

                {/* ── Settings / Dark mode ── */}
                <div className="dm-section">
                  <div className="dm-row">
                    <div className="dm-row-left">
                      <div className="dm-row-ico" style={{background:"#F3F4F6"}}>
                        <SlidersHorizontal size={17} color="#4B5563" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="dm-row-t">Dark mode</div>
                        <div className="dm-row-s">Override theme manually</div>
                      </div>
                    </div>
                    <button
                      className={`dm-toggle ${darkMode ? 'on' : 'off'}`}
                      onClick={() => { if (!autoDarkMode) setDarkMode(d => !d); }}
                      style={autoDarkMode ? {opacity:.4,pointerEvents:'none'} : {}}
                    />
                  </div>
                  <div className="dm-row">
                    <div className="dm-row-left">
                      <div className="dm-row-ico" style={{background:"#EFF6FF"}}>
                        <Clock size={17} color="#3B82F6" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="dm-row-t">Auto dark mode</div>
                        <div className="dm-row-s">Dark after 6 PM · Light after 6 AM</div>
                      </div>
                    </div>
                    <button
                      className={`dm-toggle ${autoDarkMode ? 'on' : 'off'}`}
                      onClick={() => setAutoDarkMode(a => !a)}
                    />
                  </div>
                  <div className="dm-note">Auto mode overrides the manual toggle above.</div>
                </div>
                <div className="prof-row" style={{marginTop:8}} onClick={handleLogout}>
                  <div className="prof-row-ico" style={{background:"#FEF2F2"}}>
                    <ArrowLeft size={17} color="#DC2626" strokeWidth={2}/>
                  </div>
                  <div>
                    <div className="prof-row-t" style={{color:"#DC2626"}}>Sign Out</div>
                    <div className="prof-row-s">{session?.user?.email}</div>
                  </div>
                  <div className="prof-row-arr"><ChevronRight size={16} strokeWidth={2}/></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ QUICK BLOCK SHEET ═══ */}
        {showBlockSheet && (
          <div className="cancel-overlay" onClick={e=>{if(e.target.className==="cancel-overlay")setShowBlockSheet(false);}}>
            <div className="cancel-sheet" style={{paddingBottom:24}}>
              <div className="cancel-title">Block a Slot</div>
              <div className="cancel-sub" style={{marginBottom:14}}>Players won't be able to book this slot. It will show as "Unavailable".</div>
              {ownerGrounds.length > 1 && (
                <div className="fg" style={{marginBottom:10}}>
                  <select className="finput" style={{cursor:"pointer"}}
                    value={blockGroundId}
                    onChange={e=>setBlockGroundId(e.target.value)}>
                    {ownerGrounds.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}
              <div className="fg" style={{marginBottom:10}}>
                <label className="flbl">Date</label>
                <input className="finput" type="date" value={blockDate} onChange={e=>setBlockDate(e.target.value)}/>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <div className="fg" style={{flex:1}}>
                  <label className="flbl">From</label>
                  <input className="finput" type="time" value={blockFrom} onChange={e=>setBlockFrom(e.target.value)}/>
                </div>
                <div className="fg" style={{flex:1}}>
                  <label className="flbl">To</label>
                  <input className="finput" type="time" value={blockTo} onChange={e=>setBlockTo(e.target.value)}/>
                </div>
              </div>
              <div className="fg" style={{marginBottom:14}}>
                <input className="finput" placeholder="Reason (optional)" value={blockReason} onChange={e=>setBlockReason(e.target.value)}/>
              </div>
              <div className="cancel-actions">
                <button className="cancel-no" onClick={()=>setShowBlockSheet(false)}>Cancel</button>
                <button className="cancel-yes" onClick={async()=>{
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const [y,m,d] = blockDate.split('-').map(Number);
                  const dateLabel = `${months[m-1]} ${d}`;
                  await supabase.from('blocked_slots').insert({
                    owner_id: session?.user?.id,
                    ground_id: blockGroundId || null,
                    date: dateLabel,
                    start_time: blockFrom,
                    end_time: blockTo,
                    reason: blockReason.trim() || null
                  });
                  setBlockedSlots(p=>[...p,{date:dateLabel,from:blockFrom,to:blockTo,reason:blockReason}]);
                  setShowBlockSheet(false);
                  setBlockReason("");
                  showToast("Slot blocked successfully");
                }}>
                  Block Slot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FAVOURITE GROUNDS OVERLAY ═══ */}
        {showFavScreen && (
          <div style={{position:"fixed",inset:0,background:"var(--bg)",zIndex:900,overflowY:"auto",paddingBottom:88,maxWidth:430,margin:"0 auto"}}>
            <div className="bh-head">
              <div className="bh-back" onClick={()=>setShowFavScreen(false)}>
                <ArrowLeft size={18} color="#fff" strokeWidth={2.5}/>
              </div>
              <div className="bh-title">Favourite Grounds</div>
            </div>
            <div style={{padding:"16px 18px"}}>
              {favGrounds.length === 0 && favGroundIds.size === 0 ? (
                <div className="bh-empty">
                  <div className="bh-empty-ico"><Heart size={24} color="var(--ink4)" strokeWidth={1.5}/></div>
                  <div className="bh-empty-t">No favourites yet</div>
                  <div className="bh-empty-s">Tap the heart on any ground to save it here.</div>
                </div>
              ) : favGrounds.length === 0 ? (
                <div className="bh-loading"><RefreshCw size={14} color="var(--ink4)" strokeWidth={2}/> Loading…</div>
              ) : (
                <div className="glist">
                  {favGrounds.map(g => (
                    <div key={g.id} className="gcard" onClick={()=>{setShowFavScreen(false);openGround({...g,sports:["cricket","football"],amenities:[],priceFrom:2000,distance:"—",openFrom:"06:00",openTill:"23:00",isFacility:false,courts:[],slots:{"default":[]}});}}>
                      <div className="gcard-img-wrap">
                        {g.img_url
                          ? <img className="gcard-img" src={g.img_url} alt={g.name} onError={e=>{e.target.style.display="none";}}/>
                          : <div className="gcard-img" style={{background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}><MapPin size={28} color="rgba(255,255,255,.2)" strokeWidth={1.5}/></div>
                        }
                        <div className="gcard-overlay"/>
                        <div className="gcard-bl">
                          <div className="gcard-name">{g.name}</div>
                          <div className="gcard-area"><MapPin size={9} color="rgba(255,255,255,.6)" strokeWidth={2}/>{g.area}</div>
                        </div>
                        {g.rating && <div className="gcard-tr"><div className="img-pill"><Star size={9} color="var(--amber)" fill="var(--amber)" strokeWidth={0}/> {g.rating}</div></div>}
                        <button style={{position:"absolute",top:10,right:10,width:30,height:30,borderRadius:10,background:"rgba(0,0,0,.5)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                          onClick={e=>{e.stopPropagation();handleToggleFav(g.id);}}>
                          <Heart size={14} fill="#ef4444" color="#ef4444" strokeWidth={2}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ OWNER EXIT CONFIRMATION ═══ */}
        {showOwnerExitConfirm && (
          <div className="cancel-overlay" onClick={e=>{if(e.target.className==="cancel-overlay")setShowOwnerExitConfirm(false);}}>
            <div className="cancel-sheet">
              <div className="cancel-title">Exit listing form?</div>
              <div className="cancel-sub">Your progress will be lost. Are you sure?</div>
              <div className="cancel-actions">
                <button className="cancel-no" onClick={()=>setShowOwnerExitConfirm(false)}>Keep editing</button>
                <button className="cancel-yes" onClick={()=>{setShowOwnerExitConfirm(false);setScreen("home");setNav("home");setTabIndex(0);}}>Yes, exit</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ NAV BAR ═══ */}
        {!["splash","onboard","success","owner"].includes(screen) && (
          <div className="navbar">
            {[
              {id:"home",    Icon:Home,    label:"Home"},
              {id:"explore", Icon:Compass, label:"Explore"},
              {id:"map",     Icon:Map,     label:"Map"},
              {id:"match",   Icon:UserPlus,label:"Matchmaking"},
              {id:"profile", Icon:User,    label:"Profile"},
            ].map(n=>{
              const on = nav===n.id;
              return (
                <div key={n.id} className={`nav-item ${on?"on":""}`} onClick={()=>goNav(n.id)}>
                  <div className="nav-ico-wrap">
                    <n.Icon size={20} color={on?"var(--green-d)":"var(--ink4)"} strokeWidth={on?2.5:2}/>
                  </div>
                  <div className="nav-lbl">{n.label}</div>
                </div>
              );
            })}
          </div>
        )}
        </>)}
      </div>
    </>
  );
}