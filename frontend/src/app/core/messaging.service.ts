import { Injectable } from '@angular/core';
export interface Attachment { name: string; mimeType: string; data: string; }
export interface Message { id:string; application_id:string; sender_user_id:string; sender_email?:string; body:string; created_at:string; attachment_name?:string; attachment_mime_type?:string; attachment_data?:string; }
@Injectable({providedIn:'root'}) export class MessagingService {
 async list(applicationId:string,userId:string):Promise<{messages:Message[]}>{return this.request(`/api/messages/application/${applicationId}?userId=${encodeURIComponent(userId)}`);}
 async send(applicationId:string,senderUserId:string,body:string,attachment?:Attachment):Promise<{message:Message}>{return this.request('/api/messages',{applicationId,senderUserId,body,attachment},'POST');}
 private async request<T>(path:string,body?:unknown,method:'GET'|'POST'='GET'):Promise<T>{const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:method==='POST'?JSON.stringify(body||{}):undefined});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error((payload as {message?:string}).message||`Erreur ${response.status}`);return payload as T;}
}
