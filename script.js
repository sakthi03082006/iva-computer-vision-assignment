const data={
template:{num:"01",eyebrow:"CLASSICAL COMPUTER VISION",title:"Template Matching",lead:"Template matching searches for a small reference image (the template) inside a larger image by comparing image regions and producing a similarity score.",flow:["Template image","Slide over image","Calculate similarity","Best match"],how:"The template is moved across the target image. At each position, a matching function such as correlation or normalized correlation estimates how similar the two regions are. The highest score indicates a likely location.",points:["Simple and easy to understand","Works well when the target appearance and scale are known","Sensitive to rotation, scale and major appearance changes","Often used for icons, logos and fixed patterns"],apps:["Object localization","UI testing","Industrial inspection","Pattern finding"]},
viola:{num:"02",eyebrow:"CLASSICAL DETECTION",title:"Viola–Jones Algorithm",lead:"Viola–Jones is a fast object-detection framework that became especially influential for real-time frontal face detection.",flow:["Haar-like features","Integral image","AdaBoost","Cascade classifier"],how:"Haar-like rectangular features capture intensity differences around facial structures. An integral image makes feature calculation fast. AdaBoost selects useful weak classifiers, and a cascade rejects non-face regions early so only promising windows reach later stages.",points:["Very fast for real-time detection","Uses Haar-like rectangular features","Integral images speed up feature computation","Cascade structure reduces unnecessary computation","Strong historical importance in face detection"],apps:["Face detection","Webcams","Surveillance","Human-computer interaction"]},
deepface:{num:"03",eyebrow:"DEEP LEARNING",title:"DeepFace",lead:"DeepFace is a deep neural-network system designed to learn highly discriminative facial representations for face verification.",flow:["Detect face","Align face","Deep CNN","Compare representations"],how:"A face is detected and geometrically aligned before being passed through a deep neural network. The network learns a representation that captures identity-related facial information, allowing two face images to be compared for verification.",points:["Uses deep convolutional neural networks","Alignment improves consistency","Learns facial features rather than hand-crafted rules","Designed for face verification and recognition","Demonstrated near human-level performance in its original work"],apps:["Face verification","Photo organization","Identity systems","Biometric research"]},
facenet:{num:"04",eyebrow:"METRIC LEARNING",title:"FaceNet",lead:"FaceNet maps each face image into a compact numerical vector called an embedding, where distances represent facial similarity.",flow:["Detect & align","CNN","128-D embedding*","Distance / identity"],how:"A neural network converts a face into an embedding. During training, triplet loss encourages an anchor and a matching face to be close while pushing a different person's face farther away. The resulting embeddings can be reused for verification, identification and clustering.",points:["Learns a compact face embedding","Uses triplet loss for metric learning","Euclidean distance can measure similarity","Embeddings can support recognition and clustering","Separates representation learning from the final matching rule"],apps:["Face verification","Face identification","Clustering","Access-control prototypes"],note:"*The original paper commonly describes 128-dimensional embeddings."}
};
const $=s=>document.querySelector(s);
function render(key){
 const d=data[key]; $("#detailNum").textContent=d.num;$("#detailEyebrow").textContent=d.eyebrow;$("#detailTitle").textContent=d.title;$("#detailLead").textContent=d.lead;
 $("#flow").innerHTML=d.flow.map((x,i)=>`<div class="step"><b>${String(i+1).padStart(2,"0")}</b><span>${x}</span></div>`).join("");
 $("#how").innerHTML=`<p>${d.how}</p>${d.note?`<p><strong style="color:white">${d.note}</strong></p>`:""}`;
 $("#points").innerHTML=d.points.map(x=>`<li>${x}</li>`).join("");
 $("#apps").innerHTML=d.apps.map(x=>`<span class="chip">${x}</span>`).join("");
 document.querySelector("#detail").scrollIntoView({behavior:"smooth",block:"start"});
}
document.querySelectorAll(".topic-card").forEach(c=>c.addEventListener("click",()=>render(c.dataset.topic)));
$("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");$("#themeBtn").textContent=document.body.classList.contains("dark")?"☀":"☾"});
render("template");

// Interactive image lab
let mainImage = null, templateImage = null;
const imageInput = document.getElementById("imageInput");
const templateInput = document.getElementById("templateInput");
const fileName = document.getElementById("fileName");

function readImage(file, cb){
  if(!file) return;
  const img = new Image();
  img.onload=()=>cb(img);
  img.src=URL.createObjectURL(file);
}
imageInput?.addEventListener("change", e=>{
  readImage(e.target.files[0], img=>{mainImage=img;fileName.textContent=e.target.files[0].name;
    document.getElementById("matchStatus").textContent="Main image loaded.";
    document.getElementById("detectStatus").textContent="Image ready for detection.";
    document.getElementById("deepStatus").textContent="Image ready for analysis.";
    document.getElementById("faceStatus").textContent="Image ready for embedding demo.";
  });
});
templateInput?.addEventListener("change", e=>{
  readImage(e.target.files[0], img=>{templateImage=img;document.getElementById("matchStatus").textContent="Main image + template loaded.";});
});

document.querySelectorAll(".lab-tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".lab-tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".lab-panel").forEach(x=>x.classList.add("hidden"));
  btn.classList.add("active"); document.getElementById(btn.dataset.lab).classList.remove("hidden");
}));

