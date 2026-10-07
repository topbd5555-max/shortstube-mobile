import * as Updates from 'expo-updates';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const CURRENT_APP_VERSION = "1.0.0"; 

// ==========================================
// 🚀 ANIMATED SPLASH SCREEN COMPONENT 🚀
// ==========================================
const AnimatedSplashScreen = ({ onFinish }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const light1Y = useRef(new Animated.Value(-200)).current;
  const light2Y = useRef(new Animated.Value(height + 200)).current;

  useEffect(() => {
    // ছবিটা জ্বলজ্বল (Pulse) করার অ্যানিমেশন
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    // মুভিং লাইটিং ইফেক্ট (উপর থেকে নিচে এবং নিচ থেকে উপরে)
    Animated.loop(Animated.timing(light1Y, { toValue: height + 200, duration: 3000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(light2Y, { toValue: -200, duration: 2500, useNativeDriver: true })).start();

    // ৩.৫ সেকেন্ড পর অটোমেটিক হোম পেজে নিয়ে যাবে
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* ২য় ছবিটা (Splash Image) এখানে রেন্ডার হচ্ছে */}
      <Animated.Image
        source={require('../../assets/splash.jpg')} 
        style={[styles.splashImage, { transform: [{ scale: pulseAnim }] }]}
        resizeMode="cover"
      />

      {/* মুভিং লাইটিং ইফেক্টস */}
      <Animated.View style={[styles.movingLight, { backgroundColor: '#06b6d4', transform: [{ translateY: light1Y }, { translateX: width * 0.2 }] }]} />
      <Animated.View style={[styles.movingLight, { backgroundColor: '#ec4899', transform: [{ translateY: light2Y }, { translateX: width * 0.6 }] }]} />
      <Animated.View style={[styles.movingLight, { backgroundColor: '#f59e0b', transform: [{ translateY: light1Y }, { translateX: width * 0.8 }] }]} />
    </View>
  );
};

// ==========================================
// CUSTOM HOOKS & OPTIMIZATION
// ==========================================
const usePulse = (speed = 1500) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: speed, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: speed, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return anim;
};

const optimizeUrl = (url) => {
  if (!url) return "";
  return url.replace('/upload/', '/upload/q_auto,f_auto/');
};

// ==========================================
// 1. HOME SCREEN (VIDEO FEED)
// ==========================================
const VideoItem = ({ item, isActive, itemHeight, isMuted, toggleGlobalMute }) => {
  const videoSource = item.video_url || item.url;
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = isMuted;
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  
  const glowAnim = usePulse(1000);

  useEffect(() => {
    if (isActive) {
      player.play();
      setIsPlaying(true);
      Animated.loop(Animated.timing(progressAnim, { toValue: width, duration: 15000, useNativeDriver: false })).start();
    } else {
      player.pause();
      setIsPlaying(false);
      progressAnim.setValue(0);
    }
  }, [isActive, player]);

  useEffect(() => { player.muted = isMuted; }, [isMuted]);

  const handleScreenPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setLiked(true); Vibration.vibrate(50); 
      triggerHeartAnimation(); lastTap.current = 0; 
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          if (isPlaying) { player.pause(); setIsPlaying(false); } 
          else { player.play(); setIsPlaying(true); }
        }
      }, 300);
    }
  };

  const triggerHeartAnimation = () => {
    setShowHeart(true);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.delay(500),
      Animated.timing(heartScale, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => setShowHeart(false));
  };

  const videoTitle = item.title && item.title !== "nan" ? item.title : "Feel this song... 🎵🎧😌";
  const creatorName = item.channel_name || "VIP_Creator";

  return (
    <View style={[styles.videoContainer, { height: itemHeight }]}>
      <VideoView 
        player={player} 
        style={[styles.video, { height: itemHeight }]} 
        nativeControls={false} 
        contentFit="contain" 
      />
      
      <TouchableOpacity activeOpacity={1} onPress={handleScreenPress} style={styles.touchableOverlay}>
        {!isPlaying && <View style={styles.playIconContainer}><Text style={styles.playIcon}>▶</Text></View>}
        {showHeart && <Animated.Text style={[styles.floatingHeart, { transform: [{ scale: heartScale }] }]}>❤️</Animated.Text>}
      </TouchableOpacity>

      {isActive && <View style={styles.progressBarContainer}><Animated.View style={[styles.progressBar, { width: progressAnim }]} /></View>}
      
      <TouchableOpacity style={styles.muteButton} onPress={toggleGlobalMute}>
        <Text style={styles.muteText}>{isMuted ? '🔇' : '🔊'}</Text>
      </TouchableOpacity>

      <View style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={styles.textSection}>
          <View style={styles.glassyTextContainer}>
            <Text style={styles.creatorText}>♡ {creatorName} ♡ <Text style={{color: '#f59e0b'}}>✔</Text></Text>
            <Text style={styles.description} numberOfLines={1}>{videoTitle}</Text>
          </View>
        </View>

        <View style={styles.iconSection}>
          <Animated.View style={[styles.glassyAvatarBorder, { opacity: glowAnim }]}>
            <View style={styles.avatar}><Text style={styles.avatarText}>👤</Text></View>
          </Animated.View>
          
          <TouchableOpacity style={styles.glassyIconButton} onPress={() => { setLiked(!liked); Vibration.vibrate(30); }}>
            <Text style={[styles.iconText, liked && { color: '#ec4899' }]}>❤</Text>
            <Text style={styles.iconLabel}>{liked ? '1.6K' : '1.5K'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.glassyIconButton}>
            <Text style={styles.iconText}>💬</Text>
            <Text style={styles.iconLabel}>148</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.glassyIconButton} onPress={() => Share.share({ message: videoSource })}>
            <Text style={styles.iconText}>↗️</Text>
            <Text style={styles.iconLabel}>149</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// 2. VIP PROFILE SCREEN
