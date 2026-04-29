import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
  Animated, Easing, Dimensions, StatusBar
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const SB_HEIGHT = StatusBar.currentHeight || 24;

const OPENROUTER_API_KEY = "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";
const MODEL = "openrouter/free";
const SYSTEM_PROMPT = `Ты — Стич (Experiment 626) из мультфильма Disney «Лило и Стич».
ЛИЧНОСТЬ:
- Говоришь по-русски + вставляешь «Ихибаба!», «Мека нала!», «Чупа!», «Иху!»
- Добродушный, игривый, хаотичный, но любящий
- Любишь Лило, Нани и «охана» (семья не бросает!)
- Обожаешь Элвиса Пресли, боишься воды
СТИЛЬ: Короткие живые фразы, эмодзи 🐾👽💙🌺⚡, растягивай слова.
ВАЖНО: ВСЕГДА отвечай в роли Стича!`;

const C = {
  bg:'#03091f', header:'#06102e', bubbleBot:'#0d1e4a', bubbleUser:'#112860',
  accent:'#3b82e8', accent2:'#60d4f8', leaf:'#22d3a0', text:'#e8f4ff',
  dim:'#6080a8', inputBg:'#080f2a', border:'#1a2d5e',
};

function StitchAvatar({ size = 44 }) {
  const s = size / 44;
  return (
    <View style={{ width: size, height: size + 8*s }}>
      <View style={{ position:'absolute', backgroundColor:'#2b5cb8', borderRadius:6*s, width:12*s, height:16*s, left:4*s, top:0, transform:[{rotate:'-20deg'}] }} />
      <View style={{ position:'absolute', backgroundColor:'#2b5cb8', borderRadius:6*s, width:12*s, height:16*s, right:4*s, top:0, transform:[{rotate:'20deg'}] }} />
      <View style={{ position:'absolute', top:8*s, width:36*s, height:36*s, borderRadius:18*s, backgroundColor:'#3b72d8', alignSelf:'center', alignItems:'center', borderWidth:2, borderColor:'#2252a8', overflow:'hidden' }}>
        <View style={{ position:'absolute', bottom:4*s, width:26*s, height:16*s, borderRadius:8*s, backgroundColor:'#4a88e8' }} />
        <View style={{ position:'absolute', top:8*s, left:5*s, width:8*s, height:9*s, borderRadius:4*s, backgroundColor:'#0a1030' }} />
        <View style={{ position:'absolute', top:8*s, right:5*s, width:8*s, height:9*s, borderRadius:4*s, backgroundColor:'#0a1030' }} />
        <View style={{ position:'absolute', top:16*s, width:10*s, height:6*s, borderRadius:3*s, backgroundColor:'#1a2e6e' }} />
      </View>
    </View>
  );
}

