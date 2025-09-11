// "use client";

// import React, { useEffect, useState } from 'react';
// import { 
//   User, 
//   Pencil, 
//   Leaf, 
//   X, 
//   Check, 
//   BarChart3, 
//   Recycle, 
//   Clock,
//   Trophy,
//   Target,
//   TrendingUp,
//   Camera,
//   Settings,
//   Share2,
//   Award,
//   ChevronRight,
//   Sparkles,
//   TreePine,
//   Globe
// } from 'lucide-react';

// const ProfilePage = () => {
//   const [activeTab, setActiveTab] = useState('overview');
//   const [name, setName] = useState('Sakshi Sangle');
//   const [email, setEmail] = useState('sakshi.rivera@email.com');
//   const [bio, setBio] = useState('');
//   const [editingProfile, setEditingProfile] = useState(false);

//   // Mock user data
//   const userStats = {
//     totalScans: 142,
//     ecoScore: 'A-',
//     sustainableChoices: 89,
//     carbonSaved: '2.4 kg',
//     streak: 12,
//     level: 'Eco Warrior'
//   };

//   const achievements = [
//     { id: 1, name: 'First Scan', icon: '🔍', unlocked: true },
//     { id: 2, name: 'Eco Warrior', icon: '🌿', unlocked: true },
//     { id: 3, name: 'Carbon Crusher', icon: '💚', unlocked: true },
//     { id: 4, name: 'Sustainable Streak', icon: '🔥', unlocked: false }
//   ];

//   const recentProducts = [
//     { 
//       id: 1, 
//       name: 'Organic Oat Milk', 
//       brand: 'Earth\'s Best', 
//       date: '2 hours ago', 
//       ecoScore: 'A+',
//       impact: '+15 eco points',
//       category: 'Dairy Alternative'
//     },
//     { 
//       id: 2, 
//       name: 'Bamboo Toothbrush', 
//       brand: 'EcoBrush', 
//       date: '1 day ago', 
//       ecoScore: 'A',
//       impact: '+12 eco points',
//       category: 'Personal Care'
//     },
//     { 
//       id: 3, 
//       name: 'Reusable Food Wrap', 
//       brand: 'GreenWrap', 
//       date: '3 days ago', 
//       ecoScore: 'A+',
//       impact: '+18 eco points',
//       category: 'Kitchen'
//     }
//   ];

//   const getEcoScoreColor = (score) => {
//     if (score.startsWith('A')) return 'from-emerald-400 to-green-600';
//     if (score.startsWith('B')) return 'from-lime-400 to-green-500';
//     if (score.startsWith('C')) return 'from-yellow-400 to-orange-500';
//     return 'from-orange-400 to-red-500';
//   };

//   const StatCard = ({ icon: Icon, label, value, subtitle, gradient }) => (
//     <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 group">
//       <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-3">
//           <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
//             <Icon className="text-white" size={24} />
//           </div>
//           <TrendingUp className="text-green-400" size={16} />
//         </div>
//         <div className="space-y-1">
//           <p className="text-2xl font-bold text-gray-900">{value}</p>
//           <p className="text-sm font-medium text-gray-600">{label}</p>
//           {subtitle && <p className="text-xs text-green-600 font-medium">{subtitle}</p>}
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
//       {/* Header */}
   
//       <div className="container mx-auto px-6 py-8 max-w-7xl">
//         {/* Profile Header */}
//         <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-green-100 relative overflow-hidden">
//           <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
//           <div className="relative z-10">
//             <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
//               {/* Avatar */}
//               <div className="relative group">
//                 <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 p-1 shadow-2xl">
//                   <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center text-4xl font-bold text-green-600">
//                     {name.split(' ').map(n => n[0]).join('')}
//                   </div>
//                 </div>
//                 <button className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-xl shadow-lg hover:bg-green-600 transition-colors">
//                   <Camera className="text-white" size={16} />
//                 </button>
//               </div>

//               {/* Profile Info */}
//               <div className="flex-1">
//                 <div className="flex items-center space-x-3 mb-2">
//                   <h2 className="text-3xl font-bold text-gray-900">{name}</h2>
//                   <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
//                     <span className="text-white text-sm font-medium flex items-center">
//                       <Award size={14} className="mr-1" />
//                       {userStats.level}
//                     </span>
//                   </div>
//                 </div>
//                 <p className="text-gray-600 mb-2">{email}</p>
//                 <p className="text-gray-700 mb-4 max-w-2xl leading-relaxed">{bio}</p>
                
