/* ── 今天：签到 · 硬币 · 扭蛋 · 明信片 ──
   index.html 里那段脚本是包起来的，P / SERIES / viewEl 都不是全局变量，
   所以这里只定义一个入口，由 index.html 在原来扭蛋机的位置调用一次：
     TIDE_INIT({P:P,SERIES:SERIES,viewEl:viewEl});
   顺序很重要：这个文件要在那段内联脚本之前加载。 */
window.TIDE_INIT=function(ctx){
    var P=ctx.P, SERIES=ctx.SERIES, viewEl=ctx.viewEl;
    var v=viewEl("gacha");

    /* ───── 画线：和星星、扭蛋机同一支笔 ───── */
    function J(a){ return (Math.random()*2-1)*a; }
    function ink(pts,close,amp){
      var d="",i,x,y;
      for(i=0;i<pts.length;i++){
        x=pts[i][0]+J(amp); y=pts[i][1]+J(amp);
        d+=(i?"L":"M")+x.toFixed(1)+","+y.toFixed(1);
      }
      if(close)d+="Z";
      return d;
    }
    function circle(cx,cy,r,amp,n){
      var p=[],i,th; n=n||30;
      for(i=0;i<=n;i++){ th=i/n*6.283; p.push([cx+Math.cos(th)*r, cy+Math.sin(th)*r]); }
      return ink(p,false,amp||.6);
    }
    function wave(x0,x1,y,amp,n,ph){
      var p=[],i,t; n=n||26; ph=ph||0;
      for(i=0;i<=n;i++){ t=i/n; p.push([x0+(x1-x0)*t, y+Math.sin(t*9+ph)*amp]); }
      return ink(p,false,.3);
    }
    function sv(w,h,b,extra){
      return '<svg viewBox="0 0 '+w+' '+h+'"'+(extra||' width="'+w+'" height="'+h+'"')+
             ' aria-hidden="true">'+b+'</svg>';
    }

    /* ───── 存档 ───── */
    var ST="tide-v1", S=null;
    try{ S=JSON.parse(localStorage.getItem(ST)||"null"); }catch(e){}
    if(!S||typeof S!=="object"||typeof S.coins!=="number"){
      S={coins:3,last:-1,streak:0,seen:{}};
      /* 把以前扭蛋机攒的收集记录接过来，别让她白抽 */
      try{
        var old=JSON.parse(localStorage.getItem("gacha-seen")||"{}");
        if(old&&typeof old==="object") S.seen=old;
      }catch(e){}
    }
    if(!S.seen||typeof S.seen!=="object") S.seen={};
    function save(){ try{ localStorage.setItem(ST,JSON.stringify(S)); }catch(e){} }

    /* 按本地时区算「哪一天」 */
    function dayIdx(d){
      d=d||new Date();
      return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);
    }

    /* ───── 稀有度：越私密的越难抽到。编号即 P 的 1-based 序号 ───── */
    var RANK={};
    [17,18,19].forEach(function(n){RANK[n]="SSS";});
    [2,20,21,35,38,40].forEach(function(n){RANK[n]="SS";});
    [3,5,9,11,15,29,30,32,36,37,39,45].forEach(function(n){RANK[n]="S";});
    /* P 初始化后被重排过，下标 ≠ 照片编号，必须从 src 取真实编号 */
    function numOf(i){ var m=/(\d+)\.jpg$/.exec(P[i].src); return m?+m[1]:0; }
    function rankOf(i){ return RANK[numOf(i)]||"A"; }
    function idxOfNum(n){
      for(var i=0;i<P.length;i++) if(numOf(i)===n) return i;
      return -1;
    }
    function seriesName(p){
      var s=SERIES.filter(function(x){return x.id===p.s;})[0];
      return s?s.en:"";
    }
    var SHALLOW={SSS:0.67,SS:1.33,S:2.08,A:2.60},
        DEEP   ={SSS:9.0, SS:5.0, S:2.20,A:0.50},
        COST   ={shallow:1,deep:3};

    function pick(deep){
      var w=deep?DEEP:SHALLOW, pool=[], i, tot=0, r;
      for(i=0;i<P.length;i++) if(!S.seen[numOf(i)]) pool.push(i);
      /* 全见过了才开始重复 */
      if(!pool.length) for(i=0;i<P.length;i++) pool.push(i);
      for(i=0;i<pool.length;i++) tot+=w[rankOf(pool[i])];
      r=Math.random()*tot;
      for(i=0;i<pool.length;i++){ r-=w[rankOf(pool[i])]; if(r<=0) return pool[i]; }
      return pool[pool.length-1];
    }

    /* 今天的一张：按日期定死，一轮走完才重复 */
    function gcd(a,b){ return b?gcd(b,a%b):a; }
    var STRIDE=(function(){
      var k=Math.floor(P.length*0.618)||1;
      while(k<P.length&&gcd(k,P.length)!==1) k++;
      return gcd(k,P.length)===1?k:1;
    })();
    function todayIdx(){ return ((dayIdx()*STRIDE)%P.length+P.length)%P.length; }

    /* ───── 零件 ───── */
    function machine(){
      var s='';
      s+='<path class="ln" d="'+circle(112,92,70,.5,76)+'"/>';
      [[90,82,12],[128,76,10],[104,112,11],[140,106,9],[78,112,8],[120,132,8]]
        .forEach(function(b){ s+='<path class="ln ball" d="'+circle(b[0],b[1],b[2],.4,30)+'"/>'; });
      s+='<path class="ln" d="'+ink([[66,156],[158,156],[164,172],[60,172]],true,.55)+'"/>';
      s+='<path class="ln" d="'+ink([[60,172],[164,172],[158,278],[66,278]],true,.6)+'"/>';
      s+='<g class="crank">'+
         '<path class="ln" d="'+circle(112,200,17,.45,34)+'"/>'+
         '<path class="ln" d="'+ink([[112,200],[112,187]],false,.4)+'"/>'+
         '<path class="ln" d="'+circle(112,184,4.5,.35,14)+'"/></g>';
      s+='<path class="ln" d="'+ink([[88,234],[136,234],[136,266],[88,266]],true,.55)+'"/>';
      s+='<path class="ln" d="'+ink([[141,196],[141,206]],false,.4)+'"/>';
      return sv(224,300,s,' width="100%"');
    }
    function halfArc(cx,cy,r,top){
      var p=[],i,th,n=22;
      for(i=0;i<=n;i++){ th=Math.PI+(i/n)*Math.PI; if(!top)th-=Math.PI;
        p.push([cx+Math.cos(th)*r, cy+Math.sin(th)*r]); }
      p.push([cx+(top?r:-r),cy]);
      return p;
    }
    function capsule(){
      return '<svg viewBox="0 0 100 100" aria-hidden="true">'+
        '<path class="top" d="'+ink(halfArc(50,50,34,true),false,1)+'"/>'+
        '<path class="bot" d="'+ink(halfArc(50,50,34,false),false,1)+'"/>'+
        '<path class="seam" d="'+ink([[16,50],[84,50]],false,.8)+'"/></svg>';
    }
    /* 签到位：没盖是一圈虚线，盖了是邮戳 */
    function slotArt(on,dateStr){
      var s='',i,th;
      if(!on){
        for(i=0;i<46;i++){ th=i/46*6.283;
          s+='<circle class="dot" opacity=".3" cx="'+(52+Math.cos(th)*40).toFixed(1)+
             '" cy="'+(52+Math.sin(th)*40).toFixed(1)+'" r="1.05"/>'; }
        s+='<text x="52" y="57" text-anchor="middle" font-size="21" opacity=".55">签到</text>';
      }else{
        s+='<g class="stamped" opacity=".52">';
        s+='<path class="ln thin" d="'+circle(52,52,40,1.3,38)+'"/>';
        s+='<path class="ln thin" d="'+circle(52,52,33.5,1,36)+'"/>';
        s+='<text x="52" y="44" text-anchor="middle" font-size="9" letter-spacing=".7">TIDELINE</text>';
        s+='<path class="ln thin" d="'+ink([[32,49],[72,49]],false,.5)+'"/>';
        s+='<text x="52" y="65" text-anchor="middle" font-size="14">'+dateStr+'</text>';
        s+='</g>';
      }
      return sv(104,104,s);
    }
    /* 潮位线：七格，来过的那几格水涨上来 */
    function tideArt(days){
      var W=430,s='',i,x,gap=(W-24)/6,n=Math.max(0,Math.min(7,days));
      s+='<path class="ln hair" d="'+ink([[8,40],[W-8,40]],false,.8)+'"/>';
      for(i=0;i<7;i++){
        x=12+i*gap;
        s+='<path class="ln '+(i<n?'':'hair')+'" d="'+
           ink([[x,40],[x,i<n?30:34.5]],false,.45)+'"/>';
        if(i<n) s+='<circle class="dot" cx="'+x.toFixed(1)+'" cy="26.5" r="2.4"/>';
      }
      if(n>0){
        var right=12+(n-1)*gap+gap*.55;
        s+='<path class="ln thin" d="'+wave(8,right,45,1.8,34)+'" opacity=".55"/>';
        s+='<path class="ln hair" d="'+wave(8,right,51,1.4,34,2)+'"/>';
      }
      return sv(W,58,s,' width="100%"');
    }
    function coinArt(r){
      r=r||13; var c=r+2,W=r*2+4,s='';
      s+='<path class="ln thin" d="'+circle(c,c,r,.5,26)+'"/>';
      s+='<path class="ln hair" d="'+circle(c,c,r-3.6,.4,22)+'"/>';
      s+='<path class="ln thin" d="'+wave(c-r*.55,c+r*.55,c+1,1.5,14)+'"/>';
      return sv(W,W,s);
    }
    function cornersArt(w,h){
      var s='',k=22;
      function tri(x,y,sx,sy){
        return '<path class="ln thin" d="'+ink([[x,y+sy*k],[x,y],[x+sx*k,y]],false,.8)+'"/>'+
               '<path class="ln hair" d="'+ink([[x,y+sy*k],[x+sx*k,y]],false,.7)+'"/>';
      }
      s+=tri(2,2,1,1)+tri(w-2,2,-1,1)+tri(2,h-2,1,-1)+tri(w-2,h-2,-1,-1);
      return sv(w,h,s,' width="100%" height="100%" preserveAspectRatio="none"');
    }
    function veilArt(w,h){
      var s='',i,n=Math.floor(w/13);
      for(i=0;i<n;i++) s+='<path class="ln hair" d="'+
        ink([[i*13-h*.35,h],[i*13,0]],false,1.1)+'" opacity=".16"/>';
      s+='<path class="ln hair" d="'+ink([[1,1],[w-1,1],[w-1,h-1],[1,h-1]],true,.9)+'"/>';
      return sv(w,h,s,' width="100%" height="100%" preserveAspectRatio="none"');
    }

    /* ───── 页面 ───── */
    var MON=["一月","二月","三月","四月","五月","六月",
             "七月","八月","九月","十月","十一月","十二月"],
        CN=["〇","一","二","三","四","五","六","七","八","九","十"],
        EN=["January","February","March","April","May","June",
            "July","August","September","October","November","December"];
    function cnNum(n){
      if(n<=10) return CN[n];
      if(n<20) return "十"+(n>10?CN[n-10]:"");
      return CN[Math.floor(n/10)]+"十"+(n%10?CN[n%10]:"");
    }
    function pad(n){ return (n<10?"0":"")+n; }

    var now=new Date(),
        dateEn=now.getDate()+" "+EN[now.getMonth()],
        dateZh=MON[now.getMonth()]+cnNum(now.getDate())+"日",
        stampDate=pad(now.getDate())+"."+pad(now.getMonth()+1)+"."+
                  String(now.getFullYear()).slice(2);

    v.innerHTML='<div class="leaf one"><div class="gc">'+
      '<h2 class="gc-day">Today</h2>'+
      '<p class="gc-dayzh">今 天</p>'+
      '<p class="gc-date">'+dateEn+' · '+dateZh+'</p>'+

      '<div class="gc-sign">'+
        '<button class="gc-slot" id="gc-slot" type="button"></button>'+
        '<span class="gc-signw" id="gc-signw"></span>'+
      '</div>'+

      '<div class="gc-tide" id="gc-tide"></div>'+
      '<div class="gc-tidecap" id="gc-tidecap"></div>'+

      '<div class="gc-coins" id="gc-coins"></div>'+
      '<p class="gc-coinhint" id="gc-coinhint"></p>'+

      '<h3 class="gc-th">Today\'s Photograph</h3>'+
      '<p class="gc-tzh">今 天 的 一 张</p>'+
      '<div class="gc-shot" id="gc-shot"></div>'+
      '<div class="gc-shotcap" id="gc-shotcap"></div>'+

      '<div class="gc-m" id="gc-m" role="button" tabindex="0" aria-label="转动把手"></div>'+
      '<div class="gc-buy">'+
        '<button class="gc-btn" id="gc-b1" type="button"></button>'+
        '<button class="gc-btn" id="gc-b3" type="button"></button>'+
      '</div>'+
      '<p class="gc-count" id="gc-count"></p>'+
      '<div id="gc-out"></div>'+
      '<div class="gc-book" id="gc-book" aria-label="收集册"></div>'+
    '</div></div>';

    var $=function(id){ return v.querySelector("#"+id); },
        slotEl=$("gc-slot"), signwEl=$("gc-signw"),
        tideEl=$("gc-tide"), tideCapEl=$("gc-tidecap"),
        coinsEl=$("gc-coins"), hintEl=$("gc-coinhint"),
        shotEl=$("gc-shot"), shotCapEl=$("gc-shotcap"),
        mEl=$("gc-m"), b1=$("gc-b1"), b3=$("gc-b3"),
        cntEl=$("gc-count"), outEl=$("gc-out"), bookEl=$("gc-book"),
        busy=false, justGot=0;

    mEl.innerHTML=machine();

    function signedToday(){ return S.last===dayIdx(); }
    function got(){ var n=0,k; for(k in S.seen) if(S.seen[k]) n++; return n; }

    function renderSign(){
      var on=signedToday();
      slotEl.innerHTML=slotArt(on,stampDate);
      slotEl.disabled=on;
      signwEl.innerHTML=on
        ? 'Checked in<i>已签到</i>'
        : 'Check in<i>点一下，盖个戳</i>';
    }
    function renderTide(){
      var d=S.streak, left=7-(d%7||(d?7:0));
      tideEl.innerHTML=tideArt(d%7||(d?7:0));
      tideCapEl.innerHTML=
        '<span>'+(d?'Day '+d:'Not yet')+'<i>'+(d?'连续第'+cnNum(d)+'天':'还没开始')+'</i></span>'+
        '<span>'+(d&&left===7?'Seven! +2':(left+' day'+(left===1?'':'s')+' to go'))+
          '<i>'+(d&&left===7?'满七天，多给两枚':'还差'+cnNum(left)+'天')+'</i></span>';
    }
    function renderCoins(){
      var n=S.coins,h="",i,show=Math.min(n,8);
      for(i=0;i<show;i++)
        h+='<span class="'+(justGot&&i>=show-justGot?'new':'')+'">'+coinArt(13)+'</span>';
      h+='<span class="n">×'+n+'</span>';
      coinsEl.innerHTML=h;
      hintEl.innerHTML=justGot
        ? 'Just now, +'+justGot+'<i>刚刚得了'+cnNum(justGot)+'枚</i>'
        : (signedToday()
            ? 'One a day, two more at seven<i>每天一枚，满七天多两枚</i>'
            : '+1 for checking in<i>签到再得一枚</i>');
      justGot=0;
    }
    function renderToday(){
      var on=signedToday(), i=todayIdx(), p=P[i];
      if(on){
        shotEl.className="gc-shot lit";
        shotEl.innerHTML='<img alt="'+seriesName(p)+'" src="'+p.src+'">'+
          '<span class="corners">'+cornersArt(488,288)+'</span>';
        shotCapEl.innerHTML='<span>'+seriesName(p)+'</span><span>'+numOf(i)+'</span>';
        if(!S.seen[numOf(i)]){ S.seen[numOf(i)]=1; save(); }
      }else{
        shotEl.className="gc-shot";
        shotEl.innerHTML='<span class="veil">'+veilArt(470,313)+'</span>'+
          '<span class="veilw">Develops after check-in<i>签到后显影</i></span>'+
          '<span class="corners">'+cornersArt(488,288)+'</span>';
        shotCapEl.innerHTML='<span>— —</span><span>— —</span>';
      }
    }
    function renderBuy(){
      b1.innerHTML='<span class="c">'+coinArt(8)+'</span>Shallow 浅水';
      b3.innerHTML='<span class="c">'+coinArt(8)+coinArt(8)+coinArt(8)+'</span>Deep 深水';
      b1.disabled=busy||S.coins<COST.shallow;
      b3.disabled=busy||S.coins<COST.deep;
    }
    function renderBook(){
      var n=got(),html="",i;
      cntEl.innerHTML=(n>=P.length
        ? 'All '+P.length+' found<i>你把她全部看完了</i>'
        : n+' / '+P.length+' collected<i>你已收集</i>');
      for(i=0;i<P.length;i++){
        html+=S.seen[numOf(i)]
          ? '<div class="gc-cell"><img alt="" loading="lazy" src="'+P[i].thumb+'"></div>'
          : '<div class="gc-cell locked"></div>';
      }
      bookEl.innerHTML=html;
    }
    function renderAll(){
      renderSign(); renderTide(); renderCoins();
      renderToday(); renderBuy(); renderBook();
    }

    slotEl.addEventListener("click",function(){
      var t=dayIdx();
      if(S.last===t) return;
      S.streak=(S.last===t-1)?S.streak+1:1;
      S.last=t; S.coins+=1; justGot=1;
      if(S.streak%7===0){ S.coins+=2; justGot=3; }
      save(); renderAll();
    });

    /* ───── 涟漪与雨：稀有度只用水来表达 ───── */
    function ripples(host,rings,delayStep){
      var NS="http://www.w3.org/2000/svg", s=document.createElementNS(NS,"svg");
      s.setAttribute("class","gc-water");
      s.setAttribute("viewBox","0 0 240 70");
      s.setAttribute("aria-hidden","true");
      for(var k=0;k<rings;k++){
        var pts=[],N=30,i,th,rr,R=50+k*22;
        for(i=0;i<=N;i++){ th=(i/N)*6.283; rr=R*(1+J(.03));
          pts.push([120+Math.cos(th)*rr, 35+Math.sin(th)*rr*.3]); }
        var p=document.createElementNS(NS,"path");
        p.setAttribute("d",ink(pts,false,0));
        p.setAttribute("style","animation-delay:"+(k*delayStep)+"s");
        s.appendChild(p);
      }
      host.appendChild(s);
      setTimeout(function(){ if(s.parentNode)s.parentNode.removeChild(s); },
                 1900+rings*delayStep*1000);
    }
    function rain(host,drops){
      var NS="http://www.w3.org/2000/svg", s=document.createElementNS(NS,"svg");
      s.setAttribute("class","gc-rain");
      s.setAttribute("viewBox","0 0 100 100");
      s.setAttribute("preserveAspectRatio","none");
      s.setAttribute("aria-hidden","true");
      for(var k=0;k<drops;k++){
        var x=6+Math.random()*88, l=document.createElementNS(NS,"line");
        l.setAttribute("x1",x.toFixed(1)); l.setAttribute("y1","0");
        l.setAttribute("x2",(x+J(1.5)).toFixed(1)); l.setAttribute("y2","9");
        l.setAttribute("style","animation-delay:"+(Math.random()*.9).toFixed(2)+"s");
        s.appendChild(l);
      }
      host.appendChild(s);
      setTimeout(function(){ if(s.parentNode)s.parentNode.removeChild(s); },2400);
    }

    function reveal(idx){
      var p=P[idx], rank=rankOf(idx), dup=!!S.seen[numOf(idx)];
      S.seen[numOf(idx)]=1; save();

      var card=document.createElement("div");
      card.className="gc-card";
      card.innerHTML='<img alt="'+seriesName(p)+'" src="'+p.src+'">'+
        '<div class="gc-meta"><span class="gc-ser">'+seriesName(p)+'</span>'+
        '<span class="gc-rank">'+rank+'</span></div>'+
        (dup?'<p class="gc-dup">这张你见过了。</p>':'')+
        '<button class="gc-send" type="button">Send as a postcard 寄一张明信片</button>';
      outEl.innerHTML=""; outEl.appendChild(card);
      card.querySelector(".gc-send").addEventListener("click",function(){
        openCard({mode:"write",n:numOf(idx)});
      });

      var plan={A:{wait:0,rings:1,step:0,drops:0},
                S:{wait:260,rings:3,step:.18,drops:0},
                SS:{wait:620,rings:5,step:.2,drops:9},
                SSS:{wait:1500,rings:8,step:.22,drops:18}}[rank];
      setTimeout(function(){
        card.classList.add("in");
        ripples(card,plan.rings,plan.step);
        if(plan.drops)rain(card,plan.drops);
      },plan.wait);
      setTimeout(function(){ busy=false; renderBuy(); renderBook(); },plan.wait+900);
    }

    function turn(deep){
      var cost=deep?COST.deep:COST.shallow;
      if(busy||S.coins<cost) return;
      busy=true; S.coins-=cost; save();
      renderCoins(); renderBuy();
      outEl.innerHTML="";
      mEl.classList.remove("turn"); void mEl.offsetWidth; mEl.classList.add("turn");

      var cap=document.createElement("div");
      cap.className="gc-cap drop"; cap.innerHTML=capsule();
      cap.setAttribute("role","button"); cap.setAttribute("tabindex","0");
      cap.setAttribute("aria-label","打开蛋");
      outEl.appendChild(cap);

      var idx=pick(deep), opened=false;
      function openIt(){
        if(opened)return; opened=true;
        cap.classList.remove("wob"); cap.classList.add("crack");
        setTimeout(function(){ reveal(idx); },620);
      }
      cap.addEventListener("click",openIt);
      cap.addEventListener("keydown",function(e){
        if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openIt(); }});
      setTimeout(function(){ cap.classList.add("wob"); },900);
      /* 不点也会自己开，别卡住 */
      setTimeout(openIt,3200);
    }

    b1.addEventListener("click",function(){ turn(false); });
    b3.addEventListener("click",function(){ turn(true); });
    mEl.addEventListener("click",function(){ turn(false); });
    mEl.addEventListener("keydown",function(e){
      if(e.key==="Enter"||e.key===" "){ e.preventDefault(); turn(false); }});

    renderAll();

    /* ───────────── 明信片 ───────────── */
    var MAXT=90, MAXN=16;

    function b64e(s){
      return btoa(unescape(encodeURIComponent(s)))
        .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    }
    function b64d(s){
      s=s.replace(/-/g,"+").replace(/_/g,"/");
      while(s.length%4) s+="=";
      return decodeURIComponent(escape(atob(s)));
    }
    function encCard(o){ return b64e(JSON.stringify(o)); }
    function decCard(s){
      var o=JSON.parse(b64d(s));
      if(!o||typeof o!=="object") return null;
      return {n:+o.n||0,
              t:String(o.t||"").slice(0,MAXT),
              f:String(o.f||"").slice(0,MAXN)};
    }

    /* 卡片边框：四条微微外鼓的线 */
    function frameArt(w,h,r){
      var p=[],i,t,n=16,m=3;
      function edge(x0,y0,x1,y1,bow){
        for(i=0;i<=n;i++){ t=i/n;
          var nx=-(y1-y0), ny=(x1-x0), L=Math.hypot(nx,ny),
              b=Math.sin(t*Math.PI)*bow;
          p.push([x0+(x1-x0)*t+nx/L*b, y0+(y1-y0)*t+ny/L*b]);
        }
      }
      function corner(cx,cy,a0){
        for(i=0;i<=5;i++){ var th=a0+(i/5)*(Math.PI/2);
          p.push([cx+Math.cos(th)*r, cy+Math.sin(th)*r]); }
      }
      edge(m+r,m, w-m-r,m, .9);        corner(w-m-r,m+r,-Math.PI/2);
      edge(w-m,m+r, w-m,h-m-r, .9);    corner(w-m-r,h-m-r,0);
      edge(w-m-r,h-m, m+r,h-m, .9);    corner(m+r,h-m-r,Math.PI/2);
      edge(m,h-m-r, m,m+r, .9);        corner(m+r,m+r,Math.PI);
      return sv(w,h,'<path class="ln" d="'+ink(p,true,.9)+'"/>',
                ' width="100%" height="100%" preserveAspectRatio="none"');
    }
    function stampArt(){
      var s='',i;
      s+='<path class="ln thin" d="'+ink([[7,7],[67,7],[67,81],[7,81]],true,.7)+'"/>';
      for(i=0;i<=10;i++){ s+='<circle class="dot" cx="'+(7+i*6)+'" cy="7" r="1.15"/>'+
                             '<circle class="dot" cx="'+(7+i*6)+'" cy="81" r="1.15"/>'; }
      for(i=1;i<13;i++){ s+='<circle class="dot" cx="7" cy="'+(7+i*5.7)+'" r="1.15"/>'+
                            '<circle class="dot" cx="67" cy="'+(7+i*5.7)+'" r="1.15"/>'; }
      s+='<path class="ln thin" d="'+circle(37,33,12,.55,28)+'"/>';
      s+='<path class="ln thin" d="'+wave(14,60,53,2.3,24)+'"/>';
      s+='<path class="ln thin" d="'+wave(14,60,61,1.9,24,2)+'"/>';
      s+='<text x="37" y="76" text-anchor="middle" font-size="9" opacity=".6">潮汐线</text>';
      return sv(74,88,s,' width="100%"');
    }
    function pmArt(d){
      var s='<g opacity=".46">',i;
      s+='<path class="ln thin" d="'+circle(80,42,30,1.1,36)+'"/>';
      s+='<path class="ln thin" d="'+circle(80,42,25,.9,34)+'"/>';
      s+='<text x="80" y="35" text-anchor="middle" font-size="7.5" letter-spacing=".6">TIDELINE</text>';
      s+='<path class="ln thin" d="'+ink([[65,39],[95,39]],false,.4)+'"/>';
      s+='<text x="80" y="53" text-anchor="middle" font-size="11.5">'+d+'</text>';
      for(i=0;i<4;i++) s+='<path class="ln thin" d="'+wave(4,48,28+i*9,1.7,20,i)+'"/>';
      return sv(118,84,s+'</g>',' width="100%"');
    }
    function rulesArt(){
      var s='',i;
      for(i=0;i<4;i++) s+='<path class="ln hair" d="'+wave(4,268,14+i*51,1.1,24,i*1.7)+'"/>';
      return sv(272,190,s,' width="100%"');
    }
    function addrArt(){
      var s='',i;
      for(i=0;i<3;i++) s+='<path class="ln hair" d="'+wave(2,154,8+i*17,1,20,i*2)+'"/>';
      return sv(158,46,s,' width="100%"');
    }
    function boatArt(){
      var s='',i;
      s+='<path class="ln" d="'+ink([[18,30],[44,30],[39,38],[23,38]],true,.7)+'"/>';
      s+='<path class="ln" d="'+ink([[31,29],[31,10]],false,.5)+'"/>';
      s+='<path class="ln" d="'+ink([[32,11],[46,27],[32,27]],true,.7)+'"/>';
      s+='<path class="ln hair" d="'+wave(50,150,34,1.4,22)+'"/>';
      for(i=0;i<9;i++) s+='<circle class="dot" cx="'+(56+i*11)+'" cy="'+
        (34+Math.sin(i)*1.4).toFixed(1)+'" r="1" opacity=".3"/>';
      s+='<path class="ln hair" d="'+wave(6,52,42,1.2,18,1)+'"/>';
      return sv(156,50,s,' width="100%"');
    }
    function waterArt(w,h){
      var s='',k,i,th,rr,pts,R,N=96;
      s+='<path class="ln hair" d="'+wave(0,w,22,2.4,44)+'"/>';
      for(k=0;k<3;k++){
        pts=[]; R=120+k*72;
        for(i=0;i<=N;i++){ th=(i/N)*6.283; rr=R*(1+J(.008));
          pts.push([w/2+Math.cos(th)*rr, 44+Math.sin(th)*rr*.125]); }
        s+='<path class="ln hair" d="'+ink(pts,false,.3)+'" opacity="'+(.36-k*.09)+'"/>';
      }
      s+='<path class="ln hair" d="'+wave(0,w,72,1.9,44,2)+'"/>';
      return sv(w,h,s,' width="100%" height="100%" preserveAspectRatio="none"');
    }

    var ov=null;
    function closeCard(){
      if(ov&&ov.parentNode) ov.parentNode.removeChild(ov);
      ov=null;
      document.documentElement.style.overflow="";
      /* 看完别人寄来的，把地址栏收拾干净 */
      if(/[?&]card=/.test(location.search)){
        try{ history.replaceState(null,"",location.pathname+location.hash); }catch(e){}
      }
    }

    function cardMarkup(p,num,text,from){
      return '<div class="pc-stage">'+
        '<div class="pc-flip" id="pc-flip">'+
          '<div class="pc-side a">'+
            '<span class="pc-frame">'+frameArt(520,372,16)+'</span>'+
            '<div class="pc-in">'+
              '<div class="pc-photo"><img alt="'+seriesName(p)+'" src="'+p.src+'">'+
                '<span class="corners">'+cornersArt(448,266)+'</span></div>'+
              '<div class="pc-cap"><span>'+seriesName(p)+'</span><span>'+num+'</span></div>'+
            '</div>'+
          '</div>'+
          '<div class="pc-side b pc-b">'+
            '<span class="pc-frame">'+frameArt(520,372,16)+'</span>'+
            '<span class="rules">'+rulesArt()+'</span>'+
            '<span class="split">'+sv(4,316,'<path class="ln hair" d="'+
              ink([[2,0],[2,316]],false,1.3)+'"/>',' width="4" height="100%"')+'</span>'+
            '<div class="pc-msg" id="pc-msg"></div>'+
            '<div class="pc-sign" id="pc-sign"></div>'+
            '<span class="pc-stamp">'+stampArt()+'</span>'+
            '<span class="pc-pm">'+pmArt(stampDate)+'</span>'+
            '<span class="pc-addr">'+addrArt()+'</span>'+
            '<span class="pc-boat">'+boatArt()+'</span>'+
            '<div class="pc-brand">xiyanfan.com</div>'+
          '</div>'+
        '</div>'+
        '<span class="pc-wet">'+waterArt(560,88)+'</span>'+
      '</div>';
    }

    function openCard(o){
      closeCard();
      var i=idxOfNum(o.n); if(i<0) i=0;
      var p=P[i], num=numOf(i);

      ov=document.createElement("div");
      ov.className="pc-ov";
      ov.innerHTML='<button class="pc-x" type="button">Close 关闭</button>'+
        cardMarkup(p,num,"","")+
        '<div class="pc-tools" id="pc-tools"></div>';
      document.body.appendChild(ov);
      document.documentElement.style.overflow="hidden";

      var flip=ov.querySelector("#pc-flip"),
          msgEl=ov.querySelector("#pc-msg"),
          signEl=ov.querySelector("#pc-sign"),
          tools=ov.querySelector("#pc-tools");

      ov.querySelector(".pc-x").addEventListener("click",closeCard);
      flip.addEventListener("click",function(){ flip.classList.toggle("back"); });

      function paint(t,f){
        msgEl.textContent=t||"";
        signEl.textContent=f?("—— "+f):"";
      }

      if(o.mode==="read"){
        paint(o.t,o.f);
        setTimeout(function(){ flip.classList.add("back"); },700);
        tools.innerHTML='<p class="pc-note">Someone sent you this.'+
          '<i>有人寄了一张给你。点卡片可以翻面。</i></p>'+
          '<button class="pc-btn" type="button" id="pc-go">Look around 去看看这个站</button>';
        tools.querySelector("#pc-go").addEventListener("click",closeCard);
        return;
      }

      tools.innerHTML=
        '<p class="pc-note">Write on the back, then copy the link.'+
          '<i>写在背面，生成链接，发给谁都能打开。</i></p>'+
        '<textarea class="pc-ta" id="pc-ta" maxlength="'+MAXT+'" '+
          'placeholder="写一句话…"></textarea>'+
        '<input class="pc-name" id="pc-nm" maxlength="'+MAXN+'" placeholder="署名（可不填）">'+
        '<div class="pc-row">'+
          '<button class="pc-btn" type="button" id="pc-mk">Make the link 生成链接</button>'+
        '</div>'+
        '<p class="pc-ok" id="pc-ok"></p>'+
        '<p class="pc-link" id="pc-url"></p>';

      var ta=tools.querySelector("#pc-ta"),
          nm=tools.querySelector("#pc-nm"),
          mk=tools.querySelector("#pc-mk"),
          ok=tools.querySelector("#pc-ok"),
          urlEl=tools.querySelector("#pc-url");

      function sync(){ paint(ta.value,nm.value); }
      ta.addEventListener("input",sync);
      nm.addEventListener("input",sync);
      setTimeout(function(){ flip.classList.add("back"); ta.focus(); },600);

      mk.addEventListener("click",function(){
        var url=location.origin+location.pathname+"?card="+
                encCard({n:num,t:ta.value.slice(0,MAXT),f:nm.value.slice(0,MAXN)});
        urlEl.textContent=url;
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(url).then(function(){
            ok.textContent="Copied 已复制到剪贴板";
          },function(){ ok.textContent="Select the link below 下面的链接自己复制"; });
        }else{
          ok.textContent="Select the link below 下面的链接自己复制";
        }
      });
    }

    document.addEventListener("keydown",function(e){
      if(e.key==="Escape"&&ov) closeCard();
    });

    /* 有人寄来的：?card=… */
    (function(){
      var m=(location.search||"").match(/[?&]card=([^&]+)/);
      if(!m) return;
      var o=null;
      try{ o=decCard(decodeURIComponent(m[1])); }catch(e){ o=null; }
      if(!o||!o.n) return;
      setTimeout(function(){ openCard({mode:"read",n:o.n,t:o.t,f:o.f}); },400);
    })();
};