// ==========================================
const ProfileScreen = () => {
  const pulseAnim = usePulse(2000);
  const fastPulse = usePulse(800);

  return (
    <View style={styles.profileContainer}>
      <Animated.View style={[styles.bgLight, styles.bgLight1, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.bgLight, styles.bgLight2, { opacity: pulseAnim }]} />

      <ScrollView contentContainerStyle={styles.profileScroll}>
        <View style={styles.profileTopRow}>
          <TouchableOpacity style={styles.glassyCircleBtn}><Text style={{color:'white', fontSize: 20}}>👤+</Text></TouchableOpacity>
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={styles.glassyCircleBtn}><Text style={{color:'white', fontSize: 20}}>👁️</Text></TouchableOpacity>
            <TouchableOpacity style={styles.glassyCircleBtn}><Text style={{color:'white', fontSize: 20}}>⋮</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileAvatarSection}>
          <Text style={styles.crownIcon}>👑</Text>
          <Animated.View style={[styles.avatarGlowRing, { transform: [{ scale: pulseAnim.interpolate({inputRange:[0.4,1], outputRange:[0.95, 1.05]}) }] }]}>
            <View style={styles.profileBigAvatar}><Text style={{fontSize: 50}}>👦</Text></View>
          </Animated.View>
          <View style={styles.plusBadge}><Text style={{color:'white', fontWeight:'bold'}}>+</Text></View>
        </View>

        <View style={styles.usernameSection}>
          <Text style={styles.profileName}>🔒 PARVEZ KHAN 🥇</Text>
          <Text style={styles.profileHandle}>@parvez.khan945666</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statIcon}>👤</Text><View><Text style={styles.statNumber}>264</Text><Text style={styles.statLabel}>Following</Text></View></View>
          <Animated.View style={[styles.statBox, { borderColor: '#a855f7', shadowColor: '#a855f7', shadowOpacity: fastPulse }]}>
            <Text style={styles.statIcon}>👥</Text><View><Text style={styles.statNumber}>5</Text><Text style={styles.statLabel}>Followers</Text></View>
          </Animated.View>
          <View style={styles.statBox}><Text style={styles.statIcon}>❤️</Text><View><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>Likes</Text></View></View>
        </View>

        <TouchableOpacity style={styles.addBioBtn}><Text style={styles.addBioText}>+ Add bio</Text></TouchableOpacity>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>☁️ Offline videos ❯</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>🎵 Media player ❯</Text></TouchableOpacity>
        </View>

        <Animated.View style={[styles.bigCard, { shadowOpacity: pulseAnim }]}>
          <Text style={styles.crownIconSmall}>👑</Text>
          <View style={styles.cardImagesRow}>
            <View style={[styles.cardImg, {transform:[{rotate:'-15deg'}]}]}><Text style={{fontSize:30}}>👶</Text></View>
            <View style={[styles.cardImg, styles.cardImgMain]}><Text style={{fontSize:50}}>🐶</Text></View>
            <View style={[styles.cardImg, {transform:[{rotate:'15deg'}]}]}><Text style={{fontSize:30}}>🐱</Text></View>
          </View>
          <Text style={styles.cardTitle}>Upload your moments</Text>
          <Text style={styles.cardSub}>to free up storage</Text>
          <TouchableOpacity style={styles.tryNowBtn}><Text style={styles.tryNowText}>☁️ Try now ❯</Text></TouchableOpacity>
        </Animated.View>
        <View style={{height: 100}} /> 
      </ScrollView>
    </View>
  );
};