//                 {/* Quick Stats */}
//                 <div className="flex flex-wrap gap-6">
//                   <div className="flex items-center space-x-2">
//                     <div className="p-2 bg-green-100 rounded-lg">
//                       <BarChart3 className="text-green-600" size={16} />
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Total Scans</p>
//                       <p className="font-bold text-gray-900">{userStats.totalScans}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <div className="p-2 bg-green-100 rounded-lg">
//                       <Target className="text-green-600" size={16} />
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Eco Score</p>
//                       <p className="font-bold text-green-600">{userStats.ecoScore}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <div className="p-2 bg-green-100 rounded-lg">
//                       <Sparkles className="text-green-600" size={16} />
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Day Streak</p>
//                       <p className="font-bold text-orange-500">{userStats.streak}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <button 
//                 onClick={() => setEditingProfile(!editingProfile)}
//                 className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
//               >
//                 <Pencil size={16} />
//                 <span>Edit Profile</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Tab Navigation */}
//         <div className="flex space-x-1 bg-white/60 backdrop-blur-lg p-2 rounded-2xl mb-8 border border-green-100">
//           {[
//             { id: 'overview', label: 'Overview', icon: BarChart3 },
//             { id: 'products', label: 'Recent Scans', icon: Camera },
//             { id: 'achievements', label: 'Achievements', icon: Trophy },
//             { id: 'impact', label: 'Impact', icon: Globe }
//           ].map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 ${
//                 activeTab === tab.id
//                   ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
//                   : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
//               }`}
//             >
//               <tab.icon size={18} />
//               <span className="font-medium">{tab.label}</span>
//             </button>
//           ))}
//         </div>

//         {/* Tab Content */}
//         {activeTab === 'overview' && (
//           <div className="space-y-8">
//             {/* Stats Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <StatCard
//                 icon={BarChart3}
//                 label="Products Scanned"
//                 value={userStats.totalScans}
//                 subtitle="+12 this week"
//                 gradient="from-green-500 to-emerald-600"
//               />
//               <StatCard
//                 icon={Leaf}
//                 label="Eco Score"
//                 value={userStats.ecoScore}
//                 subtitle="Top 15%"
//                 gradient="from-emerald-500 to-teal-600"
//               />
//               <StatCard
//                 icon={Recycle}
//                 label="Sustainable Choices"
//                 value={userStats.sustainableChoices}
//                 subtitle="Great progress!"
//                 gradient="from-lime-500 to-green-600"
//               />
//               <StatCard
//                 icon={TreePine}
//                 label="Carbon Saved"
//                 value={userStats.carbonSaved}
//                 subtitle="This month"
//                 gradient="from-green-600 to-emerald-700"
//               />
//             </div>