function drawScaled(canvas,img,max=1000){
  const scale=Math.min(1,max/img.width,max/img.height);
  canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
  return scale;
}

document.getElementById("matchBtn")?.addEventListener("click",()=>{
  const status=document.getElementById("matchStatus"), canvas=document.getElementById("matchCanvas");
  if(!mainImage||!templateImage){status.textContent="Choose both the main image and template.";return;}
  const max=700, scale=Math.min(1,max/mainImage.width,max/mainImage.height);
  const w=Math.round(mainImage.width*scale),h=Math.round(mainImage.height*scale);
  canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");ctx.drawImage(mainImage,0,0,w,h);
  const tempMax=Math.min(140,Math.round(templateImage.width*scale)), tw=tempMax, th=Math.round(templateImage.height*(tw/templateImage.width));
  const tc=document.createElement("canvas");tc.width=tw;tc.height=th;tc.getContext("2d").drawImage(templateImage,0,0,tw,th);
  const a=ctx.getImageData(0,0,w,h).data,b=tc.getContext("2d").getImageData(0,0,tw,th).data;
  const gray=(d,i)=>.299*d[i]+.587*d[i+1]+.114*d[i+2];
  let best=Infinity,bx=0,by=0;
  const step=Math.max(2,Math.floor(Math.min(tw,th)/35));
  for(let y=0;y<=h-th;y+=step) for(let x=0;x<=w-tw;x+=step){
    let err=0,n=0;
    for(let j=0;j<th;j+=Math.max(1,Math.floor(th/18))) for(let i=0;i<tw;i+=Math.max(1,Math.floor(tw/18))){
      const p=(y+j)*w+x+i,q=j*tw+i; err+=Math.abs(gray(a,p*4)-gray(b,q*4));n++;
    }
    err/=n;if(err<best){best=err;bx=x;by=y;}
  }
  ctx.strokeStyle="#00e0c0";ctx.lineWidth=4;ctx.strokeRect(bx,by,tw,th);
  ctx.fillStyle="#00e0c0";ctx.font="bold 14px Inter";ctx.fillText("BEST MATCH",(bx+6),Math.max(18,by-8));
  status.textContent=`Match found at (${bx}, ${by}) • lower error = better match.`;
});

document.getElementById("detectBtn")?.addEventListener("click",async()=>{
  const status=document.getElementById("detectStatus"),canvas=document.getElementById("detectCanvas");
  if(!mainImage){status.textContent="Choose an image first.";return;}
  if(typeof cv==="undefined"||!cv.Mat){status.textContent="OpenCV.js is still loading. Try again in a moment.";return;}
  const scale=drawScaled(canvas,mainImage,900),ctx=canvas.getContext("2d");
  status.textContent="Loading Haar cascade…";
  try{
    const url="https://raw.githubusercontent.com/opencv/opencv/4.x/data/haarcascades/haarcascade_frontalface_default.xml";
    const xml=await fetch(url).then(r=>r.text());
    const bytes=new TextEncoder().encode(xml);cv.FS_createDataFile("/", "face.xml", bytes, true, false, false);
    const src=cv.imread(canvas),grayMat=new cv.Mat();cv.cvtColor(src,grayMat,cv.COLOR_RGBA2GRAY);
    const faces=new cv.RectVector(),classifier=new cv.CascadeClassifier();classifier.load("face.xml");
    classifier.detectMultiScale(grayMat,faces,1.1,4,0);
    ctx.strokeStyle="#00e0c0";ctx.lineWidth=4;
    for(let i=0;i<faces.size();i++){const r=faces.get(i);ctx.strokeRect(r.x,r.y,r.width,r.height);}
    status.textContent=`Detected ${faces.size()} face(s) using the Viola–Jones Haar cascade.`;
    src.delete();grayMat.delete();faces.delete();classifier.delete();
  }catch(e){status.textContent="Cascade could not be loaded. Check your internet connection and try again.";}
});

function imageHashVector(img,n=32){
  const c=document.createElement("canvas");c.width=16;c.height=16;c.getContext("2d").drawImage(img,0,0,16,16);
  const d=c.getContext("2d").getImageData(0,0,16,16).data;let v=[];
  for(let i=0;i<d.length;i+=4)v.push((.299*d[i]+.587*d[i+1]+.114*d[i+2])/255);
  return Array.from({length:n},(_,k)=>v[Math.floor(k*v.length/n)]);
}
document.getElementById("deepBtn")?.addEventListener("click",()=>{
  const s=document.getElementById("deepStatus"),p=document.getElementById("deepPreview");
  if(!mainImage){s.textContent="Choose an image first.";return;}
  const v=imageHashVector(mainImage,48);p.innerHTML=v.map(x=>`<div class="feature-bar" style="height:${20+x*100}px"></div>`).join("");
  s.textContent="Image preprocessing complete. This visualization represents the feature-vector stage; original DeepFace inference requires a server-side model.";
});
document.getElementById("faceBtn")?.addEventListener("click",()=>{
  const s=document.getElementById("faceStatus"),box=document.getElementById("embedding");
  if(!mainImage){s.textContent="Choose an image first.";return;}
  const v=imageHashVector(mainImage,32);box.innerHTML=v.map((x,i)=>`<span>e${i+1}: ${((x-.5)*2).toFixed(4)}</span>`).join("");
  s.textContent="Demo embedding generated. Original FaceNet inference requires a trained FaceNet model/runtime.";
});
