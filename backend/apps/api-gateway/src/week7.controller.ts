import { Body, Controller, Post } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const STOP = new Set(['avec','pour','dans','une','les','des','the','and','from','this','that','stage','offre','vous','votre','et','de','du','en','un','nous','recherchons','stagiaire','maitrisant','developper','application','web','projet','experience']);
const SKILLS = new Set(['javascript','typescript','angular','react','vue','node.js','nodejs','nestjs','python','java','spring','postgresql','mysql','mongodb','docker','git','html','css','rest','api','aws','azure','figma','flutter','kotlin','c++','c#']);
function tokens(value:string):string[]{return (value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9+#.-]{2,}/g)?.filter(token=>!STOP.has(token))||[];}
function pdfEscape(value:string){return value.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\x7E]/g,'?');}
function createPdf(lines:string[]):string {
 const content=['q','62 0 0 62 50 742 cm','/Im1 Do','Q','BT','/F1 24 Tf','1 1 1 rg','128 790 Td','(INTERNLINK) Tj','/F1 11 Tf','0 -24 Td','(LETTRE D AFFECTATION) Tj','0 0 0 rg','-78 -78 Td'];
 lines.forEach((line,index)=>{const heading=line.startsWith('##');const separator=line==='--';if(index)content.push('0 -26 Td');if(separator){content.push('0.83 0.35 0.18 RG','1.2 w','0 8 m','495 8 l','S','0 12 Td');}else{content.push(heading?'/F1 17 Tf':'/F1 11.5 Tf',heading?'0.83 0.35 0.18 rg':'0.12 0.17 0.22 rg',`(${pdfEscape(line.replace(/^## /,''))}) Tj`);}});content.push('ET');
 const stream=Buffer.from(content.join('\n'));let logo:Buffer;try{logo=readFileSync(join(process.cwd(),'apps/api-gateway/interlink-crop.jpg'));}catch{logo=Buffer.alloc(0);}const parts:Buffer[]=[];const offsets:number[]=[];let pdf=Buffer.from('%PDF-1.4\n');const add=(n:number,b:Buffer)=>{offsets[n]=pdf.length;pdf=Buffer.concat([pdf,Buffer.from(`${n} 0 obj\n`),b,Buffer.from('\nendobj\n')]);};add(1,Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'));add(2,Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));add(3,Buffer.from('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 5 0 R >>'));add(4,Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'));add(5,Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`),stream,Buffer.from('\nendstream')]));add(6,Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width 2048 /Height 2048 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.length} >>\nstream\n`),logo,Buffer.from('\nendstream')]));const xref=pdf.length;let table=`xref\n0 7\n0000000000 65535 f \n`;for(let i=1;i<=6;i++)table+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf=Buffer.concat([pdf,Buffer.from(table+`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)]);return pdf.toString('base64'); }@Controller('week7')
export class Week7Controller {
 @Post('analyze-cv')
 async analyze(@Body() body:{text?:string}) {
  const text=(body.text||'').trim();
  const local=this.localAnalysis(text);
  const key=(process.env.GEMINI_API_KEY||'').trim();
  if (!key || !text) return local;
  try {
   const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key='+encodeURIComponent(key),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'Analyse ce CV et réponds uniquement en JSON avec les champs skills (tableau de compétences), summary (résumé court), confidence (nombre entre 0 et 1). CV:\\n'+text.slice(0,12000)}]}]})});
   if(response.ok){const data=await response.json() as any; const raw=String(data?.candidates?.[0]?.content?.parts?.[0]?.text||'').replace(/^`json\\s*|\\s*`$/g,'').trim(); const parsed=JSON.parse(raw); return {...local,provider:'gemini',summary:String(parsed.summary||local.summary),skills:Array.isArray(parsed.skills)?parsed.skills.slice(0,20):local.skills,confidence:Number(parsed.confidence)||local.confidence};}
  } catch { /* fallback local */ }
  return local;
 }
 private localAnalysis(text:string){const words=[...new Set(tokens(text))];const emails=text.match(/[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}/g)||[];const phones=text.match(/(?:\\+?\\d[\\d .()-]{7,}\\d)/g)||[];return {provider:'local',summary:text.slice(0,300),skills:words.filter(word=>SKILLS.has(word)).slice(0,20),contacts:{emails,phones},confidence:text?0.78:0};}
 @Post('match') match(@Body() body:{cvText?:string;offerText?:string;technologies?:string[]}){const cv=new Set(tokens(body.cvText||'').filter(word=>SKILLS.has(word)));const required=[...new Set([...(body.technologies||[]).flatMap(tokens),...tokens(body.offerText||'')].filter(word=>SKILLS.has(word)))];const matched=required.filter(word=>cv.has(word));const score=required.length?Math.round(matched.length/required.length*100):0;return {score,matchedSkills:matched,missingSkills:required.filter(word=>!cv.has(word)).slice(0,15),recommendation:score>=70?'Profil très compatible':score>=45?'Profil compatible avec accompagnement':'Profil à renforcer'};}
 @Post('convention') convention(@Body() body:{studentName?:string;companyName?:string;offerTitle?:string;startDate?:string;endDate?:string}){const lines=['## INTERNLINK','LETTRE D AFFECTATION','Convention de stage','--','A l attention de : '+(body.studentName||'Etudiant'),'Objet : Affectation pour un stage en entreprise','--','## DETAILS DE LA MISSION','Entreprise d accueil : '+(body.companyName||'Non renseignee'),'Intitule du stage : '+(body.offerTitle||'Non renseigne'),'Date de debut : '+(body.startDate||'Non renseignee'),'Date de fin : '+(body.endDate||'Non renseignee'),'--','## ENGAGEMENT','La presente lettre confirme l affectation du candidat au stage indique ci-dessus.','Les parties s engagent a respecter les conditions de la convention.','--','Fait le '+new Date().toLocaleDateString('fr-FR'),'Signature du candidat : ____________________','Signature de l entreprise : ____________________'];return {fileName:'convention-stage.pdf',mimeType:'application/pdf',data:'data:application/pdf;base64,'+createPdf(lines)};}
 @Post('evaluation') evaluation(@Body() body:{technical?:number;integration?:number;professionalism?:number;comment?:string}){const scores=[body.technical||0,body.integration||0,body.professionalism||0].map(Number);const average=Math.round(scores.reduce((a,b)=>a+b,0)/3*10)/10;return {average,decision:average>=14?'Très satisfaisant':average>=10?'Satisfaisant':'À améliorer',comment:body.comment||''};}
}