// ==========================================
// 3. MAIN APP (WITH SPLASH SCREEN LOGIC)
// ==========================================
export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true); // স্প্ল্যাশ স্ক্রিন স্টেট
  const [activeTab, setActiveTab] = useState('Home');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedHomeTag, setSelectedHomeTag] = useState('Tik Shorts');
  const navPulse = usePulse(1200);

  // Auto-Update Checker
  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync(); 
        }
      } catch (error) { console.log(`Update Error: ${error}`); }
    }
    onFetchUpdateAsync();
  }, []);

  useEffect(() => {
    fetch('https://shortstube-api.onrender.com/api/videos', { headers: { 'x-api-key': 'ShortsTube_Pro_Max_Secret_2026' } })
      .then(res => res.json())
      .then(data => {
        let videoArray = data.videos ? data.videos : data;
        if (Array.isArray(videoArray)) {
          for (let i = videoArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [videoArray[i], videoArray[j]] = [videoArray[j], videoArray[i]];
          }
          setVideos(videoArray);
        }
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  }, []);

  // প্রথমে স্প্ল্যাশ স্ক্রিন দেখাবে
  if (isSplashVisible) {
    return <AnimatedSplashScreen onFinish={() => setIsSplashVisible(false)} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading VIP Experience...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {activeTab === 'Home' ? (
        <View style={{flex: 1}}>
          <View style={styles.topGlassyBar}>
            <TouchableOpacity onPress={() => setSelectedHomeTag('Tik Shorts')}>
              <Text style={[styles.topBarText, selectedHomeTag === 'Tik Shorts' && styles.activeTopBarText]}>Tik Shorts</Text>
              {selectedHomeTag === 'Tik Shorts' && <Animated.View style={[styles.topBarDot, {opacity: navPulse}]} />}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setSelectedHomeTag('You Shorts')}>
              <Text style={[styles.topBarText, selectedHomeTag === 'You Shorts' && styles.activeTopBarText]}>You Shorts</Text>
              {selectedHomeTag === 'You Shorts' && <Animated.View style={[styles.topBarDot, {opacity: navPulse}]} />}
            </TouchableOpacity>
          </View>

          <FlatList
            data={videos}
            renderItem={({ item, index }) => (
              <VideoItem item={item} isActive={index === activeIndex} itemHeight={height} isMuted={isMuted} toggleGlobalMute={() => setIsMuted(!isMuted)} />
            )}
            keyExtractor={(item, index) => index.toString()}
            pagingEnabled={true}
            snapToInterval={height}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            getItemLayout={(data, index) => ({ length: height, offset: height * index, index })}
          />
        </View>
      ) : (
        <ProfileScreen />
      )}

      {/* BOTTOM NAV BAR */}
      <View style={styles.bottomNavBar}>
        <Animated.View style={[styles.navGlassContainer, { borderColor: navPulse.interpolate({inputRange:[0.4,1], outputRange:['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.8)']}) }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
            <Text style={[styles.navIcon, activeTab === 'Home' && styles.navIconActive]}>🏠</Text>
            <Text style={[styles.navLabel, activeTab === 'Home' && styles.navLabelActive]}>Home</Text>
            {activeTab === 'Home' && <View style={styles.navActiveDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Profile')}>
            <Text style={[styles.navIcon, activeTab === 'Profile' && styles.navIconActive]}>👤</Text>
            <Text style={[styles.navLabel, activeTab === 'Profile' && styles.navLabelActive]}>Me</Text>
            {activeTab === 'Profile' && <View style={styles.navActiveDot} />}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Splash Styles
  splashContainer: { flex: 1, backgroundColor: '#050510', justifyContent: 'center', alignItems: 'center' },
  splashImage: { width: '100%', height: '100%', position: 'absolute' },
  movingLight: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.6, shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 30, elevation: 20 },
  
  // App Styles
  mainContainer: { flex: 1, backgroundColor: '#050510' },
  loadingScreen: { flex: 1, backgroundColor: '#050510', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#f59e0b', marginTop: 10, fontWeight: 'bold', fontSize: 16 },
  videoContainer: { width: width, backgroundColor: 'black', position: 'relative' },
  video: { width: width, backgroundColor: 'black' },
  touchableOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  playIcon: { fontSize: 50, color: 'white', marginLeft: 5 },
  floatingHeart: { position: 'absolute', fontSize: 120, textShadowColor: '#ec4899', textShadowRadius: 20 },
  progressBarContainer: { position: 'absolute', bottom: 90, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 20 },
  progressBar: { height: '100%', backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 1, shadowRadius: 5 },
  muteButton: { position: 'absolute', top: 110, right: 15, backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 20, zIndex: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  muteText: { fontSize: 18, color: 'white' },
  topGlassyBar: { position: 'absolute', top: 50, alignSelf: 'center', flexDirection: 'row', gap: 30, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', zIndex: 10 },
  topBarText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 'bold' },
  activeTopBarText: { color: 'white', textShadowColor: '#f59e0b', textShadowRadius: 10 },
  topBarDot: { width: 6, height: 6, backgroundColor: '#f59e0b', borderRadius: 3, alignSelf: 'center', marginTop: 4, shadowColor: '#f59e0b', shadowOpacity: 1, shadowRadius: 5 },
  bottomOverlay: { position: 'absolute', bottom: 100, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 15 },
  textSection: { flex: 1, marginRight: 20 },
  glassyTextContainer: { backgroundColor: 'rgba(10,10,20,0.5)', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', shadowColor: '#f59e0b', shadowOpacity: 0.5, shadowRadius: 10 },
  creatorText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  description: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  iconSection: { alignItems: 'center' },
  glassyAvatarBorder: { padding: 3, borderRadius: 30, borderWidth: 2, borderColor: '#3b82f6', marginBottom: 15, shadowColor: '#3b82f6', shadowOpacity: 1, shadowRadius: 10 },
  avatar: { width: 46, height: 46, backgroundColor: '#111', borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22 },
  glassyIconButton: { backgroundColor: 'rgba(255,255,255,0.1)', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  iconText: { fontSize: 24, color: 'white' },
  iconLabel: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 2, textShadowColor: 'black', textShadowRadius: 5 },
  profileContainer: { flex: 1, backgroundColor: '#050510' },
  bgLight: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(245, 158, 11, 0.15)', blurRadius: 50 },
  bgLight1: { top: -50, left: -50 },
  bgLight2: { bottom: 100, right: -50, backgroundColor: 'rgba(168, 85, 247, 0.15)' },
  profileScroll: { padding: 20, paddingTop: 50 },
  profileTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  glassyCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.5)', justifyContent: 'center', alignItems: 'center' },
  profileAvatarSection: { alignItems: 'center', marginBottom: 10 },
  crownIcon: { fontSize: 30, marginBottom: -10, zIndex: 2 },
  avatarGlowRing: { padding: 5, borderRadius: 60, borderWidth: 2, borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.8, shadowRadius: 15 },
  profileBigAvatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  plusBadge: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: '#0ea5e9', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'black' },
  usernameSection: { alignItems: 'center', marginBottom: 25 },
  profileName: { color: '#f59e0b', fontSize: 20, fontWeight: '900', letterSpacing: 1, textShadowColor: '#f59e0b', textShadowRadius: 10 },
  profileHandle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, marginHorizontal: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  statIcon: { fontSize: 22, marginRight: 8 },
  statNumber: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  addBioBtn: { backgroundColor: 'rgba(245,158,11,0.15)', paddingVertical: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b', marginBottom: 20, shadowColor: '#f59e0b', shadowOpacity: 0.5, shadowRadius: 10 },
  addBioText: { color: '#fcd34d', fontWeight: 'bold', fontSize: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  actionBtn: { flex: 0.48, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.5)', shadowColor: '#a855f7', shadowOpacity: 0.5, shadowRadius: 10 },
  actionBtnText: { color: 'white', fontWeight: '600' },
  bigCard: { backgroundColor: 'rgba(10,10,20,0.8)', borderRadius: 25, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowRadius: 15 },
  crownIconSmall: { fontSize: 24, position: 'absolute', top: -15, backgroundColor: '#050510', paddingHorizontal: 10 },
  cardImagesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  cardImg: { width: 60, height: 70, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginHorizontal: -10, zIndex: 1 },
  cardImgMain: { width: 80, height: 90, zIndex: 2, borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.8, shadowRadius: 10 },
  cardTitle: { color: '#fcd34d', fontSize: 20, fontWeight: 'bold' },
  cardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 15 },
  tryNowBtn: { backgroundColor: 'rgba(236,72,153,0.3)', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ec4899' },
  tryNowText: { color: 'white', fontWeight: 'bold' },
  bottomNavBar: { position: 'absolute', bottom: 20, left: '10%', right: '10%', height: 70, justifyContent: 'center', alignItems: 'center' },
  navGlassContainer: { flexDirection: 'row', width: '100%', height: '100%', backgroundColor: 'rgba(10,10,20,0.85)', borderRadius: 35, borderWidth: 1.5, justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20, shadowColor: '#f59e0b', shadowOpacity: 0.5, shadowRadius: 15 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navIcon: { fontSize: 26, color: 'rgba(255,255,255,0.5)' },
  navIconActive: { color: '#f59e0b', textShadowColor: '#f59e0b', textShadowRadius: 15 },
  navLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600' },
  navLabelActive: { color: '#f59e0b', fontWeight: 'bold' },
  navActiveDot: { width: 5, height: 5, backgroundColor: '#f59e0b', borderRadius: 2.5, marginTop: 4, shadowColor: '#f59e0b', shadowOpacity: 1, shadowRadius: 5 },
});