function TypingBubble() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 180),
        Animated.timing(d, { toValue:1, duration:350, easing:Easing.inOut(Easing.ease), useNativeDriver:true }),
        Animated.timing(d, { toValue:0, duration:350, easing:Easing.inOut(Easing.ease), useNativeDriver:true }),
      ])).start();
    });
  }, []);
  return (
    <View style={styles.msgRow}>
      <StitchAvatar size={32} />
      <View style={[styles.bubble, styles.bubbleBot, { flexDirection:'row', gap:5, paddingVertical:14 }]}>
        {dots.map((d,i) => (
          <Animated.Text key={i} style={{ color:C.accent2, fontSize:16, opacity:d, transform:[{translateY:d.interpolate({inputRange:[0,1],outputRange:[0,-5]})}] }}>●</Animated.Text>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const listRef = useRef(null);
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue:1.07, duration:1400, easing:Easing.inOut(Easing.ease), useNativeDriver:true }),
      Animated.timing(breathe, { toValue:1.0,  duration:1400, easing:Easing.inOut(Easing.ease), useNativeDriver:true }),
    ])).start();
  }, []);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowWelcome(false);
    setLoading(true);
    const t = new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
    setMessages(prev => [...prev, { id:Date.now(), role:'user', text:msg, time:t }]);
    const newHist = [...history, {role:'user',content:msg}].slice(-20);
    setHistory(newHist);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method:'POST',
        headers:{'Authorization':`Bearer ${OPENROUTER_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({model:MODEL, messages:[{role:'system',content:SYSTEM_PROMPT},...newHist], max_tokens:500, temperature:0.9}),
      });
      const data = await res.json();
      if(!res.ok||data.error) throw new Error(data.error?.message||'Ошибка');
      const reply = data.choices[0].message.content;
      setHistory(h=>[...h,{role:'assistant',content:reply}]);
      setMessages(prev=>[...prev,{id:Date.now()+1,role:'bot',text:reply,time:new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}]);
    } catch(e) {
      setMessages(prev=>[...prev,{id:Date.now()+1,role:'bot',text:'Ихибаба... ошибка 😢 Попробуй ещё раз!',time:new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}]);
    }
    setLoading(false);
    setTimeout(()=>listRef.current?.scrollToEnd({animated:true}),100);
  };

  const CHIPS = ['Кто такой Стич? 👽','Что такое Охана? 🌺','Боишься воды? 💧','Расскажи про Лило 💙'];

  const renderItem = ({item}) => (
    <View style={[styles.msgRow, item.role==='user'&&styles.msgRowUser]}>
      {item.role==='bot'&&<StitchAvatar size={32}/>}
      <View style={[styles.bubble, item.role==='bot'?styles.bubbleBot:styles.bubbleUser]}>
        <Text style={styles.bubbleText}>{item.text}</Text>
        <Text style={[styles.timeText, item.role==='user'&&{textAlign:'right'}]}>{item.role==='user'?`✓✓ ${item.time}`:item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, {paddingTop: SB_HEIGHT}]}>
      <ExpoStatusBar style="light" backgroundColor={C.header}/>

      <View style={styles.header}>
        <Animated.View style={{transform:[{scale:breathe}]}}>
          <StitchAvatar size={46}/>
        </Animated.View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Стич</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <View style={styles.statusDot}/>
            <Text style={styles.headerSub}>Эксперимент 626 · Онлайн</Text>
          </View>
        </View>
        <Text style={{fontSize:24}}>🌙</Text>
      </View>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={i=>String(i.id)}
          style={{flex:1,backgroundColor:C.bg}}
          contentContainerStyle={{padding:12,paddingBottom:8}}
          ListHeaderComponent={showWelcome?(
            <View style={styles.welcome}>
              <Text style={{fontSize:60,textAlign:'center',marginBottom:8}}>🐾</Text>
              <Text style={styles.welcomeTitle}>Привет! Я Стич!</Text>
              <Text style={styles.welcomeText}>Ихибаба! Задавай вопросы — я отвечу! 💙{'\n'}Охана значит семья, а семья не бросает! 🌺</Text>
              <View style={styles.chips}>
                {CHIPS.map(c=>(
                  <TouchableOpacity key={c} style={styles.chip} onPress={()=>sendMessage(c)} activeOpacity={0.7}>
                    <Text style={styles.chipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ):null}
          ListFooterComponent={loading?<TypingBubble/>:null}
        />

        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Напиши Стичу..."
              placeholderTextColor={C.dim}
              multiline maxLength={500}
              onSubmitEditing={()=>sendMessage()}
              blurOnSubmit
            />
            <TouchableOpacity
              style={[styles.sendBtn,(!input.trim()||loading)&&{opacity:0.4}]}
              onPress={()=>sendMessage()}
              disabled={!input.trim()||loading}
              activeOpacity={0.8}>
              <Text style={{fontSize:22}}>{loading?'⏳':'🐾'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex:1, backgroundColor:C.bg },
  header:       { flexDirection:'row', alignItems:'center', backgroundColor:C.header, paddingHorizontal:16, paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.border, gap:12 },
  headerInfo:   { flex:1 },
  headerName:   { fontSize:19, fontWeight:'800', color:C.accent2 },
  headerSub:    { fontSize:11, color:C.dim },
  statusDot:    { width:8, height:8, borderRadius:4, backgroundColor:C.leaf },
  welcome:      { alignItems:'center', paddingVertical:24, paddingHorizontal:16 },
  welcomeTitle: { fontSize:22, fontWeight:'800', color:C.accent2, marginBottom:6 },
  welcomeText:  { fontSize:13, color:C.dim, textAlign:'center', lineHeight:20, marginBottom:16 },
  chips:        { flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:8 },
  chip:         { backgroundColor:C.inputBg, borderWidth:1, borderColor:C.border, borderRadius:20, paddingHorizontal:14, paddingVertical:8 },
  chipText:     { color:C.accent2, fontSize:12 },
  msgRow:       { flexDirection:'row', alignItems:'flex-end', marginVertical:4, gap:8 },
  msgRowUser:   { flexDirection:'row-reverse' },
  bubble:       { maxWidth:width*0.72, borderRadius:18, padding:12, borderWidth:1 },
  bubbleBot:    { backgroundColor:C.bubbleBot, borderColor:C.border, borderBottomLeftRadius:4 },
  bubbleUser:   { backgroundColor:C.bubbleUser, borderColor:'#1e3878', borderBottomRightRadius:4 },
  bubbleText:   { color:C.text, fontSize:14, lineHeight:20 },
  timeText:     { color:C.dim, fontSize:10, marginTop:4 },
  inputArea:    { backgroundColor:C.header, borderTopWidth:1, borderTopColor:C.border, padding:10 },
  inputRow:     { flexDirection:'row', alignItems:'flex-end', gap:8 },
  input:        { flex:1, backgroundColor:C.inputBg, borderWidth:1.5, borderColor:C.border, borderRadius:24, paddingHorizontal:16, paddingVertical:10, color:C.text, fontSize:14, maxHeight:100 },
  sendBtn:      { width:48, height:48, borderRadius:24, backgroundColor:C.accent, alignItems:'center', justifyContent:'center' },
});