//             {/* Progress Chart Placeholder */}
//             <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
//               <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//                 <TrendingUp className="text-green-600 mr-3" size={24} />
//                 Your Eco Journey
//               </h3>
//               <div className="h-64 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center border border-green-100">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                     <BarChart3 className="text-white" size={24} />
//                   </div>
//                   <p className="text-gray-600">Interactive chart coming soon!</p>
//                   <p className="text-sm text-green-600 mt-2">Track your weekly eco improvements</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === 'products' && (
//           <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//               <Camera className="text-green-600 mr-3" size={24} />
//               Recent Scans
//             </h3>
//             <div className="space-y-4">
//               {recentProducts.map((product) => (
//                 <div key={product.id} className="group p-6 border border-green-100 rounded-2xl hover:shadow-lg transition-all duration-300 hover:border-green-200">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
//                         <Leaf className="text-green-600" size={24} />
//                       </div>
//                       <div>
//                         <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
//                           {product.name}
//                         </h4>
//                         <p className="text-gray-600">{product.brand}</p>
//                         <div className="flex items-center space-x-3 mt-1">
//                           <span className="text-sm text-gray-500">{product.date}</span>
//                           <span className="text-sm font-medium text-green-600">{product.impact}</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-4">
//                       <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getEcoScoreColor(product.ecoScore)} text-white font-bold shadow-lg`}>
//                         {product.ecoScore}
//                       </div>
//                       <ChevronRight className="text-gray-400 group-hover:text-green-600 transition-colors" size={20} />
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {activeTab === 'achievements' && (
//           <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//               <Trophy className="text-green-600 mr-3" size={24} />
//               Achievements
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               {achievements.map((achievement) => (
//                 <div key={achievement.id} className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
//                   achievement.unlocked 
//                     ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
//                     : 'border-gray-200 bg-gray-50 opacity-60'
//                 }`}>
//                   <div className="text-center">
//                     <div className={`text-4xl mb-3 ${achievement.unlocked ? 'grayscale-0' : 'grayscale'}`}>
//                       {achievement.icon}
//                     </div>
//                     <h4 className={`font-bold mb-2 ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
//                       {achievement.name}
//                     </h4>
//                     <div className={`w-full h-2 rounded-full ${achievement.unlocked ? 'bg-green-500' : 'bg-gray-300'}`}></div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {activeTab === 'impact' && (
//           <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//               <Globe className="text-green-600 mr-3" size={24} />
//               Environmental Impact
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//               <div className="text-center">
//                 <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
//                   <TreePine className="text-white" size={32} />
//                 </div>
//                 <h4 className="text-3xl font-bold text-gray-900 mb-2">2.4 kg</h4>
//                 <p className="text-gray-600">CO₂ Saved This Month</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
//                   <Globe className="text-white" size={32} />
//                 </div>
//                 <h4 className="text-3xl font-bold text-gray-900 mb-2">127 L</h4>
//                 <p className="text-gray-600">Water Saved</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
//                   <Recycle className="text-white" size={32} />
//                 </div>
//                 <h4 className="text-3xl font-bold text-gray-900 mb-2">15</h4>
//                 <p className="text-gray-600">Items Recycled</p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;

"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  User, 
  Pencil, 
  Leaf, 
  X, 
  Check, 
  BarChart3, 
  Recycle, 
  Clock,
  Trophy,
  Target,
  TrendingUp,
  TreePine,
  Globe,
  Award,
  Star,
  Zap,
  Droplet,
  Wind,
  Sun,
  Mountain,
  Sparkles,
  Heart,
  Shield,
  Crown,
  Medal,
  Flame,
  Camera,
  Settings,
  Share2,
  ChevronRight,
  Plus,
  Minus,
  Gift,
  Calendar,
  MapPin,
  Users,
  Activity
} from 'lucide-react';
import Avatar from 'boring-avatars';

const backendUrl = 'http://localhost:5001';

const ProfilePage = () => {
  const [avatarSeed, setAvatarSeed] = useState<string>('');
  const [avatarColors, setAvatarColors] = useState<string[]>([]);
  const [editingAvatar, setEditingAvatar] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  // Green theme palette options
  const greenPalettes = [
    ['#1E5128', '#4E9F3D', '#D8E9A8', '#191A19', '#1E5128'],
    ['#0D1F22', '#2D6E7E', '#3BACB6', '#82DBD8', '#B3E8E5'],
    ['#4A6C2F', '#73A942', '#92C95C', '#B3E36A', '#D8FFBC'],
    ['#023020', '#146356', '#2E8B57', '#3CB371', '#90EE90'],
    ['#053B06', '#137547', '#216869', '#49A078', '#9CC5A1'],
    ['#1F2F16', '#2E4125', '#556B2F', '#8DB255', '#B2D3A8'],
  ];

  // User stats from backend
  const [userStats, setUserStats] = useState<any>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    totalScans: 0,
    ecoScore: 'C',
    sustainableChoices: 0,
    carbonSaved: 0,
    waterSaved: 0,
    treesPlanted: 0,
    streak: 0,
    rank: 'Eco Beginner',
    badges: 0,
    challengesCompleted: 0
  });

  // Environmental impact data (derived from stats if present)
  const [environmentalImpact, setEnvironmentalImpact] = useState<any>({
    co2Saved: 0,
    waterSaved: 0,
    wasteReduced: 0,
    energySaved: 0,
    treesEquivalent: 0,
    oceanPlasticPrevented: 0
  });

  // Achievement system (no mock data)
  const [achievements, setAchievements] = useState<any[]>([]);

  // Level progression data
  const levels = [
    { level: 1, name: 'Eco Beginner', minXp: 0, color: 'from-gray-400 to-gray-600' },
    { level: 5, name: 'Green Explorer', minXp: 500, color: 'from-green-400 to-green-600' },
    { level: 10, name: 'Eco Warrior', minXp: 1500, color: 'from-emerald-400 to-emerald-600' },
    { level: 15, name: 'Sustainability Champion', minXp: 3000, color: 'from-teal-400 to-teal-600' },
    { level: 20, name: 'Climate Guardian', minXp: 5000, color: 'from-blue-400 to-blue-600' },
    { level: 25, name: 'Earth Protector', minXp: 7500, color: 'from-purple-400 to-purple-600' },
    { level: 30, name: 'Planet Savior', minXp: 10000, color: 'from-yellow-400 to-yellow-600' }
  ];

  const currentLevel = levels.find(l => userStats.level >= l.level) || levels[0];
  const nextLevel = levels.find(l => l.level > userStats.level) || levels[levels.length - 1];

  // Recently scanned products (no mock until tracked)
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  // Helper functions
  const getEcoScoreColor = (score: string) => {
    if (score.startsWith('A')) return 'from-emerald-400 to-green-600';
    if (score.startsWith('B')) return 'from-lime-400 to-green-500';
    if (score.startsWith('C')) return 'from-yellow-400 to-orange-500';
    return 'from-orange-400 to-red-500';
  };

  const StatCard = ({ icon: Icon, label, value, subtitle, gradient, trend }: any) => (
    <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="text-white" size={24} />
          </div>
          {trend && <TrendingUp className="text-green-400" size={16} />}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          {subtitle && <p className="text-xs text-green-600 font-medium">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const AchievementCard = ({ achievement }: any) => (
    <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
      achievement.unlocked 
        ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:shadow-xl' 
        : 'border-gray-200 bg-gray-50 opacity-60'
    }`}>
      <div className="text-center">
        <div className={`text-4xl mb-3 ${achievement.unlocked ? 'grayscale-0' : 'grayscale'}`}>
          {achievement.icon}
        </div>
        <h4 className={`font-bold mb-2 ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
          {achievement.name}
        </h4>
        <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
          {achievement.description}
        </p>
        {achievement.unlocked ? (
          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-green-500"></div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600 font-medium">+{achievement.points} points</span>
              <span className="text-gray-500">{achievement.date}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-gray-300">
              <div 
                className="h-full rounded-full bg-green-400" 
                style={{ width: `${achievement.progress}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{achievement.progress}% complete</span>
          </div>
        )}
      </div>
    </div>
  );

  // Load user profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/users/me`, {
          headers: { token }
        });
        if (res.data?.success && res.data.user) {
          const u = res.data.user;
          setName(u.name || '');
          setEmail(u.email || '');
          setBio(u.bio || '');
          setAvatarSeed(u.avatarSeed || '');
          setAvatarColors(Array.isArray(u.avatarColors) ? u.avatarColors : []);
          if (u.stats) {
            setUserStats(u.stats);
            setEnvironmentalImpact({
              co2Saved: u.stats.carbonSaved || 0,
              waterSaved: u.stats.waterSaved || 0,
              wasteReduced: u.stats.sustainableChoices || 0,
              energySaved: 0,
              treesEquivalent: u.stats.treesPlanted || 0,
              oceanPlasticPrevented: 0
            });
          }
          // If you later track achievements/products, set them here
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  // Save avatar settings (local state only; persisted on Save Profile)
  const handleAvatarChange = (palette: string[]) => {
    setAvatarColors(palette);
  };
  
  // Generate a new random avatar
  const generateRandomAvatar = () => {
    const newSeed = Math.random().toString(36).substring(2, 10);
    setAvatarSeed(newSeed);
  };
  
  // Save profile information to backend
  const saveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please login first');
      const payload: any = { name, email, bio, avatarSeed, avatarColors };
      const res = await axios.put(`${backendUrl}/api/users/me`, payload, {
        headers: { token }
      });
      if (res.data?.success) {
        alert('Profile saved successfully!');
      } else {
        alert(res.data?.msg || 'Failed to save profile');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.msg || 'Failed to save profile');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Leaf className="text-green-600 mr-3" size={32} />
              <h1 className="text-3xl font-bold text-green-800">EcoScan Profile</h1>
        </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                <Settings size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                <Share2 size={20} />
            </button>
            </div>
          </div>
        </div>
          </div>
          
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-green-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center overflow-hidden">
                {avatarSeed && (
                  <Avatar
                        size={128}
                    name={avatarSeed}
                    variant="beam"
                    colors={avatarColors}
                  />
                )}
                  </div>
                </div>
                <button 
                  onClick={() => setEditingAvatar(!editingAvatar)}
                  className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-xl shadow-lg hover:bg-green-600 transition-colors"
                >
                  <Camera className="text-white" size={16} />
                </button>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">{name || 'EcoScan User'}</h2>
                  <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                    <span className="text-white text-sm font-medium flex items-center">
                      <Award size={14} className="mr-1" />
                      {userStats.rank}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{email || 'No email provided'}</p>
                <p className="text-gray-700 mb-4 max-w-2xl leading-relaxed">
                  {bio || 'Join me on my journey to make the world a greener place, one scan at a time! 🌱'}
                </p>
                
                {/* Level Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Level {userStats.level}</span>
                    <span className="text-sm font-medium text-gray-600">{userStats.xp}/{userStats.xp + userStats.xpToNext} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {userStats.xpToNext} XP to reach {nextLevel.name}
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="text-green-600" size={16} />
                    </div>
              <div>
                      <p className="text-sm text-gray-600">Total Scans</p>
                      <p className="font-bold text-gray-900">{userStats.totalScans}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="text-green-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Eco Score</p>
                      <p className="font-bold text-green-600">{userStats.ecoScore}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Sparkles className="text-green-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Day Streak</p>
                      <p className="font-bold text-orange-500">{userStats.streak}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Trophy className="text-green-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Badges</p>
                      <p className="font-bold text-gray-900">{userStats.badges}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setEditingAvatar(!editingAvatar)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Pencil size={16} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-lg p-2 rounded-2xl mb-8 border border-green-100">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'impact', label: 'Environmental Impact', icon: Globe },
            { id: 'products', label: 'Recent Scans', icon: Camera }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <tab.icon size={18} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={BarChart3}
                label="Products Scanned"
                value={userStats.totalScans}
                subtitle="+12 this week"
                gradient="from-green-500 to-emerald-600"
                trend={true}
              />
              <StatCard
                icon={Leaf}
                label="Eco Score"
                value={userStats.ecoScore}
                subtitle="Top 15%"
                gradient="from-emerald-500 to-teal-600"
                trend={true}
              />
              <StatCard
                icon={Recycle}
                label="Sustainable Choices"
                value={userStats.sustainableChoices}
                subtitle="Great progress!"
                gradient="from-lime-500 to-green-600"
                trend={true}
              />
              <StatCard
                icon={TreePine}
                label="Trees Planted"
                value={userStats.treesPlanted}
                subtitle="Virtual trees"
                gradient="from-green-600 to-emerald-700"
                trend={true}
              />
            </div>

            {/* Environmental Impact Summary */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Globe className="text-green-600 mr-3" size={24} />
                Your Environmental Impact
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <TreePine className="text-white" size={32} />
                </div>
                  <h4 className="text-3xl font-bold text-gray-900 mb-2">{environmentalImpact.co2Saved} kg</h4>
                  <p className="text-gray-600">CO₂ Saved This Month</p>
              </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Droplet className="text-white" size={32} />
            </div>
                  <h4 className="text-3xl font-bold text-gray-900 mb-2">{environmentalImpact.waterSaved} L</h4>
                  <p className="text-gray-600">Water Saved</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Recycle className="text-white" size={32} />
                  </div>
                  <h4 className="text-3xl font-bold text-gray-900 mb-2">{environmentalImpact.wasteReduced}</h4>
                  <p className="text-gray-600">Items Recycled</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Trophy className="text-green-600 mr-3" size={24} />
              Achievements & Badges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'impact' && (
          <div className="space-y-8">
            {/* Environmental Impact Details */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Globe className="text-green-600 mr-3" size={24} />
                Detailed Environmental Impact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-500 rounded-xl mr-4">
                      <TreePine className="text-white" size={24} />
                    </div>
            <div>
                      <h4 className="font-bold text-gray-900">Carbon Footprint</h4>
                      <p className="text-sm text-gray-600">CO₂ emissions reduced</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">{environmentalImpact.co2Saved} kg</div>
                  <p className="text-sm text-gray-600">Equivalent to {Math.round(environmentalImpact.co2Saved * 2.5)} km by car</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-500 rounded-xl mr-4">
                      <Droplet className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Water Conservation</h4>
                      <p className="text-sm text-gray-600">Liters of water saved</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{environmentalImpact.waterSaved} L</div>
                  <p className="text-sm text-gray-600">Enough for {Math.round(environmentalImpact.waterSaved / 10)} showers</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-purple-500 rounded-xl mr-4">
                      <Recycle className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Waste Reduction</h4>
                      <p className="text-sm text-gray-600">Items diverted from landfill</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{environmentalImpact.wasteReduced}</div>
                  <p className="text-sm text-gray-600">Plastic bottles recycled</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-yellow-500 rounded-xl mr-4">
                      <Zap className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Energy Saved</h4>
                      <p className="text-sm text-gray-600">kWh of energy conserved</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{environmentalImpact.energySaved} kWh</div>
                  <p className="text-sm text-gray-600">Power for {Math.round(environmentalImpact.energySaved / 10)} days</p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-6 border border-teal-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-teal-500 rounded-xl mr-4">
                      <TreePine className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Tree Equivalent</h4>
                      <p className="text-sm text-gray-600">Trees needed to offset impact</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-teal-600 mb-2">{environmentalImpact.treesEquivalent}</div>
                  <p className="text-sm text-gray-600">Trees planted virtually</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-indigo-500 rounded-xl mr-4">
                      <Shield className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Ocean Protection</h4>
                      <p className="text-sm text-gray-600">Plastic items prevented</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 mb-2">{environmentalImpact.oceanPlasticPrevented}</div>
                  <p className="text-sm text-gray-600">From reaching the ocean</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Camera className="text-green-600 mr-3" size={24} />
              Recent Scans
            </h3>
            <div className="space-y-4">
              {recentProducts.map((product) => (
                <div key={product.id} className="group p-6 border border-green-100 rounded-2xl hover:shadow-lg transition-all duration-300 hover:border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                        <Leaf className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-gray-600">{product.brand}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-sm text-gray-500">{product.date}</span>
                          <span className="text-sm font-medium text-green-600">{product.impact}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getEcoScoreColor(product.ecoScore)} text-white font-bold shadow-lg`}>
                        {product.ecoScore}
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-green-600 transition-colors" size={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avatar Editing Modal */}
        {editingAvatar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Customize Your Avatar</h3>
                <button 
                  onClick={() => setEditingAvatar(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden mr-6 shadow-md border-2 border-green-100">
                  {avatarSeed && (
                    <Avatar
                      size={96}
                      name={avatarSeed}
                      variant="beam"
                      colors={avatarColors}
                    />
                  )}
                </div>
                
                <button
                  onClick={generateRandomAvatar}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-2 mr-2"
                >
                  Random Avatar
                </button>
                
                <button
                  onClick={() => setEditingAvatar(false)}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors mb-2"
                >
                  <Check size={16} className="inline mr-1" />
                  Done
                </button>
              </div>
              
              <h4 className="font-medium text-gray-700 mb-3">Choose a color palette:</h4>
              <div className="grid grid-cols-3 gap-4">
                {greenPalettes.map((palette, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer border-2 ${
                      JSON.stringify(avatarColors) === JSON.stringify(palette) 
                        ? 'border-green-500' 
                        : 'border-gray-200'
                    } hover:border-green-300 transition-colors`}
                    onClick={() => handleAvatarChange(palette)}
                  >
                    <div className="flex mb-2">
                      {palette.map((color, i) => (
                        <div 
                          key={i}
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: color, marginLeft: i > 0 ? '-8px' : '0' }}
                        />
                      ))}
                    </div>
                    <div className="w-full h-16 rounded-md overflow-hidden">
                      <Avatar
                        size={64}
                        name={avatarSeed}
                        variant="beam"
                        colors={palette}
                      />
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

        {/* Profile Editing Modal */}
        {editingAvatar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Profile</h3>
                <button 
                  onClick={() => setEditingAvatar(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
        </div>
        
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Your email"
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Tell us about your sustainability journey"
                  ></textarea>
                </div>
                
                <div className="flex space-x-4">
                <button
                  onClick={saveProfile}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Profile
                </button>
                  <button
                    onClick={() => setEditingAvatar(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
          </div>
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;