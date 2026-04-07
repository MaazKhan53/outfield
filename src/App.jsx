import { useState, useEffect, useRef } from "react";
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

import { supabase } from './supabase';
import { SPORTS, NeonSportIcon, DATES, AMENITY_ICONS, GROUNDS, TEAM_CHALLENGES, gImg, sportObj } from "./data";
import './App.css';

export default function Outfield() {
  const [screen, setScreen]   = useState("splash");
  const [nav, setNav]         = useState("home");
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
    {id:1, name:"Ground 1", sports:[], type:"Outdoor", capacity:"", priceBase:"", pricePeak:"", slotDur:"2 hr", notes:""}
  ]);
  const [ownerFacilityName, setOwnerFacilityName] = useState("");
  const [ownerPhone, setOwnerPhone]               = useState("");
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
  const MAX_BOOKINGS = 2;
  const [bookRef]                 = useState("OTF-" + Math.random().toString(36).substring(2,6).toUpperCase());
  const fileRef               = useRef(null);
  const [date, setDate]       = useState(DATES[0]);
  const touchStartX           = useRef(null);
  const touchStartY           = useRef(null);

  // Tab order for swipe navigation
  const TAB_ORDER = ["home","explore","match","profile"];

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if(touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Require a much stronger horizontal intent — dx must be large AND
    // clearly more horizontal than vertical (ratio > 2.5:1)
    // This prevents conflict with horizontal scroll areas like sport chips
    if(Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 2.5) {
      const mainScreens = ["home","explore","match","profile"];
      if(!mainScreens.includes(screen)) return;
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

  useEffect(() => {
    if (screen !== "home") return;
    const t = setInterval(() => setHeroIdx(i => (i+1) % Math.min(GROUNDS.length,4)), 3600);
    return () => clearInterval(t);
  }, [screen]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2700); };

  const goNav = (n) => {
    setNav(n);
    setScreen({home:"home",explore:"explore",match:"match",profile:"profile"}[n]);
  };

  const navigate = (toScreen, transition="fade") => {
    setScreen(toScreen);
  };

  const filtered = GROUNDS.filter(g => {
    const ms = sport === "all" || g.sports.includes(sport);
    const mq = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.area.toLowerCase().includes(search.toLowerCase());
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
    return ms && mq && mt;
  });

  const curSlot  = ground && slot !== null ? getSlots(ground, date)[slot] : null;

  const allLfp = GROUNDS.flatMap(g =>
    Object.entries(g.slots).flatMap(([d, slots]) =>
      slots.filter(s => s.lfp).map(s => ({ ...s, groundName:g.name, groundArea:g.area, dateLabel:d, groundId:g.id }))
    )
  );

  const openGround = (g) => { setGround(g); setCourt(null); setSlot(null); setLfp(false); setScreen("detail"); };
  const activeCourt = ground?.isFacility ? court : null;
  const getSlots = (g, d) => {
    if (g?.isFacility && court) {
      return court.slots?.[d] || court.slots?.["Mar 10"] || [];
    }
    return g?.slots?.[d] || g?.slots?.["Mar 10"] || [];
  };

  const featGrounds = [...GROUNDS].sort((a,b) => b.rating-a.rating).slice(0,5);

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
      <div className="app" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

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
                  placeholder={ratingVal>=4 ? "What did you love? (optional)" : "What could be improved? (optional)"}/>
              )}
              <button className="rating-submit" disabled={ratingVal===0}
                style={ratingVal===0?{opacity:.4,cursor:"not-allowed"}:{}}
                onClick={()=>{setRatingDone(true);setRatingModal(false);showToast("Thanks for your rating! ⭐");}}>
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

        {/* ═══ HOME ═══ */}
        {screen === "home" && (
          <div className="screen active home fade">
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
              <div className="hero-scroll">
                {featGrounds.map((g,i) => {
                  const hasLfp = getSlots(g,"Mar 10").some(s=>s.lfp);
                  return (
                    <div key={g.id} className="hero-card" onClick={()=>openGround(g)}>
                      <img className="hero-card-img" src={gImg(g)} alt={g.name}
                        onError={e=>{e.target.style.display="none";}}/>
                      <div className="hero-grad"/>
                      <div className="hero-top-row">
                        <div className="hero-rating-pill">
                          <Star size={9} color="var(--amber)" fill="var(--amber)"/> {g.rating}
                        </div>
                        <div className="hero-price-pill">Rs {g.priceFrom.toLocaleString()}</div>
                      </div>
                      {hasLfp && <div className="hero-lfp-pill">Need Players</div>}
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
              <div className="hero-dots">
                {featGrounds.map((_,i)=>(
                  <div key={i} className={`hero-dot ${heroIdx===i?"on":""}`} onClick={()=>setHeroIdx(i)}/>
                ))}
              </div>
            </div>

            {/* Sport Filter */}
            <div className="sport-section">
              <div className="sport-scroll">
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
                    <button className="dhero-btn" onClick={()=>{setFaved(p=>({...p,[ground.id]:!p[ground.id]}));showToast(faved[ground.id]?"Removed from favourites":"Added to favourites");}}>
                      <Heart size={16} strokeWidth={2} fill={faved[ground.id]?"#ef4444":"none"} color={faved[ground.id]?"#ef4444":"#fff"}/>
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
                            onClick={()=>{setCourt(c);setSlot(null);}}>
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
                <div className="date-row">
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
                    {getSlots(ground,date).filter(s=>!s.booked).length} free
                  </div>
                </div>
                <div className="late-badge" style={{marginBottom:10}}>
                  <Clock size={10} strokeWidth={2}/> Late booking allowed up to 10 mins into slot
                </div>
                <div className="slots-grid">
                  {getSlots(ground,date).map((s,i)=>{
                    const isLfp = s.booked&&s.lfp;
                    const jk = `d-${ground.id}-${date}-${i}`;
                    const jnd = joined[jk];
                    const spotsLeft = Math.max(0,(s.need||0)-(s.joined||0)-(jnd?1:0));
                    return (
                      <div key={i}
                        className={`slot-card ${isLfp?"lfp":s.booked?"bkd":"free"} ${slot===i?"sel":""}`}
                        onClick={()=>{if(!s.booked)setSlot(slot===i?null:i);}}>
                        <div className="slot-time">{s.time}</div>
                        <div className="slot-status" style={{color:isLfp?"var(--orange)":s.booked?"var(--ink4)":"var(--green)"}}>
                          {isLfp ? (
                            <span style={{display:"flex",alignItems:"center",gap:3}}>
                              <UserPlus size={10} strokeWidth={2}/>Need Players
                            </span>
                          ) : s.booked ? (
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
                onClick={()=>{setBookingCount(p=>p+1);setScreen("success");}}>
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
            <div className="ref-box">
              <div className="ref-label">Booking Reference</div>
              <div className="ref-code">{bookRef}</div>
            </div>
            {ground && curSlot && (
              <div className="success-detail-box">
                {[
                  [MapPin, ground.name],
                  [Clock, curSlot.time],
                  [Calendar, `${date}, 2025`],
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

        {/* ═══ MATCHMAKING ═══ */}
        {screen === "match" && (
          <div className="screen active match fade">
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

        {/* ═══ EXPLORE ═══ */}
        {screen === "explore" && (
          <div className="screen active explore fade">
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
              <div className="sport-scroll">
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
                onClick={()=>{setScreen("home");setNav("home");}}>
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

                  {/* Photos */}
                  <div className="form-block">
                    <div className="form-block-t">Facility Photos</div>
                    <div className={`photo-drop ${ownerImg?"has-img":""}`}>
                      <input ref={fileRef} type="file" accept="image/*" className="file-hidden"
                        onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setOwnerImg(ev.target.result);r.readAsDataURL(f);}}/>
                      {ownerImg ? (
                        <>
                          <img className="photo-preview-img" src={ownerImg} alt=""/>
                          <div className="photo-change-btn" onClick={()=>fileRef.current?.click()}>
                            <Camera size={12} strokeWidth={2}/> Change Photo
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="upload-ico-wrap"><Upload size={22} color="var(--ink4)" strokeWidth={1.5}/></div>
                          <div className="upload-t">Upload Facility Photos</div>
                          <div className="upload-s">Up to 8 photos of your complex or facility<br/>High quality photos get 3× more bookings</div>
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
                          value={l==="Facility / Complex Name" ? ownerFacilityName : undefined}
                          onChange={l==="Facility / Complex Name" ? e=>setOwnerFacilityName(e.target.value) : undefined}
                          style={required && ownerFormError && !ownerFacilityName && l==="Facility / Complex Name" ? {borderColor:"var(--red)"} : {}}
                        />
                      </div>
                    ))}
                    <div className="fg">
                      <label className="flbl">Facility Description</label>
                      <textarea className="finput fta" style={{height:80}} placeholder="Tell players about your complex — how many grounds, surface quality, facilities available, history..."/>
                    </div>
                    <div className="fg">
                      <label className="flbl">Total Number of Grounds in this Facility</label>
                      <input className="finput" type="number" placeholder="e.g. 5"/>
                    </div>
                    <div className="fg">
                      <label className="flbl">Facility Type</label>
                      <div className="slot-dur-opts">
                        {["Indoor","Outdoor","Mixed"].map(t=>(
                          <div key={t} className="slot-dur-opt" style={{fontSize:11}}>{t}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="form-block">
                    <div className="form-block-t">Facility Operating Hours</div>
                    <div className="time-pair">
                      <div className="fg"><label className="flbl">Opens At</label><input className="finput" type="time" defaultValue="06:00"/></div>
                      <div className="fg"><label className="flbl">Closes At</label><input className="finput" type="time" defaultValue="23:00"/></div>
                    </div>
                    <div className="fg">
                      <label className="flbl">Days Open</label>
                      <div className="slot-dur-opts" style={{flexWrap:"wrap",gap:6}}>
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
                          <div key={d} className="slot-dur-opt" style={{minWidth:40,padding:"8px 6px",fontSize:11}}>{d}</div>
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
                          <div key={t} className="slot-dur-opt" style={{fontSize:10,padding:"8px 6px"}}>{t}</div>
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
                          <div key={p} className="slot-dur-opt" style={{fontSize:11}}>{p}</div>
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
                          <div key={t} className="slot-dur-opt" style={{fontSize:10,padding:"8px 6px"}}>{t}</div>
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
                        <div className="time-pair">
                          <div className="fg">
                            <label className="flbl">Base Price (Rs/slot)</label>
                            <input className="finput" type="number" placeholder="e.g. 2500"
                              value={court.priceBase}
                              onChange={e=>{const nc=[...ownerCourts];nc[ci].priceBase=e.target.value;setOwnerCourts(nc);}}/>
                          </div>
                          <div className="fg">
                            <label className="flbl">Peak Price (Rs/slot)</label>
                            <input className="finput" type="number" placeholder="e.g. 3500"
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
                    onClick={()=>setOwnerCourts(p=>[...p,{id:Date.now(),name:`Ground ${p.length+1}`,sports:[],type:"",capacity:"",priceBase:"",pricePeak:"",slotDur:"2 hr",notes:""}])}>
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
                      showToast("Submitted! Live within 24 hours.");
                      setScreen("home");
                      setNav("home");
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
            </div>
          </div>
        )}

        {/* ═══ PROFILE ═══ */}
        {screen === "profile" && (
          <div className="screen active profile fade">
            <div className="prof-head">
              <div className="prof-glow"/>
              <div className="prof-av-wrap">
                <div className="prof-av">
                  <User size={30} color="#fff" strokeWidth={1.5}/>
                </div>
                <div className="prof-av-badge">
                  <Check size={11} color="#fff" strokeWidth={3}/>
                </div>
              </div>
              <div className="prof-name">Maaz</div>
              <div className="prof-sub">Karachi · Player since 2025</div>
            </div>
            <div style={{height:14}}/>
            <div className="prof-body">
              <div className="stat-row">
                {[["3","Bookings"],["2","Sports"],["1","Matches"]].map(([n,l])=>(
                  <div key={l} className="stat-card">
                    <div className="stat-n">{n}</div>
                    <div className="stat-l">{l}</div>
                  </div>
                ))}
              </div>
              <div className="prof-list">
                {[
                  {I:Calendar, bg:"#DBEAFE", c:"#2563EB", t:"My Bookings",         s:"Upcoming & past"},
                  {I:UserPlus, bg:"#FEF3C7", c:"#D97706", t:"Matchmaking History", s:"Games joined or hosted"},
                  {I:Heart,    bg:"#FCE7F3", c:"#DB2777", t:"Favourite Grounds",   s:"Your saved venues"},
                  {I:Bell,     bg:"#DCFCE7", c:"#16A34A", t:"Notifications",       s:"Booking alerts & requests"},
                  {I:SlidersHorizontal, bg:"#F3F4F6", c:"#4B5563", t:"Settings",   s:"Account & preferences"},
                ].map((r,i)=>(
                  <div key={i} className="prof-row">
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
              </div>
            </div>
          </div>
        )}

        {/* ═══ NAV BAR ═══ */}
        {!["splash","onboard","success"].includes(screen) && (
          <div className="navbar">
            {[
              {id:"home",    Icon:Home,    label:"Home"},
              {id:"explore", Icon:Compass, label:"Explore"},
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
      </div>
    </>
  );
}