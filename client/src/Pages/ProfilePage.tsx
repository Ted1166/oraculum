import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X,
  Trophy,
  TrendingUp,
  Target,
  Award
} from "lucide-react";
import { useUserBets } from "@/hooks/usePredictions";
import { formatEther } from "viem";

interface UserProfile {
  displayName: string;
  email: string;
  bio: string;
  location: string;
  avatarUrl: string;
  twitter: string;
  website: string;
  joinedDate: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: userBets } = useUserBets();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    email: "",
    bio: "",
    location: "",
    avatarUrl: "",
    twitter: "",
    website: "",
    joinedDate: new Date().toISOString(),
  });

  // Load profile from localStorage
  useEffect(() => {
    if (!isConnected || !address) {
      navigate('/');
      return;
    }

    const profileKey = `predict_fund_profile_${address}`;
    const storedProfile = localStorage.getItem(profileKey);
    
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }
  }, [address, isConnected, navigate]);

  // Calculate user stats from bets
  const userStats = {
    totalPredictions: userBets?.length || 0,
    totalStaked: userBets?.reduce((sum, bet: any) => sum + bet.amount, 0) || 0n,
    activeBets: userBets?.filter((bet: any) => !bet.claimed).length || 0,
    wonBets: userBets?.filter((bet: any) => bet.claimed).length || 0,
  };

  const winRate = userStats.totalPredictions > 0
    ? Math.round((userStats.wonBets / userStats.totalPredictions) * 100)
    : 0;

  const handleSave = () => {
    if (!address) return;

    const profileKey = `predict_fund_profile_${address}`;
    localStorage.setItem(profileKey, JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reload from localStorage
    if (address) {
      const profileKey = `predict_fund_profile_${address}`;
      const storedProfile = localStorage.getItem(profileKey);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    }
    setIsEditing(false);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your profile.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and track your prediction performance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={handleSave}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback className="bg-gradient-primary text-background text-2xl font-bold">
                        {profile.displayName?.charAt(0).toUpperCase() || address.charAt(2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="flex-1">
                        <Label htmlFor="avatarUrl">Avatar URL</Label>
                        <Input
                          id="avatarUrl"
                          value={profile.avatarUrl}
                          onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Wallet Address */}
                  <div>
                    <Label>Wallet Address</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded-lg font-mono text-sm">
                        {address}
                      </code>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    {isEditing ? (
                      <Input
                        id="displayName"
                        value={profile.displayName}
                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                        placeholder="Your name or username"
                      />
                    ) : (
                      <p className="mt-2 text-lg font-medium">
                        {profile.displayName || truncateAddress(address)}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="your@email.com"
                      />
                    ) : (
                      <p className="mt-2">
                        {profile.email || <span className="text-muted-foreground">Not provided</span>}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap">
                        {profile.bio || <span className="text-muted-foreground">No bio yet</span>}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    ) : (
                      <p className="mt-2">
                        {profile.location || <span className="text-muted-foreground">Not provided</span>}
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="twitter">Twitter Handle</Label>
                      {isEditing ? (
                        <Input
                          id="twitter"
                          value={profile.twitter}
                          onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                          placeholder="@username"
                        />
                      ) : (
                        <p className="mt-2">
                          {profile.twitter || <span className="text-muted-foreground">Not provided</span>}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      {isEditing ? (
                        <Input
                          id="website"
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          placeholder="https://..."
                        />
                      ) : (
                        <p className="mt-2">
                          {profile.website ? (
                            <a 
                              href={profile.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {profile.website}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member Since
                    </Label>
                    <p className="mt-2 text-muted-foreground">
                      {new Date(profile.joinedDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Prediction Stats */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-warning" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm">Total Predictions</span>
                    </div>
                    <span className="font-bold text-lg">{userStats.totalPredictions}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm">Win Rate</span>
                    </div>
                    <span className="font-bold text-lg text-success">{winRate}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-warning" />
                      <span className="text-sm">Total Staked</span>
                    </div>
                    <span className="font-bold text-lg">
                      {parseFloat(formatEther(userStats.totalStaked)).toFixed(4)} BNB
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm">Active Bets</span>
                    </div>
                    <span className="font-bold text-lg">{userStats.activeBets}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/projects')}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Browse Projects
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/dashboard')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/leaderboard')}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;