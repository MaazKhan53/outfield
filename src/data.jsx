import {
    Lightbulb, Car, Droplets, Activity, Armchair, Coffee, 
    Shield, Lock, ShoppingBag, Wifi, Trophy
  } from "lucide-react";
  
  export const SPORTS = [
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
  
  export const NeonSportIcon = ({ id, color="#fff", size=18 }) => {
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
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <line x1="4" y1="16" x2="12" y2="4" strokeWidth="4" strokeLinecap="round" {...base}/>
          <line x1="12" y1="4" x2="15" y2="1.5" strokeWidth="1.8" strokeLinecap="round" {...base}/>
          <circle cx="16" cy="13" r="2.8" strokeWidth="1.5" {...base}/>
          <path d="M13.8 11.5 Q16 13 18.2 11.5" strokeWidth="1" {...base}/>
          <path d="M13.8 14.5 Q16 13 18.2 14.5" strokeWidth="1" {...base}/>
        </svg>
      ),
      football: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" {...base}/>
          <polygon points="10,5.5 12.5,7.5 11.5,10.5 8.5,10.5 7.5,7.5" strokeWidth="1" {...base}/>
          <line x1="10" y1="5.5" x2="10" y2="2.5" strokeWidth="0.9" {...base}/>
          <line x1="12.5" y1="7.5" x2="15.5" y2="6" strokeWidth="0.9" {...base}/>
          <line x1="11.5" y1="10.5" x2="13.5" y2="13" strokeWidth="0.9" {...base}/>
          <line x1="8.5" y1="10.5" x2="6.5" y2="13" strokeWidth="0.9" {...base}/>
          <line x1="7.5" y1="7.5" x2="4.5" y2="6" strokeWidth="0.9" {...base}/>
        </svg>
      ),
      paddle: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <ellipse cx="8" cy="8" rx="5.5" ry="6" strokeWidth="1.5" {...base}/>
          <line x1="4" y1="6" x2="12" y2="6" strokeWidth="0.7" {...base}/>
          <line x1="3.5" y1="8" x2="12.5" y2="8" strokeWidth="0.7" {...base}/>
          <line x1="4" y1="10" x2="12" y2="10" strokeWidth="0.7" {...base}/>
          <line x1="6" y1="2.5" x2="6" y2="13.5" strokeWidth="0.7" {...base}/>
          <line x1="8" y1="2" x2="8" y2="14" strokeWidth="0.7" {...base}/>
          <line x1="10" y1="2.5" x2="10" y2="13.5" strokeWidth="0.7" {...base}/>
          <line x1="8" y1="14" x2="14" y2="19" strokeWidth="1.8" {...base}/>
          <circle cx="16" cy="5" r="2" strokeWidth="1.3" {...base}/>
        </svg>
      ),
      basketball: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" {...base}/>
          <path d="M10 2.5 Q13 6 13 10 Q13 14 10 17.5" strokeWidth="1.1" {...base}/>
          <path d="M10 2.5 Q7 6 7 10 Q7 14 10 17.5" strokeWidth="1.1" {...base}/>
          <line x1="2.5" y1="10" x2="17.5" y2="10" strokeWidth="1.1" {...base}/>
        </svg>
      ),
      badminton: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <ellipse cx="10" cy="16" rx="2.5" ry="2" strokeWidth="1.5" {...base}/>
          <ellipse cx="10" cy="7" rx="6" ry="2" strokeWidth="1.2" {...base}/>
          <line x1="4" y1="7" x2="8.2" y2="14" strokeWidth="1.1" {...base}/>
          <line x1="7" y1="5.2" x2="9.5" y2="14" strokeWidth="1.1" {...base}/>
          <line x1="10" y1="5" x2="10" y2="14" strokeWidth="1.1" {...base}/>
          <line x1="13" y1="5.2" x2="10.5" y2="14" strokeWidth="1.1" {...base}/>
          <line x1="16" y1="7" x2="11.8" y2="14" strokeWidth="1.1" {...base}/>
        </svg>
      ),
      tennis: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <ellipse cx="9" cy="8" rx="6" ry="6.5" strokeWidth="1.5" {...base}/>
          <line x1="6" y1="3" x2="6" y2="13"  strokeWidth="0.7" {...base}/>
          <line x1="9" y1="1.5" x2="9" y2="14.5" strokeWidth="0.7" {...base}/>
          <line x1="12" y1="3" x2="12" y2="13" strokeWidth="0.7" {...base}/>
          <line x1="4" y1="6"  x2="14" y2="6"  strokeWidth="0.7" {...base}/>
          <line x1="3.5" y1="8.5" x2="14.5" y2="8.5" strokeWidth="0.7" {...base}/>
          <line x1="4" y1="11" x2="14" y2="11" strokeWidth="0.7" {...base}/>
          <line x1="9" y1="14.5" x2="15" y2="19" strokeWidth="1.8" {...base}/>
        </svg>
      ),
      volleyball: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" {...base}/>
          <path d="M4 6.5 Q10 4 16 6.5"  strokeWidth="1.1" {...base}/>
          <path d="M2.8 12 Q7 16 10 17.5" strokeWidth="1.1" {...base}/>
          <path d="M17.2 12 Q13 16 10 17.5" strokeWidth="1.1" {...base}/>
          <path d="M4 6.5 Q5 12 2.8 12"   strokeWidth="1.1" {...base}/>
          <path d="M16 6.5 Q15 12 17.2 12" strokeWidth="1.1" {...base}/>
        </svg>
      ),
      squash: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <path d="M10 2.5 C14.5 2.5 16.5 5.5 16.5 9 C16.5 13 13.5 15 10 15 C6.5 15 3.5 13 3.5 9 C3.5 5.5 5.5 2.5 10 2.5Z" strokeWidth="1.5" {...base}/>
          <line x1="7"  y1="4"  x2="6.5" y2="14" strokeWidth="0.7" {...base}/>
          <line x1="10" y1="3"  x2="10"  y2="15" strokeWidth="0.7" {...base}/>
          <line x1="13" y1="4"  x2="13.5" y2="14" strokeWidth="0.7" {...base}/>
          <line x1="4.5" y1="7"  x2="15.5" y2="7"  strokeWidth="0.7" {...base}/>
          <line x1="4"   y1="10" x2="16"   y2="10" strokeWidth="0.7" {...base}/>
          <line x1="4.5" y1="13" x2="15.5" y2="13" strokeWidth="0.7" {...base}/>
          <line x1="10" y1="15" x2="10" y2="19" strokeWidth="2" strokeLinecap="round" {...base}/>
        </svg>
      ),
      hockey: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <line x1="4" y1="2" x2="10" y2="13" strokeWidth="1.6" {...base}/>
          <path d="M10 13 Q13 15 16 14 Q17 13.5 16.5 12 Q16 11 13 12 Q11 12.5 10 13" strokeWidth="1.4" {...base}/>
          <ellipse cx="14" cy="17" rx="3.5" ry="1.5" strokeWidth="1.3" {...base}/>
        </svg>
      ),
      tabletennis: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <circle cx="9" cy="8" r="6" strokeWidth="1.5" {...base}/>
          <line x1="3" y1="8" x2="15" y2="8" strokeWidth="0.9" {...base}/>
          <path d="M12 13 L15.5 17.5" strokeWidth="2" {...base}/>
          <circle cx="17" cy="3.5" r="1.8" strokeWidth="1.3" {...base}/>
        </svg>
      ),
      swimming: (
        <svg width={s} height={h} viewBox="0 0 20 20">
          {glow}
          <path d="M1.5 6 Q4 3.5 6.5 6 Q9 8.5 11.5 6 Q14 3.5 16.5 6 Q19 8.5 19 8" strokeWidth="1.5" {...base}/>
          <path d="M1.5 10.5 Q4 8 6.5 10.5 Q9 13 11.5 10.5 Q14 8 16.5 10.5 Q19 13 19 12.5" strokeWidth="1.5" {...base}/>
          <path d="M1.5 15 Q4 12.5 6.5 15 Q9 17.5 11.5 15 Q14 12.5 16.5 15 Q19 17.5 19 17" strokeWidth="1.5" {...base}/>
          <path d="M8 4 Q11 2 14 4" strokeWidth="1.2" {...base}/>
        </svg>
      ),
    };
  
    return icons[id] || icons["all"];
  };
  
  export const generateDates = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const today = new Date();
    return Array.from({length:14}, (_,i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return `${months[d.getMonth()]} ${d.getDate()}`;
    });
  };
  export const DATES = generateDates();
  
  export const AMENITY_ICONS = {
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
  
  export const GROUNDS = [
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
  
  export const TEAM_CHALLENGES = [
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
  
  export const gImg = (g) => g.customImage || g.img;
  export const sportObj = (id) => SPORTS.find(s=>s.id===id) || SPORTS[0];