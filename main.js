const canvas=document.getElementById('game-canvas');
const speechBubble=document.getElementById('speech-bubble');
const socket=OfficeSocket();

const nexoraImg=new Image();nexoraImg.src='assets/nexora-boss.png';
const nexoraOfflineImg=new Image();nexoraOfflineImg.src='assets/nexora-offline.png';
const looploomImg=new Image();looploomImg.src='assets/looploom.png';
const looploomOfflineImg=new Image();looploomOfflineImg.src='assets/looploom-offline.png';
const signalscoutImg=new Image();signalscoutImg.src='assets/signalscout.png';
const signalscoutOfflineImg=new Image();signalscoutImg.src='assets/signalscout.png';signalscoutOfflineImg.src='assets/signalscout-offline.png';
const shadowledgerImg=new Image();shadowledgerImg.src='assets/shadowledger.png';
const shadowledgerOfflineImg=new Image();shadowledgerOfflineImg.src='assets/shadowledger-offline.png';

const members=[
{id:'main',name:'Nexora 🦞',x:2,y:3.2,role:'指揮台',status:'offline',agentStatus:'idle',img:nexoraImg,offlineImg:nexoraOfflineImg,offlinePos:{x:4.2,y:1.2},isBoss:true,mood:'穩定運作中',tokens:0,tasks:0},
{id:'looploom',name:'LoopLoom 🕷️',x:2,y:9,role:'開發區',status:'offline',agentStatus:'idle',img:looploomImg,offlineImg:looploomOfflineImg,offlinePos:{x:8,y:7},mood:'待命中',tokens:0,tasks:0},
{id:'signalscout',name:'SignalScout 蜥',x:2.3,y:6.3,role:'情報區',status:'offline',agentStatus:'idle',img:signalscoutImg,offlineImg:signalscoutOfflineImg,offlinePos:{x:6.1,y:4.2},mood:'待命中',tokens:0,tasks:0},
{id:'shadowledger',name:'ShadowLedger 🦉',x:6,y:9,role:'財務區',status:'offline',agentStatus:'idle',img:shadowledgerImg,offlineImg:shadowledgerOfflineImg,offlinePos:{x:9,y:4},mood:'待命中',tokens:0,tasks:0}
];
OfficeState.setMembers(members);

let latestAnnouncement='待命中';
function pushTimeline(type,summary,meta={}){OfficeState.pushEvent(TimelineModel.create(type,summary,meta));OfficeUI.renderTimeline(OfficeState.timeline,OfficeState.activeTimelineFilter);OfficeUI.updateSummary(members,OfficeState.timeline,latestAnnouncement);}

function findMemberByAgent(agentId){return members.find(m=>m.id===agentId||m.name.includes(agentId));}
function findHotspotHintText(){const selected=OfficeState.selectedMemberId;return OfficeHotspots.find(h=>h.id===selected)||OfficeHotspots.find(h=>h.id==='warroom');}

OfficeScene.init({canvas,members});
OfficeEvents.bindFilters(filter=>{OfficeState.setFilter(filter);OfficeUI.renderTimeline(OfficeState.timeline,filter);});
canvas.addEventListener('click',e=>{const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;const member=OfficeScene.hitTest(x,y);if(member){OfficeState.selectMember(member.id);OfficeUI.openDrawer(member);document.getElementById('drawer-link').href=`/agent?focus=${member.id}`;OfficeUI.showSpeech(member,member.mood||'收到');if(member.agentStatus==='error'){Phase3Effects.showBanner(`${member.name} 需要支援，請關注狀態異常`);}return;}const hotspot=findHotspotHintText();if(hotspot&&hotspot.id==='warroom'){location.href='/dashboard';}});
canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect();const member=OfficeScene.hitTest(e.clientX-rect.left,e.clientY-rect.top);if(member){const hotspot=OfficeHotspots.find(h=>h.id===member.id);if(hotspot)Phase3Effects.showHint(e.clientX+12,e.clientY+12,hotspot.label,hotspot.summary);}else{Phase3Effects.hideHint();}});

socket.on('sync_update',data=>{const member=findMemberByAgent(data.agentId);if(member){member.status='online';member.agentStatus=data.status||member.agentStatus;member.tokens+=(data.input||0)+(data.output||0);member.mood=data.mood||member.mood;OfficeScene.setSystemLoad(Math.min(1,((data.output||0)/5000)+0.2));pushTimeline('sync',`${member.name} 同步狀態：${member.agentStatus}`);if(member.agentStatus==='error'){pushTimeline('alert',`${member.name} 發生異常狀態，請介入處理`);Phase3Effects.showBanner(`${member.name} 發生異常，戰情燈號已亮起`);}if((data.taskCompleted||false)===true){pushTimeline('achievement',`${member.name} 完成一項任務`);Phase3Effects.showAchievement(`${member.name} 完成任務，戰功 +1`);}}});
socket.on('announcement',data=>{latestAnnouncement=data.message||'有新公告';pushTimeline(data.type==='task'?'command':'system',`[${data.sender}] ${data.message}`);const member=members.find(m=>data.message?.includes(m.name)||data.sender?.includes(m.name));if(member)OfficeUI.showSpeech(member,data.message.length>20?data.message.substring(0,20)+'...':data.message,4000);});
socket.on('boss_command',data=>{const target=findMemberByAgent(data.target)||findMemberByAgent('looploom');pushTimeline('command',`幫主下令給 ${target?.name||'成員'}：${data.command}`);const boss=findMemberByAgent('main');if(boss)OfficeUI.showSpeech(boss,`📢 ${data.command}`,2600);Phase3Effects.showBanner(`指令已下達：${data.command}`);if(target)setTimeout(()=>OfficeUI.showSpeech(target,'🫡 收到，立即執行！',2200),1800);});

async function bootstrap(){try{const statuses=await OfficeApi.getStatus();const backstage=await OfficeApi.getBackstage();const focus=OfficeFocus.apply();members.forEach(member=>{member.status=statuses[member.id]||'offline';const mood=(backstage.moods||[]).find(m=>m.agent===member.id||m.agent===member.name||String(m.agent).includes(member.id));if(mood){member.mood=mood.mood;member.agentStatus=mood.status||member.agentStatus;}const stats=(backstage.members||[]).find(m=>m.name===member.name||m.name?.includes(member.id));if(stats){member.tokens=stats.tokens||0;member.tasks=stats.tasks||0;}});OfficeState.setDashboard(backstage);pushTimeline('system','雙軌模式已啟動：Office + Dashboard');pushTimeline('system','已載入辦公室初始狀態');if(focus){const focused=findMemberByAgent(focus);if(focused){OfficeState.selectMember(focused.id);OfficeUI.openDrawer(focused);Phase3Effects.showBanner(`已聚焦 ${focused.name}`);}}}catch(err){pushTimeline('system','讀取初始狀態失敗');console.error(err);}}

bootstrap();